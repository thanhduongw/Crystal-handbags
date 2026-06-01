import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    Col,
    Empty,
    Image,
    Input,
    message,
    Modal,
    Row,
    Segmented,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
    Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    AppstoreOutlined,
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    PictureOutlined,
    ReloadOutlined,
    SearchOutlined,
    TableOutlined,
    UploadOutlined,
} from '@ant-design/icons';
import {
    createProduct,
    deleteProduct,
    deleteProductImage,
    fetchProductDetail,
    fetchProducts,
    updateProduct,
    uploadProductImage,
} from '../../api/productAPI';
import type { ProductDetailDto, ProductListDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import ProductForm, { type ProductFormUploadFiles } from '../../components/ProductForm';

const { Text } = Typography;

type ApiError = {
    response?: {
        data?: {
            message?: string;
        };
    };
};

type ViewMode = 'table' | 'grid';
type StockFilter = 'all' | 'inStock' | 'lowStock' | 'outOfStock' | 'unknown';

type AdminProductRow = ProductListDto & {
    stockQuantity?: number;
    variantCount?: number;
};

const getApiErrorMessage = (error: unknown, fallback: string) =>
    (error as ApiError).response?.data?.message || fallback;

const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    });

const getStockTag = (stock?: number) => {
    if (typeof stock !== 'number') return <Tag className="admin-tag">Chưa có dữ liệu</Tag>;
    if (stock <= 0) return <Tag className="admin-tag" color="red">Hết hàng</Tag>;
    if (stock <= 5) return <Tag className="admin-tag" color="orange">Sắp hết: {stock}</Tag>;
    return <Tag className="admin-tag" color="green">Còn hàng: {stock}</Tag>;
};

export default function AdminProducts() {
    const { isAdmin } = useAuth();
    const [products, setProducts] = useState<AdminProductRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<ProductDetailDto | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductDetailDto | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState('');
    const [searchText, setSearchText] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [homepageFilter, setHomepageFilter] = useState<boolean | undefined>();
    const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
    const [stockFilter, setStockFilter] = useState<StockFilter>('all');
    const [viewMode, setViewMode] = useState<ViewMode>('table');

    useEffect(() => {
        void load();
    }, []);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => setDebouncedSearch(searchText), 300);
        return () => window.clearTimeout(timeoutId);
    }, [searchText]);

    const load = async () => {
        try {
            setLoading(true);
            const data = await fetchProducts();

            const enriched = await Promise.all(
                data.map(async (product): Promise<AdminProductRow> => {
                    try {
                        const detail = await fetchProductDetail(product.productId);
                        const stockQuantity = detail.items?.reduce((sum, item) => sum + item.stockQuantity, 0);
                        return {
                            ...product,
                            stockQuantity,
                            variantCount: detail.items?.length ?? 0,
                        };
                    } catch {
                        return product;
                    }
                })
            );

            setProducts(enriched);
        } catch (error) {
            console.error('Load products error:', error);
            message.error('Tải sản phẩm thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (product: AdminProductRow) => {
        Modal.confirm({
            title: 'Xóa sản phẩm?',
            content: `Sản phẩm "${product.name}" sẽ bị xóa khỏi cửa hàng.`,
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteProduct(product.productId);
                    message.success('Đã xóa sản phẩm');
                    void load();
                } catch (error: unknown) {
                    console.error('Delete error:', error);
                    message.error(getApiErrorMessage(error, 'Xóa thất bại'));
                }
            },
        });
    };

    const handleEdit = async (record: AdminProductRow) => {
        try {
            setLoading(true);
            const detail = await fetchProductDetail(record.productId);
            setEditing(detail);
            setModalVisible(true);
        } catch (error) {
            console.error('Fetch detail error:', error);
            message.error(getApiErrorMessage(error, 'Không thể tải chi tiết sản phẩm'));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (
        product: ProductDetailDto,
        isEdit: boolean,
        files?: ProductFormUploadFiles
    ) => {
        try {
            setSubmitting(true);

            let savedProduct: ProductDetailDto;

            if (isEdit && editing) {
                savedProduct = await updateProduct(editing.productId!, product);
            } else {
                savedProduct = await createProduct(product);
            }

            const productId = isEdit && editing
                ? editing.productId!
                : savedProduct.productId!;

            if (files?.avatarFile && productId) {
                const uploadedAvatarUrl = await uploadProductImage(productId, files.avatarFile);
                const latestProduct = await fetchProductDetail(productId);

                await updateProduct(productId, {
                    ...latestProduct,
                    avatar: uploadedAvatarUrl,
                });
            }

            if (files?.imageFiles && files.imageFiles.length > 0 && productId) {
                for (const file of files.imageFiles) {
                    await uploadProductImage(productId, file);
                }
            }

            message.success(isEdit ? 'Cập nhật thành công' : 'Tạo sản phẩm thành công');
            setModalVisible(false);
            setEditing(null);
            void load();
        } catch (error: unknown) {
            console.error('Submit error:', error);
            message.error(getApiErrorMessage(error, 'Lưu thất bại'));
        } finally {
            setSubmitting(false);
        }
    };

    const handleManageImages = async (record: AdminProductRow) => {
        try {
            const detail = await fetchProductDetail(record.productId);
            setSelectedProduct(detail);
            setImageModalVisible(true);
            setNewImageUrl('');
        } catch (error) {
            console.error('Fetch product error:', error);
            message.error(getApiErrorMessage(error, 'Không thể tải chi tiết sản phẩm'));
        }
    };

    const handleUploadImage = async (file: File) => {
        if (!selectedProduct) return;

        if (!file.type.startsWith('image/')) {
            message.error('Chỉ chấp nhận file ảnh!');
            return;
        }

        if (file.size / 1024 / 1024 >= 5) {
            message.error('Ảnh phải nhỏ hơn 5MB!');
            return;
        }

        try {
            setUploadingImage(true);
            await uploadProductImage(selectedProduct.productId!, file);
            message.success('Upload thành công');
            const updated = await fetchProductDetail(selectedProduct.productId!);
            setSelectedProduct(updated);
            void load();
        } catch (error: unknown) {
            console.error('Upload error:', error);
            message.error(getApiErrorMessage(error, 'Upload thất bại'));
        } finally {
            setUploadingImage(false);
        }
    };

    const handleDeleteImage = async (imageUrl: string) => {
        if (!selectedProduct) return;

        Modal.confirm({
            title: 'Xóa ảnh?',
            content: 'Ảnh sẽ bị gỡ khỏi sản phẩm này.',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteProductImage(selectedProduct.productId!, imageUrl);
                    message.success('Đã xóa ảnh');
                    const updated = await fetchProductDetail(selectedProduct.productId!);
                    setSelectedProduct(updated);
                    void load();
                } catch (error: unknown) {
                    console.error('Delete image error:', error);
                    message.error(getApiErrorMessage(error, 'Xóa ảnh thất bại'));
                }
            },
        });
    };

    const handleAddImageByUrl = async () => {
        if (!selectedProduct) return;

        const url = newImageUrl.trim();
        if (!url) {
            message.error('Vui lòng nhập URL ảnh');
            return;
        }

        try {
            new URL(url);
        } catch {
            message.error('URL không hợp lệ');
            return;
        }

        try {
            setUploadingImage(true);
            const images = Array.isArray(selectedProduct.images)
                ? [...selectedProduct.images]
                : [];
            images.push(url);

            await updateProduct(selectedProduct.productId!, {
                ...selectedProduct,
                images,
            });
            message.success('Thêm ảnh bằng URL thành công');

            const updated = await fetchProductDetail(selectedProduct.productId!);
            setSelectedProduct(updated);
            setNewImageUrl('');
            void load();
        } catch (error: unknown) {
            console.error('Add image by URL error:', error);
            message.error(getApiErrorMessage(error, 'Thêm ảnh thất bại'));
        } finally {
            setUploadingImage(false);
        }
    };

    const categoryOptions = useMemo(
        () => Array.from(new Set(products.map(product => product.categoryName)))
            .filter(Boolean)
            .map(category => ({ value: category, label: category })),
        [products]
    );

    const filteredProducts = useMemo(() => {
        const search = debouncedSearch.trim().toLowerCase();

        return products.filter(product => {
            const stock = product.stockQuantity;
            const matchesSearch = !search ||
                product.name.toLowerCase().includes(search) ||
                product.categoryName.toLowerCase().includes(search);
            const matchesHomepage = homepageFilter === undefined ||
                product.showHomepage === homepageFilter;
            const matchesCategory = !categoryFilter || product.categoryName === categoryFilter;
            const matchesStock =
                stockFilter === 'all' ||
                (stockFilter === 'unknown' && typeof stock !== 'number') ||
                (stockFilter === 'outOfStock' && typeof stock === 'number' && stock <= 0) ||
                (stockFilter === 'lowStock' && typeof stock === 'number' && stock > 0 && stock <= 5) ||
                (stockFilter === 'inStock' && typeof stock === 'number' && stock > 5);

            return matchesSearch && matchesHomepage && matchesCategory && matchesStock;
        });
    }, [products, debouncedSearch, homepageFilter, categoryFilter, stockFilter]);

    const lowStockCount = useMemo(
        () => products.filter(product => typeof product.stockQuantity === 'number' && product.stockQuantity <= 5).length,
        [products]
    );

    const columns: ColumnsType<AdminProductRow> = [
        {
            title: 'Sản phẩm',
            key: 'product',
            width: 360,
            render: (_, record) => (
                <div className="admin-entity-cell">
                    <Image
                        src={record.avatar || 'https://placehold.co/80x80?text=No+Image'}
                        alt={record.name}
                        width={56}
                        height={56}
                        preview={false}
                        className="admin-entity-image"
                        fallback="https://placehold.co/80x80?text=Error"
                    />
                    <div style={{ minWidth: 0 }}>
                        <div className="admin-entity-title">
                            {record.name}
                        </div>
                        <div className="admin-entity-meta">ID #{record.productId}</div>
                    </div>
                </div>
            ),
            sorter: (a, b) => a.name.localeCompare(b.name, 'vi'),
        },
        {
            title: 'Danh mục',
            dataIndex: 'categoryName',
            key: 'categoryName',
            width: 180,
            render: (categoryName: string) => <Tag className="admin-tag">{categoryName}</Tag>,
            sorter: (a, b) => a.categoryName.localeCompare(b.categoryName, 'vi'),
        },
        {
            title: 'Giá bán',
            dataIndex: 'basePrice',
            key: 'basePrice',
            width: 150,
            render: (value: number) => <span className="admin-money">{formatCurrency(value)}</span>,
            sorter: (a, b) => a.basePrice - b.basePrice,
        },
        {
            title: 'Tồn kho',
            key: 'stock',
            width: 150,
            render: (_, record) => getStockTag(record.stockQuantity),
            sorter: (a, b) => (a.stockQuantity ?? -1) - (b.stockQuantity ?? -1),
        },
        {
            title: 'Trang chủ',
            dataIndex: 'showHomepage',
            key: 'showHomepage',
            width: 130,
            render: (value: boolean) => (
                <Tag className="admin-tag" color={value ? 'green' : 'default'}>
                    {value ? 'Đang hiển thị' : 'Không'}
                </Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            fixed: 'right',
            align: 'right',
            render: (_, record) => (
                <Space size={4}>
                    <Tooltip title="Quản lý ảnh">
                        <Button
                            className="admin-icon-button"
                            icon={<PictureOutlined />}
                            onClick={() => handleManageImages(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Sửa sản phẩm">
                        <Button
                            className="admin-icon-button"
                            icon={<EditOutlined />}
                            onClick={() => handleEdit(record)}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa sản phẩm">
                        <Button
                            className="admin-icon-button"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDelete(record)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div className="admin-page-actions">
                    <Segmented
                        value={viewMode}
                        onChange={(value) => setViewMode(value as ViewMode)}
                        options={[
                            { value: 'table', icon: <TableOutlined />, label: 'Table' },
                            { value: 'grid', icon: <AppstoreOutlined />, label: 'Grid' },
                        ]}
                    />
                    <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
                        Làm mới
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditing(null);
                            setModalVisible(true);
                        }}
                    >
                        Thêm sản phẩm
                    </Button>
                </div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={8}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Tổng sản phẩm</div>
                        <div className="admin-stat-value">{products.length}</div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Hiển thị trang chủ</div>
                        <div className="admin-stat-value">{products.filter(product => product.showHomepage).length}</div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Sắp hết hàng</div>
                        <div className="admin-stat-value">{lowStockCount}</div>
                    </Card>
                </Col>
            </Row>

            <Card className="admin-toolbar-card">
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} lg={7}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Tìm tên sản phẩm hoặc danh mục..."
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={4}>
                        <Select
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Danh mục"
                            value={categoryFilter}
                            onChange={setCategoryFilter}
                            options={categoryOptions}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={4}>
                        <Select
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Trang chủ"
                            value={homepageFilter}
                            onChange={setHomepageFilter}
                            options={[
                                { value: true, label: 'Đang hiển thị' },
                                { value: false, label: 'Không hiển thị' },
                            ]}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={4}>
                        <Select
                            style={{ width: '100%' }}
                            value={stockFilter}
                            onChange={setStockFilter}
                            options={[
                                { value: 'all', label: 'Tất cả tồn kho' },
                                { value: 'inStock', label: 'Còn hàng' },
                                { value: 'lowStock', label: 'Sắp hết' },
                                { value: 'outOfStock', label: 'Hết hàng' },
                                { value: 'unknown', label: 'Chưa có dữ liệu' },
                            ]}
                        />
                    </Col>
                </Row>
                <div className="admin-toolbar-footer">
                    <span className="admin-muted">Đang xem {filteredProducts.length} / {products.length} sản phẩm</span>
                    <Button
                        size="small"
                        onClick={() => {
                            setSearchText('');
                            setCategoryFilter(undefined);
                            setHomepageFilter(undefined);
                            setStockFilter('all');
                        }}
                    >
                        Xóa lọc
                    </Button>
                </div>
            </Card>

            {viewMode === 'table' ? (
                <Card className="admin-table-card">
                    <Table
                        rowKey="productId"
                        columns={columns}
                        dataSource={filteredProducts}
                        loading={loading}
                        pagination={{
                            pageSize: 10,
                            showTotal: (total, range) => `${range[0]}-${range[1]} trong ${total} sản phẩm`,
                            showSizeChanger: true,
                            showQuickJumper: true,
                        }}
                        scroll={{ x: 1180 }}
                        locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có sản phẩm phù hợp" /> }}
                    />
                </Card>
            ) : (
                <div className="admin-product-grid">
                    {filteredProducts.map(product => (
                        <Card
                            key={product.productId}
                            className="admin-product-card"
                            cover={
                                <Image
                                    src={product.avatar || 'https://placehold.co/360x240?text=No+Image'}
                                    alt={product.name}
                                    height={180}
                                    preview={false}
                                    style={{ objectFit: 'cover' }}
                                />
                            }
                            actions={[
                                <Tooltip title="Quản lý ảnh" key="image">
                                    <PictureOutlined onClick={() => handleManageImages(product)} />
                                </Tooltip>,
                                <Tooltip title="Sửa sản phẩm" key="edit">
                                    <EditOutlined onClick={() => handleEdit(product)} />
                                </Tooltip>,
                                <Tooltip title="Xóa sản phẩm" key="delete">
                                    <DeleteOutlined onClick={() => handleDelete(product)} />
                                </Tooltip>,
                            ]}
                        >
                            <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                <div className="admin-entity-title">{product.name}</div>
                                <Space wrap>
                                    <Tag className="admin-tag">{product.categoryName}</Tag>
                                    {getStockTag(product.stockQuantity)}
                                </Space>
                                <Text strong>{formatCurrency(product.basePrice)}</Text>
                            </Space>
                        </Card>
                    ))}
                    {filteredProducts.length === 0 && (
                        <Card className="admin-empty-state-card">
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có sản phẩm phù hợp" />
                        </Card>
                    )}
                </div>
            )}

            <ProductForm
                visible={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditing(null);
                }}
                onSubmit={handleSubmit}
                initialValues={editing || undefined}
                isEdit={!!editing}
                submitting={submitting}
            />

            <Modal
                open={imageModalVisible}
                title={`Quản lý ảnh - ${selectedProduct?.name || ''}`}
                onCancel={() => {
                    setImageModalVisible(false);
                    setSelectedProduct(null);
                }}
                footer={null}
                width={860}
            >
                {selectedProduct && (
                    <div>
                        <Card className="admin-toolbar-card">
                            <Row gutter={[12, 12]} align="middle">
                                <Col>
                                    <Upload
                                        listType="picture-card"
                                        showUploadList={false}
                                        beforeUpload={(file) => {
                                            void handleUploadImage(file);
                                            return false;
                                        }}
                                        accept="image/*"
                                        disabled={uploadingImage}
                                    >
                                        <div>
                                            <UploadOutlined />
                                            <div style={{ marginTop: 8 }}>
                                                {uploadingImage ? 'Đang upload...' : 'Upload ảnh'}
                                            </div>
                                        </div>
                                    </Upload>
                                </Col>

                                <Col flex="auto">
                                    <Space.Compact style={{ width: '100%' }}>
                                        <Input
                                            placeholder="Hoặc dán URL ảnh vào đây..."
                                            value={newImageUrl}
                                            onChange={(event) => setNewImageUrl(event.target.value)}
                                            onPressEnter={handleAddImageByUrl}
                                            disabled={uploadingImage}
                                        />
                                        <Button
                                            onClick={handleAddImageByUrl}
                                            loading={uploadingImage}
                                            type="primary"
                                        >
                                            Thêm
                                        </Button>
                                    </Space.Compact>
                                    <div className="admin-entity-meta" style={{ marginTop: 8 }}>
                                        Hỗ trợ JPG, PNG, GIF. Tối đa 5MB.
                                    </div>
                                </Col>
                            </Row>
                        </Card>

                        <div className="admin-image-grid">
                            {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                selectedProduct.images.map((img, idx) => (
                                    <div key={`${img}-${idx}`} className="admin-image-tile">
                                        <Image
                                            src={img}
                                            alt={`Sản phẩm ${idx}`}
                                            width="100%"
                                            height={150}
                                            style={{ objectFit: 'cover' }}
                                        />
                                        <Tooltip title="Xóa ảnh">
                                            <Button
                                                danger
                                                size="small"
                                                icon={<DeleteOutlined />}
                                                style={{ position: 'absolute', top: 8, right: 8 }}
                                                onClick={() => handleDeleteImage(img)}
                                            />
                                        </Tooltip>
                                        {img === selectedProduct.avatar && (
                                            <Tag
                                                color="blue"
                                                className="admin-tag"
                                                style={{ position: 'absolute', bottom: 8, left: 8 }}
                                            >
                                                Avatar
                                            </Tag>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <Card style={{ gridColumn: '1 / -1', textAlign: 'center' }}>
                                    <AppstoreOutlined style={{ color: '#94a3b8', fontSize: 28 }} />
                                    <div className="admin-muted" style={{ marginTop: 8 }}>
                                        Chưa có ảnh nào
                                    </div>
                                </Card>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

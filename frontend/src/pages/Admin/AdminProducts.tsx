import { useEffect, useMemo, useState } from 'react';
import {
    Table, Button, Space, Typography, message, Modal, Image,
    Upload, Tag, Input, Row, Col, Card, Tooltip, Select
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
    PictureOutlined, SearchOutlined, ReloadOutlined, AppstoreOutlined
} from '@ant-design/icons';
import {
    fetchProducts, createProduct, updateProduct, deleteProduct,
    uploadProductImage, deleteProductImage, fetchProductDetail
} from '../../api/productAPI';
import type { ProductListDto, ProductDetailDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import ProductForm, { type ProductFormUploadFiles } from '../../components/ProductForm';

const { Title } = Typography;

type ApiError = {
    response?: {
        data?: {
            message?: string;
        };
    };
};

const getApiErrorMessage = (error: unknown, fallback: string) =>
    (error as ApiError).response?.data?.message || fallback;

const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    });

export default function AdminProducts() {
    const { isAdmin } = useAuth();
    const [products, setProducts] = useState<ProductListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editing, setEditing] = useState<ProductDetailDto | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [imageModalVisible, setImageModalVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<ProductDetailDto | null>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [newImageUrl, setNewImageUrl] = useState<string>('');
    const [searchText, setSearchText] = useState<string>('');
    const [homepageFilter, setHomepageFilter] = useState<boolean | undefined>();

    useEffect(() => {
        void load();
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await fetchProducts();
            setProducts(data);
        } catch (error) {
            console.error('Load products error:', error);
            message.error('Tải sản phẩm thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number, name: string) => {
        Modal.confirm({
            title: 'Xóa sản phẩm?',
            content: `Sản phẩm "${name}" sẽ bị xóa hoặc ẩn khỏi cửa hàng nếu đã có lịch sử đơn hàng.`,
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteProduct(id);
                    message.success('Đã xóa sản phẩm');
                    void load();
                } catch (error: unknown) {
                    console.error('Delete error:', error);
                    message.error(getApiErrorMessage(error, 'Xóa thất bại'));
                }
            }
        });
    };

    const handleEdit = async (record: ProductListDto) => {
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

    const handleManageImages = async (record: ProductListDto) => {
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
            }
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

    const filteredProducts = useMemo(() => {
        const search = searchText.trim().toLowerCase();

        return products.filter(product => {
            const matchesSearch = !search ||
                product.name.toLowerCase().includes(search) ||
                product.categoryName.toLowerCase().includes(search);
            const matchesHomepage = homepageFilter === undefined ||
                product.showHomepage === homepageFilter;

            return matchesSearch && matchesHomepage;
        });
    }, [products, searchText, homepageFilter]);

    const categoriesCount = useMemo(
        () => new Set(products.map(product => product.categoryName)).size,
        [products]
    );

    const columns: ColumnsType<ProductListDto> = [
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
                        <div className="admin-entity-title">{record.name}</div>
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
                            onClick={() => handleDelete(record.productId, record.name)}
                        />
                    </Tooltip>
                </Space>
            )
        }
    ];

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <div className="admin-page-eyebrow">Sản phẩm</div>
                    <Title level={2} className="admin-page-title">Danh mục hàng hóa</Title>
                    <p className="admin-page-subtitle">
                        Quản lý giá, hình ảnh, biến thể và khả năng hiển thị của sản phẩm.
                    </p>
                </div>
                <div className="admin-page-actions">
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
                        <div className="admin-stat-footnote">Đang có trong danh mục bán hàng</div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Hiển thị trang chủ</div>
                        <div className="admin-stat-value">{products.filter(product => product.showHomepage).length}</div>
                        <div className="admin-stat-footnote">Sản phẩm được ưu tiên giới thiệu</div>
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Nhóm danh mục</div>
                        <div className="admin-stat-value">{categoriesCount}</div>
                        <div className="admin-stat-footnote">Danh mục có sản phẩm</div>
                    </Card>
                </Col>
            </Row>

            <Card className="admin-toolbar-card">
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} md={12}>
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Tìm theo tên sản phẩm hoặc danh mục..."
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <Select
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Hiển thị trang chủ"
                            value={homepageFilter}
                            onChange={setHomepageFilter}
                            options={[
                                { value: true, label: 'Đang hiển thị' },
                                { value: false, label: 'Không hiển thị' },
                            ]}
                        />
                    </Col>
                    <Col xs={24} md={6}>
                        <div className="admin-muted">
                            Đang xem {filteredProducts.length} / {products.length} sản phẩm
                        </div>
                    </Col>
                </Row>
            </Card>

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
                    scroll={{ x: 980 }}
                />
            </Card>

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
                                    <div key={idx} className="admin-image-tile">
                                        <Image
                                            src={img}
                                            alt={`Product ${idx}`}
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

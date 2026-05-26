import { useEffect, useState, useMemo } from 'react';
import {
    Table, Button, Space, Typography, message, Modal, Image,
    Upload, Tag, Input, Row, Col, Card
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined,
    PictureOutlined, SearchOutlined, ReloadOutlined
} from '@ant-design/icons';
import {
    fetchProducts, createProduct, updateProduct, deleteProduct,
    uploadProductImage, deleteProductImage, fetchProductDetail
} from '../../api/productAPI';
import type { ProductListDto, ProductDetailDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import ProductForm from '../../components/ProductForm';

const { Title } = Typography;
const { Search } = Input;

type ApiError = {
    response?: {
        data?: {
            message?: string;
        };
    };
};

const getApiErrorMessage = (error: unknown, fallback: string) =>
    (error as ApiError).response?.data?.message || fallback;

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

    useEffect(() => {
        load();
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
            title: 'Xác nhận xóa sản phẩm?',
            content: `Sản phẩm "${name}" sẽ bị xóa vĩnh viễn cùng tất cả biến thể.`,
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteProduct(id);
                    message.success('Đã xóa sản phẩm');
                    load();
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
            message.error('Không thể tải chi tiết sản phẩm');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (product: ProductDetailDto, isEdit: boolean) => {
        try {
            setSubmitting(true);
            if (isEdit && editing) {
                await updateProduct(editing.productId!, product);
                message.success('Cập nhật thành công');
            } else {
                await createProduct(product);
                message.success('Tạo sản phẩm thành công');
            }
            setModalVisible(false);
            setEditing(null);
            load();
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
            message.error('Không thể tải chi tiết sản phẩm');
        }
    };

    const handleUploadImage = async (file: File) => {
        if (!selectedProduct) return;

        // Validate file
        const isImage = file.type.startsWith('image/');
        if (!isImage) {
            message.error('Chỉ chấp nhận file ảnh!');
            return;
        }

        const isLt5M = file.size / 1024 / 1024 < 5;
        if (!isLt5M) {
            message.error('Ảnh phải nhỏ hơn 5MB!');
            return;
        }

        try {
            setUploadingImage(true);
            await uploadProductImage(selectedProduct.productId!, file);
            message.success('Upload thành công');
            const updated = await fetchProductDetail(selectedProduct.productId!);
            setSelectedProduct(updated);
            load();
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
            title: 'Xác nhận xóa ảnh?',
            content: 'Hành động này không thể hoàn tác!',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteProductImage(selectedProduct.productId!, imageUrl);
                    message.success('Đã xóa ảnh');
                    const updated = await fetchProductDetail(selectedProduct.productId!);
                    setSelectedProduct(updated);
                    load();
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

        // Basic URL validation
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

            const payload: ProductDetailDto = {
                ...selectedProduct,
                images,
            };

            await updateProduct(selectedProduct.productId!, payload);
            message.success('Thêm ảnh bằng URL thành công');

            const updated = await fetchProductDetail(selectedProduct.productId!);
            setSelectedProduct(updated);
            setNewImageUrl('');
            load();
        } catch (error: unknown) {
            console.error('Add image by URL error:', error);
            message.error(getApiErrorMessage(error, 'Thêm ảnh thất bại'));
        } finally {
            setUploadingImage(false);
        }
    };

    const filteredProducts = useMemo(() => {
        if (!searchText.trim()) return products;

        const search = searchText.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(search) ||
            p.categoryName.toLowerCase().includes(search)
        );
    }, [products, searchText]);

    const columns = [
        {
            title: 'ID',
            dataIndex: 'productId',
            key: 'productId',
            width: 80,
            sorter: (a: ProductListDto, b: ProductListDto) => a.productId - b.productId,
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'avatar',
            key: 'avatar',
            width: 100,
            render: (avatar: string) => (
                <Image
                    src={avatar || 'https://placehold.co/60x60?text=No+Image'}
                    alt="Product"
                    width={60}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback="https://placehold.co/60x60?text=Error"
                />
            ),
        },
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            sorter: (a: ProductListDto, b: ProductListDto) =>
                a.name.localeCompare(b.name, 'vi'),
        },
        {
            title: 'Giá',
            dataIndex: 'basePrice',
            key: 'basePrice',
            width: 120,
            render: (v: number) => `${v?.toLocaleString('vi-VN')} ₫`,
            sorter: (a: ProductListDto, b: ProductListDto) =>
                a.basePrice - b.basePrice,
        },
        {
            title: 'Danh mục',
            dataIndex: 'categoryName',
            key: 'categoryName',
            width: 150,
            sorter: (a: ProductListDto, b: ProductListDto) =>
                a.categoryName.localeCompare(b.categoryName, 'vi'),
        },
        {
            title: 'Hiển thị',
            dataIndex: 'showHomepage',
            key: 'showHomepage',
            width: 100,
            render: (v: boolean) => (
                <Tag color={v ? 'green' : 'default'}>
                    {v ? 'Có' : 'Không'}
                </Tag>
            ),
            filters: [
                { text: 'Có', value: true },
                { text: 'Không', value: false },
            ],
            onFilter: (value: unknown, record: ProductListDto) =>
                record.showHomepage === value,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 200,
            fixed: 'right' as const,
            render: (_: unknown, record: ProductListDto) => (
                <Space size="small">
                    <Button
                        size="small"
                        icon={<PictureOutlined />}
                        onClick={() => handleManageImages(record)}
                        title="Quản lý ảnh"
                    />
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        title="Sửa"
                    />
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.productId, record.name)}
                        title="Xóa"
                    />
                </Space>
            )
        }
    ];

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={{ padding: 24 }}>
            <Card>
                <Title level={3}>Quản lý sản phẩm</Title>

                <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} md={8}>
                        <Search
                            placeholder="Tìm kiếm theo tên hoặc danh mục..."
                            allowClear
                            enterButton={<SearchOutlined />}
                            onSearch={(value) => setSearchText(value)}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={16}>
                        <Space style={{ float: 'right' }}>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={load}
                                loading={loading}
                            >
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
                        </Space>
                    </Col>
                </Row>

                <Table
                    rowKey="productId"
                    columns={columns}
                    dataSource={filteredProducts}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tổng ${total} sản phẩm`,
                        showSizeChanger: true,
                        showQuickJumper: true,
                    }}
                    scroll={{ x: 1100 }}
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
                title={`Quản lý ảnh - ${selectedProduct?.name}`}
                onCancel={() => {
                    setImageModalVisible(false);
                    setSelectedProduct(null);
                }}
                footer={null}
                width={800}
            >
                {selectedProduct && (
                    <div>
                        <Row gutter={12} align="middle" style={{ marginBottom: 16 }}>
                            <Col>
                                <Upload
                                    listType="picture-card"
                                    showUploadList={false}
                                    beforeUpload={(file) => {
                                        handleUploadImage(file);
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
                                        onChange={(e) => setNewImageUrl(e.target.value)}
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
                                <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                                    Hỗ trợ: JPG, PNG, GIF. Tối đa 5MB.
                                </div>
                            </Col>
                        </Row>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                            gap: 16
                        }}>
                            {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                selectedProduct.images.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative' }}>
                                        <Image
                                            src={img}
                                            alt={`Product ${idx}`}
                                            width="100%"
                                            height={150}
                                            style={{
                                                objectFit: 'cover',
                                                borderRadius: 4,
                                                border: img === selectedProduct.avatar
                                                    ? '2px solid #1890ff'
                                                    : '1px solid #d9d9d9'
                                            }}
                                        />
                                        <Button
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            style={{
                                                position: 'absolute',
                                                top: 8,
                                                right: 8
                                            }}
                                            onClick={() => handleDeleteImage(img)}
                                        />
                                        {img === selectedProduct.avatar && (
                                            <Tag
                                                color="blue"
                                                style={{
                                                    position: 'absolute',
                                                    bottom: 8,
                                                    left: 8
                                                }}
                                            >
                                                Avatar
                                            </Tag>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#999', gridColumn: '1 / -1', textAlign: 'center' }}>
                                    Chưa có ảnh nào
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

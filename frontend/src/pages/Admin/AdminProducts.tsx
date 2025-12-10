import { useEffect, useState, useMemo } from 'react';
import { Table, Button, Space, Typography, message, Modal, Spin, Image, Upload, Tag, Input, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, PictureOutlined, SearchOutlined } from '@ant-design/icons';
import { fetchProducts, createProduct, updateProduct, deleteProduct, uploadProductImage, deleteProductImage, fetchProductDetail } from '../../api/productAPI';
import type { ProductListDto, ProductDetailDto } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ProductForm from '../../components/ProductForm';

const { Title } = Typography;
const { Search } = Input;

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

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa?',
            content: 'Sản phẩm sẽ bị xóa vĩnh viễn cùng tất cả biến thể.',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteProduct(id);
                    message.success('Đã xóa');
                    load();
                } catch (error) {
                    console.error('Delete error:', error);
                    message.error('Xóa thất bại');
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
                message.success('Tạo thành công');
            }
            setModalVisible(false);
            setEditing(null);
            load();
        } catch (error: any) {
            console.error('Submit error:', error);
            message.error(error.response?.data?.message || 'Lưu thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    console.log(submitting)

    const handleManageImages = async (record: ProductListDto) => {
        try {
            const detail = await fetchProductDetail(record.productId);
            setSelectedProduct(detail);
            setImageModalVisible(true);
            setNewImageUrl('');
        } catch {
            message.error('Không thể tải chi tiết sản phẩm');
        }
    };

    const handleUploadImage = async (file: File) => {
        if (!selectedProduct) return;
        try {
            setUploadingImage(true);
            await uploadProductImage(selectedProduct.productId!, file);
            message.success('Upload thành công');
            const updated = await fetchProductDetail(selectedProduct.productId!);
            setSelectedProduct(updated);
            load();
        } catch (error) {
            console.error('Upload error:', error);
            message.error('Upload thất bại');
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
                } catch (error) {
                    console.error('Delete image error:', error);
                    message.error('Xóa ảnh thất bại');
                }
            }
        });
    };

    const handleAddImageByUrl = async () => {
        if (!selectedProduct) return;
        const url = (newImageUrl || '').trim();
        if (!url) {
            message.error('Vui lòng nhập URL ảnh');
            return;
        }

        try {
            setUploadingImage(true);
            const images: string[] = Array.isArray(selectedProduct.images) ? [...selectedProduct.images] : [];
            images.push(url);

            const payload: ProductDetailDto = {
                ...selectedProduct,
                images,
            };

            if (selectedProduct.productId) {
                await updateProduct(selectedProduct.productId, payload);
            } else {
                message.error('Sản phẩm không hợp lệ');
                return;
            }

            message.success('Thêm ảnh bằng URL thành công');
            const updated = await fetchProductDetail(selectedProduct.productId);
            setSelectedProduct(updated);
            setNewImageUrl('');
            load();
        } catch (error) {
            console.error('Add image by URL error:', error);
            message.error('Thêm ảnh thất bại');
        } finally {
            setUploadingImage(false);
        }
    };

    // NEW: Filtered and sorted products
    const filteredProducts = useMemo(() => {
        let filtered = [...products];

        // Apply search filter
        if (searchText.trim()) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchText.toLowerCase()) ||
                p.categoryName.toLowerCase().includes(searchText.toLowerCase())
            );
        }

        return filtered;
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
                    src={avatar || 'https://via.placeholder.com/60'}
                    alt="Product"
                    width={60}
                    height={60}
                    style={{ objectFit: 'cover', borderRadius: 4 }}
                    fallback="https://via.placeholder.com/60"
                />
            ),
        },
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            sorter: (a: ProductListDto, b: ProductListDto) => a.name.localeCompare(b.name),
        },
        {
            title: 'Giá',
            dataIndex: 'basePrice',
            key: 'basePrice',
            width: 120,
            render: (v: number) => `${v?.toLocaleString('vi-VN')} ₫`,
            sorter: (a: ProductListDto, b: ProductListDto) => a.basePrice - b.basePrice,
        },
        {
            title: 'Danh mục',
            dataIndex: 'categoryName',
            key: 'categoryName',
            width: 150,
            sorter: (a: ProductListDto, b: ProductListDto) => a.categoryName.localeCompare(b.categoryName),
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
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 200,
            fixed: 'right' as const,
            render: (_: any, record: ProductListDto) => (
                <Space>
                    <Button
                        icon={<PictureOutlined />}
                        onClick={() => handleManageImages(record)}
                        title="Quản lý ảnh"
                    />
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        title="Sửa"
                    />
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record.productId)}
                        title="Xóa"
                    />
                </Space>
            )
        }
    ];

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (loading && !imageModalVisible) {
        return <Spin style={{ display: 'block', margin: '100px auto' }} />;
    }

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Quản lý sản phẩm</Title>

            {/* NEW: Search bar */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
                <Col span={8}>
                    <Search
                        placeholder="Tìm kiếm theo tên hoặc danh mục..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        onSearch={(value) => setSearchText(value)}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </Col>
                <Col span={16}>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        style={{ float: 'right' }}
                        onClick={() => {
                            setEditing(null);
                            setModalVisible(true);
                        }}
                    >
                        Thêm sản phẩm
                    </Button>
                </Col>
            </Row>

            <Table
                rowKey="productId"
                columns={columns}
                dataSource={filteredProducts}
                pagination={{ pageSize: 10, showTotal: (total) => `Tổng ${total} sản phẩm` }}
                scroll={{ x: 1100 }}
            />

            <ProductForm
                visible={modalVisible}
                onCancel={() => {
                    setModalVisible(false);
                    setEditing(null);
                }}
                onSubmit={handleSubmit}
                initialValues={editing || undefined}
                isEdit={!!editing}
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
                        <Row gutter={12} align="middle">
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
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <Input
                                        placeholder="Dán URL ảnh vào đây, ví dụ https://..."
                                        value={newImageUrl}
                                        onChange={(e) => setNewImageUrl(e.target.value)}
                                        onPressEnter={handleAddImageByUrl}
                                    />
                                    <Button onClick={handleAddImageByUrl} loading={uploadingImage}>
                                        Thêm bằng URL
                                    </Button>
                                </div>
                                <div style={{ marginTop: 8, color: '#888', fontSize: 12 }}>
                                    Bạn có thể dán URL ảnh (hoặc copy từ ProductForm). Nếu muốn ảnh này làm avatar, dùng nút "Đặt làm avatar" sau khi thêm.
                                </div>
                            </Col>
                        </Row>

                        <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                            {selectedProduct.images && selectedProduct.images.length > 0 ? (
                                selectedProduct.images.map((img, idx) => (
                                    <div key={idx} style={{ position: 'relative' }}>
                                        <Image
                                            src={img}
                                            alt={`Product ${idx}`}
                                            width={150}
                                            height={150}
                                            style={{ objectFit: 'cover', borderRadius: 4 }}
                                        />
                                        <Button
                                            danger
                                            size="small"
                                            icon={<DeleteOutlined />}
                                            style={{ position: 'absolute', top: 8, right: 8 }}
                                            onClick={() => handleDeleteImage(img)}
                                        />
                                        {img === selectedProduct.avatar && (
                                            <Tag color="blue" style={{ position: 'absolute', bottom: 8, left: 8 }}>
                                                Avatar
                                            </Tag>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <p style={{ color: '#999' }}>Chưa có ảnh nào</p>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
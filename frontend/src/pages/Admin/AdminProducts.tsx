import { useEffect, useState } from 'react';
import { Table, Button, Spin, Typography, message, Modal, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../../api/productAPI';
import type { ProductListDto } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import ProductForm from '../../components/ProductForm';

const { Title } = Typography;

export default function AdminProducts() {
    const { isAdmin } = useAuth();
    const [products, setProducts] = useState<ProductListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductListDto | null>(null);

    if (!isAdmin) return <Navigate to="/" replace />;

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const data = await fetchProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xoá?',
            content: 'Bạn sẽ không thể khôi phục sản phẩm này!',
            async onOk() {
                try {
                    await deleteProduct(id);
                    message.success('Xoá thành công!');
                    loadProducts();
                } catch (error) {
                    message.error('Xoá thất bại!');
                }
            },
        });
    };

    const handleSubmit = async (values: any) => {
        try {
            const formData = new FormData();
            Object.keys(values).forEach((key) => {
                if (key === 'images' && values[key]) {
                    values[key].forEach((file: any) => formData.append('images', file));
                } else {
                    formData.append(key, values[key]);
                }
            });

            if (editingProduct) {
                await updateProduct(editingProduct.productId, formData);
                message.success('Cập nhật thành công!');
            } else {
                await createProduct(formData);
                message.success('Thêm thành công!');
            }
            setModalVisible(false);
            loadProducts();
        } catch (error) {
            message.error(editingProduct ? 'Cập nhật thất bại!' : 'Thêm thất bại!');
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'productId', key: 'productId' },
        { title: 'Tên', dataIndex: 'name', key: 'name' },
        {
            title: 'Giá',
            dataIndex: 'basePrice',
            key: 'basePrice',
            render: (v: number) => `${v.toLocaleString()} đ`,
        },
        {
            title: 'Danh mục',
            dataIndex: 'categoryName',
            key: 'categoryName',
        },
        {
            title: 'Hiển thị',
            dataIndex: 'showHomepage',
            key: 'showHomepage',
            render: (v: boolean) => (v ? 'Có' : 'Không'),
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, r: ProductListDto) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingProduct(r);
                            setModalVisible(true);
                        }}
                    />
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(r.productId)} />
                </Space>
            ),
        },
    ];

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Quản lý sản phẩm</Title>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                    setEditingProduct(null);
                    setModalVisible(true);
                }}
                style={{ marginBottom: 16 }}
            >
                Thêm sản phẩm
            </Button>
            <Table rowKey="productId" columns={columns} dataSource={products} pagination={{ pageSize: 10 }} />

            <ProductForm
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onSubmit={handleSubmit}
                initialValues={editingProduct || undefined}
            />
        </div>
    );
}
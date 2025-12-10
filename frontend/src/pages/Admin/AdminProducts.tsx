import { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, message, Modal, Spin } from 'antd';
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
    const [editing, setEditing] = useState<ProductListDto | null>(null);
    const [submitting, setSubmitting] = useState(false);

    if (!isAdmin) return <Navigate to="/" replace />;

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await fetchProducts();
            setProducts(data);
        } catch (e) {
            console.error(e);
            message.error('Tải sản phẩm thất bại');
        } finally { setLoading(false); }
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xoá?',
            content: 'Sản phẩm sẽ bị xóa vĩnh viễn.',
            async onOk() {
                try {
                    await deleteProduct(id);
                    message.success('Đã xoá');
                    load();
                } catch {
                    message.error('Xoá thất bại');
                }
            }
        });
    };

    const handleSubmit = async (formData: FormData, isEdit: boolean) => {
        try {
            setSubmitting(true);
            if (isEdit && editing) {
                await updateProduct(editing.productId, formData);
                message.success('Cập nhật thành công');
            } else {
                await createProduct(formData);
                message.success('Tạo thành công');
            }
            setModalVisible(false);
            load();
        } catch (e) {
            console.error(e);
            message.error('Lưu thất bại');
        } finally {
            setSubmitting(false);
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'productId', key: 'productId' },
        { title: 'Tên', dataIndex: 'name', key: 'name' },
        { title: 'Giá', dataIndex: 'basePrice', key: 'basePrice', render: (v: number) => `${v?.toLocaleString()} đ` },
        { title: 'Danh mục', dataIndex: 'categoryName', key: 'categoryName' },
        { title: 'Hiển thị', dataIndex: 'showHomepage', key: 'showHomepage', render: (v: boolean) => (v ? 'Có' : 'Không') },
        {
            title: 'Thao tác', key: 'action',
            render: (_: any, r: ProductListDto) => (
                <Space>
                    <Button icon={<EditOutlined />} onClick={() => { setEditing(r); setModalVisible(true); }} />
                    <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.productId)} />
                </Space>
            )
        }
    ];

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Quản lý sản phẩm</Title>
            <Button type="primary" icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => { setEditing(null); setModalVisible(true); }}>
                Thêm sản phẩm
            </Button>

            <Table rowKey="productId" columns={columns} dataSource={products} pagination={{ pageSize: 10 }} />

            <ProductForm
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onSubmit={handleSubmit}
                initialValues={editing ?? undefined}
                isEdit={!!editing}
            />
        </div>
    );
}

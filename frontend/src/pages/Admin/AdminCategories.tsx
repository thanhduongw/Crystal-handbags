import { useEffect, useState } from 'react';
import { Table, Button, Spin, Typography, message, Modal } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../api/categoryAPI';
import type { CategoryDto } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import CategoryForm from '../../components/CategoryForm';

const { Title } = Typography;

export default function AdminCategories() {
    const { isAdmin } = useAuth();
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);

    if (!isAdmin) return <Navigate to="/" replace />;

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await fetchCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to load categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xoá?',
            content: 'Bạn sẽ không thể khôi phục danh mục này!',
            async onOk() {
                try {
                    await deleteCategory(id);
                    message.success('Xoá thành công!');
                    loadCategories();
                } catch (error) {
                    message.error('Xoá thất bại! Có thể danh mục đang chứa sản phẩm.');
                }
            },
        });
    };

    const handleSubmit = async (values: any) => {
        try {
            if (editingCategory) {
                await updateCategory(editingCategory.categoryId, values);
                message.success('Cập nhật thành công!');
            } else {
                await createCategory(values);
                message.success('Thêm thành công!');
            }
            setModalVisible(false);
            loadCategories();
        } catch (error) {
            message.error(editingCategory ? 'Cập nhật thất bại!' : 'Thêm thất bại!');
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Tên', dataIndex: 'name', key: 'name' },
        { title: 'Mô tả', dataIndex: 'description', key: 'description' },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, r: CategoryDto) => (
                <>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingCategory(r);
                            setModalVisible(true);
                        }}
                        style={{ marginRight: 8 }}
                    />
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(r.categoryId)} />
                </>
            ),
        },
    ];

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Quản lý danh mục</Title>
            <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                    setEditingCategory(null);
                    setModalVisible(true);
                }}
                style={{ marginBottom: 16 }}
            >
                Thêm danh mục
            </Button>
            <Table rowKey="id" columns={columns} dataSource={categories} pagination={{ pageSize: 10 }} />

            <CategoryForm
                visible={modalVisible}
                onCancel={() => setModalVisible(false)}
                onSubmit={handleSubmit}
                initialValues={editingCategory || undefined}
            />
        </div>
    );
}
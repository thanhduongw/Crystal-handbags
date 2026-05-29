import { useEffect, useState } from 'react';
import { Table, Button, Spin, Typography, message, Modal } from 'antd';
import type { TableProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import {
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    uploadCategoryImage,
    deleteCategoryImage,
} from '../../api/categoryAPI';
import type { CategoryDto, CategoryFormFiles } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import CategoryForm from '../../components/CategoryForm';

const { Title } = Typography;

export default function AdminCategories() {
    const { isAdmin } = useAuth();
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);

    useEffect(() => {
        void loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await fetchCategories();
            setCategories(data);
        } catch (error) {
            console.error('Load categories error:', error);
            message.error('Không thể tải danh mục!');
        } finally {
            setLoading(false);
        }
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingCategory(null);
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa?',
            content: 'Bạn sẽ không thể khôi phục danh mục này!',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteCategory(id);
                    message.success('Xóa thành công!');
                    await loadCategories();
                } catch (error) {
                    console.error('Delete error:', error);
                    message.error('Xóa thất bại!');
                }
            },
        });
    };

    const handleSubmit = async (
        values: Omit<CategoryDto, 'categoryId'>,
        files?: CategoryFormFiles
    ) => {
        try {
            setSubmitting(true);

            if (editingCategory) {
                await updateCategory(editingCategory.categoryId, {
                    ...values,
                    imageUrl: editingCategory.imageUrl,
                });

                // Nếu bấm Xóa ảnh trong form, bấm Cập nhật mới xóa ảnh trên S3.
                if (files?.deleteImage) {
                    await deleteCategoryImage(editingCategory.categoryId);
                }

                // Nếu chọn ảnh mới, bấm Cập nhật mới upload ảnh lên S3.
                if (files?.imageFile) {
                    await uploadCategoryImage(editingCategory.categoryId, files.imageFile);
                }

                message.success('Cập nhật thành công!');
            } else {
                const createdCategory = await createCategory({
                    ...values,
                    imageUrl: undefined,
                });

                // Tạo category xong mới có categoryId để upload ảnh.
                if (files?.imageFile) {
                    await uploadCategoryImage(createdCategory.categoryId, files.imageFile);
                }

                message.success('Thêm thành công!');
            }

            closeModal();
            await loadCategories();
        } catch (error) {
            console.error('Submit error:', error);
            message.error(editingCategory ? 'Cập nhật thất bại!' : 'Thêm thất bại!');
        } finally {
            setSubmitting(false);
        }
    };

    const columns: TableProps<CategoryDto>['columns'] = [
        {
            title: 'ID',
            dataIndex: 'categoryId',
            key: 'categoryId',
            width: 80,
        },
        {
            title: 'Hình ảnh',
            dataIndex: 'imageUrl',
            key: 'imageUrl',
            width: 100,
            render: (url?: string) => url ? (
                <img
                    src={url}
                    alt="Category"
                    style={{
                        width: 50,
                        height: 50,
                        objectFit: 'cover',
                        borderRadius: 6,
                    }}
                />
            ) : '-',
        },
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            render: (_, record) => (
                <>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => {
                            setEditingCategory(record);
                            setModalVisible(true);
                        }}
                        style={{ marginRight: 8 }}
                    />
                    <Button
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDelete(record.categoryId)}
                    />
                </>
            ),
        },
    ];

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (loading) {
        return <Spin style={{ display: 'block', margin: '100px auto' }} />;
    }

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

            <Table
                rowKey="categoryId"
                columns={columns}
                dataSource={categories}
                pagination={{ pageSize: 10 }}
            />

            <CategoryForm
                visible={modalVisible}
                onCancel={closeModal}
                onSubmit={handleSubmit}
                initialValues={editingCategory || undefined}
                submitting={submitting}
            />
        </div>
    );
}
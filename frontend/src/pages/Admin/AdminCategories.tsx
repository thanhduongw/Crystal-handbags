import { useEffect, useMemo, useState } from 'react';
import { Table, Button, Spin, Typography, message, Modal, Card, Row, Col, Input, Space, Tooltip, Tag } from 'antd';
import type { TableProps } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined, SearchOutlined, TagsOutlined } from '@ant-design/icons';
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
    const [searchText, setSearchText] = useState('');

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

    const filteredCategories = useMemo(() => {
        const keyword = searchText.trim().toLowerCase();
        if (!keyword) return categories;

        return categories.filter(category =>
            category.name.toLowerCase().includes(keyword) ||
            (category.description || '').toLowerCase().includes(keyword)
        );
    }, [categories, searchText]);

    const closeModal = () => {
        setModalVisible(false);
        setEditingCategory(null);
    };

    const handleDelete = (category: CategoryDto) => {
        Modal.confirm({
            title: 'Xóa danh mục?',
            content: `Danh mục "${category.name}" sẽ không còn hiển thị trong hệ thống.`,
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteCategory(category.categoryId);
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

                if (files?.deleteImage) {
                    await deleteCategoryImage(editingCategory.categoryId);
                }

                if (files?.imageFile) {
                    await uploadCategoryImage(editingCategory.categoryId, files.imageFile);
                }

                message.success('Cập nhật thành công!');
            } else {
                const createdCategory = await createCategory({
                    ...values,
                    imageUrl: undefined,
                });

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
            title: 'Danh mục',
            key: 'category',
            render: (_, record) => (
                <div className="admin-entity-cell">
                    {record.imageUrl ? (
                        <img src={record.imageUrl} alt={record.name} className="admin-entity-image" />
                    ) : (
                        <div className="admin-empty-thumb"><TagsOutlined /></div>
                    )}
                    <div>
                        <div className="admin-entity-title">{record.name}</div>
                        <div className="admin-entity-meta">ID #{record.categoryId}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (description?: string) => description || <span className="admin-muted">Chưa có mô tả</span>,
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 130,
            render: () => <Tag className="admin-tag" color="green">Đang dùng</Tag>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 130,
            align: 'right',
            render: (_, record) => (
                <Space size={4}>
                    <Tooltip title="Sửa danh mục">
                        <Button
                            className="admin-icon-button"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setEditingCategory(record);
                                setModalVisible(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Xóa danh mục">
                        <Button
                            className="admin-icon-button"
                            icon={<DeleteOutlined />}
                            danger
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

    if (loading && categories.length === 0) {
        return <Spin style={{ display: 'block', margin: '100px auto' }} />;
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <div className="admin-page-eyebrow">Danh mục</div>
                    <Title level={2} className="admin-page-title">Nhóm sản phẩm</Title>
                    <p className="admin-page-subtitle">
                        Quản lý cấu trúc phân loại để khách hàng tìm sản phẩm nhanh hơn.
                    </p>
                </div>
                <div className="admin-page-actions">
                    <Button icon={<ReloadOutlined />} onClick={loadCategories} loading={loading}>
                        Làm mới
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingCategory(null);
                            setModalVisible(true);
                        }}
                    >
                        Thêm danh mục
                    </Button>
                </div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} md={8}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Tổng danh mục</div>
                        <div className="admin-stat-value">{categories.length}</div>
                        <div className="admin-stat-footnote">Đang được quản lý trong cửa hàng</div>
                    </Card>
                </Col>
                <Col xs={24} md={16}>
                    <Card className="admin-toolbar-card">
                        <Input
                            allowClear
                            prefix={<SearchOutlined />}
                            placeholder="Tìm theo tên hoặc mô tả danh mục..."
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                        />
                    </Card>
                </Col>
            </Row>

            <Card className="admin-table-card">
                <Table
                    rowKey="categoryId"
                    columns={columns}
                    dataSource={filteredCategories}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tổng ${total} danh mục`,
                    }}
                />
            </Card>

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

import { useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    Empty,
    Input,
    message,
    Modal,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import type { TableProps } from 'antd';
import {
    DeleteOutlined,
    EditOutlined,
    PlusOutlined,
    ReloadOutlined,
    SearchOutlined,
    TagsOutlined,
} from '@ant-design/icons';
import { Navigate } from 'react-router-dom';

import {
    createCategory,
    deleteCategory,
    deleteCategoryImage,
    fetchCategories,
    updateCategory,
    uploadCategoryImage,
} from '../../api/categoryAPI';
import { fetchProducts } from '../../api/productAPI';
import type { CategoryDto, CategoryFormFiles, ProductListDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import CategoryForm from '../../components/CategoryForm';

const { Title, Text } = Typography;

type CategoryRow = CategoryDto & {
    productCount: number;
};

export default function AdminCategories() {
    const { isAdmin } = useAuth();

    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<ProductListDto[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [searchText, setSearchText] = useState('');
    const [openForm, setOpenForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState<CategoryDto | null>(null);

    useEffect(() => {
        void loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            const [categoryData, productData] = await Promise.all([
                fetchCategories(),
                fetchProducts().catch(() => []),
            ]);

            setCategories(categoryData);
            setProducts(productData);
        } catch (error) {
            console.error(error);
            message.error('Không thể tải danh mục!');
        } finally {
            setLoading(false);
        }
    };

    const rows = useMemo<CategoryRow[]>(() => {
        const productCountMap = products.reduce<Record<string, number>>((acc, product) => {
            acc[product.categoryName] = (acc[product.categoryName] || 0) + 1;
            return acc;
        }, {});

        return categories.map((category) => ({
            ...category,
            productCount: productCountMap[category.name] || 0,
        }));
    }, [categories, products]);

    const filteredRows = useMemo(() => {
        const keyword = searchText.trim().toLowerCase();

        if (!keyword) return rows;

        return rows.filter((category) => {
            const name = category.name.toLowerCase();
            const description = category.description?.toLowerCase() || '';

            return name.includes(keyword) || description.includes(keyword);
        });
    }, [rows, searchText]);

    const openCreateForm = () => {
        setEditingCategory(null);
        setOpenForm(true);
    };

    const openEditForm = (category: CategoryDto) => {
        setEditingCategory(category);
        setOpenForm(true);
    };

    const closeForm = () => {
        setOpenForm(false);
        setEditingCategory(null);
    };

    const handleDelete = (category: CategoryDto) => {
        Modal.confirm({
            title: 'Xóa danh mục?',
            content: `Bạn có chắc muốn xóa "${category.name}" không?`,
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteCategory(category.categoryId);
                    message.success('Đã xóa danh mục!');
                    await loadData();
                } catch (error) {
                    console.error(error);
                    message.error('Xóa danh mục thất bại!');
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

                message.success('Cập nhật danh mục thành công!');
            } else {
                const createdCategory = await createCategory({
                    ...values,
                    imageUrl: undefined,
                });

                if (files?.imageFile) {
                    await uploadCategoryImage(createdCategory.categoryId, files.imageFile);
                }

                message.success('Thêm danh mục thành công!');
            }

            closeForm();
            await loadData();
        } catch (error) {
            console.error(error);
            message.error(editingCategory ? 'Cập nhật thất bại!' : 'Thêm thất bại!');
        } finally {
            setSubmitting(false);
        }
    };

    const columns: TableProps<CategoryRow>['columns'] = [
        {
            title: 'Danh mục',
            key: 'category',
            render: (_, record) => (
                <Space>
                    {record.imageUrl ? (
                        <img
                            src={record.imageUrl}
                            alt={record.name}
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 8,
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        <div
                            style={{
                                width: 48,
                                height: 48,
                                borderRadius: 8,
                                background: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <TagsOutlined />
                        </div>
                    )}

                    <div>
                        <Text strong>{record.name}</Text>
                        <br />
                        <Text type="secondary">ID #{record.categoryId}</Text>
                    </div>
                </Space>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            ellipsis: true,
            render: (description?: string) =>
                description || <Text type="secondary">Chưa có mô tả</Text>,
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'productCount',
            width: 130,
            sorter: (a, b) => a.productCount - b.productCount,
            render: (count: number) => (
                <Tag color={count > 0 ? 'blue' : 'default'}>{count} sản phẩm</Tag>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            align: 'right',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Sửa">
                        <Button icon={<EditOutlined />} onClick={() => openEditForm(record)} />
                    </Tooltip>

                    <Tooltip title="Xóa">
                        <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
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
            <Card style={{ marginBottom: 16 }}>
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
                        <div>
                            <Title level={3} style={{ margin: 0 }}>
                                Quản lý danh mục
                            </Title>
                            <Text type="secondary">Tổng cộng {rows.length} danh mục</Text>
                        </div>

                        <Space>
                            <Button icon={<ReloadOutlined />} loading={loading} onClick={loadData}>
                                Làm mới
                            </Button>

                            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateForm}>
                                Thêm danh mục
                            </Button>
                        </Space>
                    </Space>

                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="Tìm kiếm danh mục..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </Space>
            </Card>

            <Card>
                <Table
                    rowKey="categoryId"
                    columns={columns}
                    dataSource={filteredRows}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tổng ${total} danh mục`,
                    }}
                    locale={{
                        emptyText: (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="Không có danh mục phù hợp"
                            />
                        ),
                    }}
                />
            </Card>

            <CategoryForm
                visible={openForm}
                onCancel={closeForm}
                onSubmit={handleSubmit}
                initialValues={editingCategory || undefined}
                submitting={submitting}
            />
        </div>
    );
}
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Empty, Input, message, Modal, Row, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { TableProps } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, TagsOutlined } from '@ant-design/icons';
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
import { Navigate } from 'react-router-dom';
import CategoryForm from '../../components/CategoryForm';

const { Title } = Typography;

type CategoryRow = CategoryDto & {
    productCount?: number;
};

export default function AdminCategories() {
    const { isAdmin } = useAuth();
    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [products, setProducts] = useState<ProductListDto[]>([]);
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
            const [categoryData, productData] = await Promise.all([
                fetchCategories(),
                fetchProducts().catch(() => [] as ProductListDto[]),
            ]);
            setCategories(categoryData);
            setProducts(productData);
        } catch (error) {
            console.error('Load categories error:', error);
            message.error('Khong the tai danh muc!');
        } finally {
            setLoading(false);
        }
    };

    const categoryRows = useMemo<CategoryRow[]>(() => {
        const countByName = products.reduce<Record<string, number>>((acc, product) => {
            acc[product.categoryName] = (acc[product.categoryName] || 0) + 1;
            return acc;
        }, {});

        return categories.map(category => ({
            ...category,
            productCount: countByName[category.name] ?? 0,
        }));
    }, [categories, products]);

    const filteredCategories = useMemo(() => {
        const keyword = searchText.trim().toLowerCase();
        if (!keyword) return categoryRows;

        return categoryRows.filter(category =>
            category.name.toLowerCase().includes(keyword) ||
            (category.description || '').toLowerCase().includes(keyword)
        );
    }, [categoryRows, searchText]);

    const closeModal = () => {
        setModalVisible(false);
        setEditingCategory(null);
    };

    const handleDelete = (category: CategoryDto) => {
        Modal.confirm({
            title: 'Xoa danh muc?',
            content: `Danh muc "${category.name}" se khong con hien thi trong he thong.`,
            okText: 'Xoa',
            cancelText: 'Huy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteCategory(category.categoryId);
                    message.success('Xoa thanh cong!');
                    await loadCategories();
                } catch (error) {
                    console.error('Delete error:', error);
                    message.error('Xoa that bai!');
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

                message.success('Cap nhat thanh cong!');
            } else {
                const createdCategory = await createCategory({
                    ...values,
                    imageUrl: undefined,
                });

                if (files?.imageFile) {
                    await uploadCategoryImage(createdCategory.categoryId, files.imageFile);
                }

                message.success('Them thanh cong!');
            }

            closeModal();
            await loadCategories();
        } catch (error) {
            console.error('Submit error:', error);
            message.error(editingCategory ? 'Cap nhat that bai!' : 'Them that bai!');
        } finally {
            setSubmitting(false);
        }
    };

    const categoriesWithProducts = categoryRows.filter(category => (category.productCount || 0) > 0).length;
    const emptyCategories = categoryRows.length - categoriesWithProducts;

    const columns: TableProps<CategoryRow>['columns'] = [
        {
            title: 'Danh muc',
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
            title: 'Mo ta',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (description?: string) => description || <span className="admin-muted">Chua co mo ta</span>,
        },
        {
            title: 'San pham',
            key: 'productCount',
            width: 130,
            render: (_, record) => (
                <Tag className="admin-tag" color={(record.productCount || 0) > 0 ? 'blue' : 'default'}>
                    {record.productCount ?? 0} san pham
                </Tag>
            ),
            sorter: (a, b) => (a.productCount ?? 0) - (b.productCount ?? 0),
        },
        {
            title: 'Trang thai',
            key: 'status',
            width: 130,
            render: (_, record) => (
                <Tag className="admin-tag" color={(record.productCount || 0) > 0 ? 'green' : 'orange'}>
                    {(record.productCount || 0) > 0 ? 'Dang dung' : 'Trong'}
                </Tag>
            ),
        },
        {
            title: 'Thao tac',
            key: 'action',
            width: 130,
            align: 'right',
            render: (_, record) => (
                <Space size={4}>
                    <Tooltip title="Sua danh muc">
                        <Button
                            className="admin-icon-button"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setEditingCategory(record);
                                setModalVisible(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="Xoa danh muc">
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

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <div className="admin-page-eyebrow">Danh muc</div>
                    <Title level={2} className="admin-page-title">Nhom san pham</Title>
                    <p className="admin-page-subtitle">
                        Quan ly cau truc phan loai va theo doi danh muc dang co san pham.
                    </p>
                </div>
                <div className="admin-page-actions">
                    <Button icon={<ReloadOutlined />} onClick={loadCategories} loading={loading}>
                        Lam moi
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setEditingCategory(null);
                            setModalVisible(true);
                        }}
                    >
                        Them danh muc
                    </Button>
                </div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} md={8}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Tong danh muc</div>
                        <div className="admin-stat-value">{categoryRows.length}</div>
                        <div className="admin-stat-footnote">Dang duoc quan ly trong cua hang</div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Co san pham</div>
                        <div className="admin-stat-value">{categoriesWithProducts}</div>
                        <div className="admin-stat-footnote">Tinh tu danh sach san pham da tai</div>
                    </Card>
                </Col>
                <Col xs={24} md={8}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Danh muc trong</div>
                        <div className="admin-stat-value">{emptyCategories}</div>
                        <div className="admin-stat-footnote">Chua gan voi san pham nao</div>
                    </Card>
                </Col>
            </Row>

            <Card className="admin-toolbar-card">
                <Input
                    allowClear
                    prefix={<SearchOutlined />}
                    placeholder="Tim theo ten hoac mo ta danh muc..."
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                />
            </Card>

            <Card className="admin-table-card">
                <Table
                    rowKey="categoryId"
                    columns={columns}
                    dataSource={filteredCategories}
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tong ${total} danh muc`,
                    }}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Khong co danh muc phu hop" /> }}
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

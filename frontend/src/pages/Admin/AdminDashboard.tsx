import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Drawer, Empty, Row, Skeleton, Space, Table, Tag, Typography } from 'antd';
import {
    DollarOutlined,
    ProductOutlined,
    ShoppingCartOutlined,
    ShoppingOutlined,
    UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Link, Navigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import type { OrderListDto, OrderStatus, ProductListDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { fetchAdminStatistics } from '../../api/adminAPI';
import { fetchAdminOrders } from '../../api/orderAPI';
import { fetchProducts } from '../../api/productAPI';
import AdminOrderDetail from './AdminOrderDetail';

dayjs.extend(relativeTime);

const { Title, Text } = Typography;

interface AdminStats {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    pendingOrders: number;
}

type ProductWithOptionalStock = ProductListDto & {
    stockQuantity?: number;
    stock?: number;
};

const emptyStats: AdminStats = {
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
};

const statusOptions: Array<{ value: OrderStatus; label: string; color: string }> = [
    { value: 'PENDING', label: 'Cho xac nhan', color: 'gold' },
    { value: 'CONFIRMED', label: 'Da xac nhan', color: 'blue' },
    { value: 'SHIPPED', label: 'Dang giao', color: 'purple' },
    { value: 'DELIVERED', label: 'Hoan thanh', color: 'green' },
    { value: 'CANCELLED', label: 'Da huy', color: 'red' },
];

const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    });

const getStatusOption = (status: OrderStatus) =>
    statusOptions.find(option => option.value === status) ?? statusOptions[0];

const getProductStock = (product: ProductWithOptionalStock) =>
    product.stockQuantity ?? product.stock;

export default function AdminDashboard() {
    const { isAdmin } = useAuth();
    const [stats, setStats] = useState<AdminStats>(emptyStats);
    const [recentOrders, setRecentOrders] = useState<OrderListDto[]>([]);
    const [products, setProducts] = useState<ProductWithOptionalStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [detailOrderId, setDetailOrderId] = useState<number | null>(null);

    const loadDashboard = useCallback(async () => {
        if (!isAdmin) return;

        setLoading(true);
        setError(null);

        try {
            const [dashboardStats, orders, productList] = await Promise.all([
                fetchAdminStatistics().catch(() => emptyStats),
                fetchAdminOrders().catch(() => [] as OrderListDto[]),
                fetchProducts().catch(() => [] as ProductListDto[]),
            ]);

            setStats(dashboardStats);
            setRecentOrders(
                [...orders]
                    .sort((a, b) => dayjs(b.orderDate).valueOf() - dayjs(a.orderDate).valueOf())
                    .slice(0, 10)
            );
            setProducts(productList);
        } catch (loadError) {
            console.error('Failed to load dashboard:', loadError);
            setError('Khong tai duoc du lieu tong quan.');
            setStats(emptyStats);
            setRecentOrders([]);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [isAdmin]);

    useEffect(() => {
        void loadDashboard();
    }, [loadDashboard]);

    const pendingOrders = useMemo(
        () => recentOrders.filter(order => order.status === 'PENDING'),
        [recentOrders]
    );

    const lowStockProducts = useMemo(
        () => products
            .filter(product => {
                const stock = getProductStock(product);
                return typeof stock === 'number' && stock <= 5;
            })
            .slice(0, 5),
        [products]
    );

    const hasPaymentMethod = useMemo(
        () => recentOrders.some(order => Boolean(order.paymentMethod)),
        [recentOrders]
    );

    const recentOrdersColumns: ColumnsType<OrderListDto> = [
        {
            title: 'Don hang',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 120,
            render: (id: number) => <span className="admin-entity-title">#{id}</span>,
        },
        {
            title: 'Khach hang',
            key: 'customer',
            render: (_, record) => (
                <div>
                    <div className="admin-entity-title">{record.customerName || record.receiver || '-'}</div>
                    <div className="admin-entity-meta">{record.customerEmail || '-'}</div>
                </div>
            ),
        },
        {
            title: 'Thoi gian',
            dataIndex: 'orderDate',
            key: 'orderDate',
            width: 170,
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
        },
        ...(hasPaymentMethod
            ? [{
                title: 'Thanh toan',
                dataIndex: 'paymentMethod',
                key: 'paymentMethod',
                width: 130,
                render: (method?: string) => method || '-',
            }] satisfies ColumnsType<OrderListDto>
            : []),
        {
            title: 'Trang thai',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (status: OrderStatus) => {
                const option = getStatusOption(status);
                return <Tag className="admin-tag" color={option.color}>{option.label}</Tag>;
            },
        },
        {
            title: 'Tong tien',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            align: 'right',
            width: 150,
            render: (amount: number) => <span className="admin-money">{formatCurrency(amount)}</span>,
        },
    ];

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <div className="admin-page-eyebrow">Tong quan</div>
                    <Title level={2} className="admin-page-title">Van hanh cua hang</Title>
                    <p className="admin-page-subtitle">
                        Theo doi doanh thu, don moi va cac viec can xu ly trong ngay.
                    </p>
                </div>
                <div className="admin-page-actions">
                    <Button type="primary" icon={<ShoppingOutlined />}>
                        <Link to="/admin/orders">Xu ly don hang</Link>
                    </Button>
                </div>
            </div>

            {error && (
                <Alert
                    showIcon
                    type="error"
                    className="admin-inline-alert"
                    message={error}
                    action={<Button size="small" onClick={loadDashboard}>Thu lai</Button>}
                />
            )}

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card">
                        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                            <div>
                                <div className="admin-stat-kicker">Doanh thu da giao</div>
                                <div className="admin-stat-value">
                                    {loading ? <Skeleton.Input active size="small" /> : formatCurrency(stats.totalRevenue)}
                                </div>
                                <div className="admin-growth-indicator">--</div>
                            </div>
                            <div className="admin-stat-icon"><DollarOutlined /></div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card">
                        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                            <div>
                                <div className="admin-stat-kicker">Tong don hang</div>
                                <div className="admin-stat-value">
                                    {loading ? <Skeleton.Input active size="small" /> : stats.totalOrders}
                                </div>
                                <div className="admin-stat-footnote">{stats.pendingOrders} don cho xac nhan</div>
                            </div>
                            <div className="admin-stat-icon"><ShoppingCartOutlined /></div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card">
                        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                            <div>
                                <div className="admin-stat-kicker">Khach hang</div>
                                <div className="admin-stat-value">
                                    {loading ? <Skeleton.Input active size="small" /> : stats.totalUsers}
                                </div>
                                <div className="admin-growth-indicator">--</div>
                            </div>
                            <div className="admin-stat-icon"><UserOutlined /></div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card">
                        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                            <div>
                                <div className="admin-stat-kicker">San pham</div>
                                <div className="admin-stat-value">
                                    {loading ? <Skeleton.Input active size="small" /> : stats.totalProducts}
                                </div>
                                <div className="admin-growth-indicator">--</div>
                            </div>
                            <div className="admin-stat-icon"><ProductOutlined /></div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {stats.pendingOrders > 0 && (
                <Alert
                    showIcon
                    type="warning"
                    className="admin-inline-alert"
                    message={`Co ${stats.pendingOrders} don dang cho xac nhan`}
                    description="Uu tien kiem tra thanh toan, ton kho va cap nhat trang thai de khach hang nhan thong tin kip thoi."
                    action={<Button size="small"><Link to="/admin/orders">Xem don</Link></Button>}
                />
            )}

            <Row gutter={[16, 16]}>
                <Col xs={24} xl={16}>
                    <Card
                        className="admin-table-card"
                        title="Don hang moi nhat"
                        extra={<Link to="/admin/orders">Xem tat ca</Link>}
                    >
                        <Table
                            rowKey="orderId"
                            columns={recentOrdersColumns}
                            dataSource={recentOrders}
                            pagination={false}
                            loading={loading}
                            size="middle"
                            scroll={{ x: 880 }}
                            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chua co don hang" /> }}
                            onRow={(record) => ({
                                onClick: () => setDetailOrderId(record.orderId),
                            })}
                            rowClassName="admin-clickable-row"
                        />
                    </Card>
                </Col>
                <Col xs={24} xl={8}>
                    <Card className="admin-panel admin-watch-card" title="Viec can theo doi">
                        <Space direction="vertical" size={14} style={{ width: '100%' }}>
                            {pendingOrders.length > 0 ? (
                                pendingOrders.slice(0, 4).map(order => (
                                    <button
                                        key={order.orderId}
                                        type="button"
                                        className="admin-watch-item"
                                        onClick={() => setDetailOrderId(order.orderId)}
                                    >
                                        <span>
                                            <strong>Don #{order.orderId}</strong>
                                            <Text type="secondary">{order.customerName || order.receiver || 'Khach hang'}</Text>
                                        </span>
                                        <Tag className="admin-tag" color="gold">{dayjs(order.orderDate).fromNow()}</Tag>
                                    </button>
                                ))
                            ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Khong co don PENDING gan day" />
                            )}

                            {lowStockProducts.length > 0 ? (
                                <div className="admin-watch-section">
                                    <div className="admin-stat-kicker">San pham sap het hang</div>
                                    {lowStockProducts.map(product => (
                                        <div key={product.productId} className="admin-watch-row">
                                            <span>{product.name}</span>
                                            <Tag className="admin-tag" color="red">{getProductStock(product)} con lai</Tag>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="admin-empty-state">
                                    Chua co du lieu ton kho trong danh sach san pham.
                                </div>
                            )}
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Drawer
                title={`Chi tiet don hang #${detailOrderId ?? ''}`}
                open={detailOrderId !== null}
                onClose={() => setDetailOrderId(null)}
                width={860}
                destroyOnHidden
            >
                {detailOrderId !== null && <AdminOrderDetail orderId={detailOrderId} />}
            </Drawer>
        </div>
    );
}

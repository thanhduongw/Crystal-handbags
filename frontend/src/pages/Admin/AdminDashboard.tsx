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
import type { OrderListDto, OrderStatus, ProductListDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { fetchAdminStatistics } from '../../api/adminAPI';
import { fetchAdminOrders } from '../../api/orderAPI';
import { fetchProducts } from '../../api/productAPI';
import AdminOrderDetail from './AdminOrderDetail';

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
    { value: 'PENDING', label: 'Chờ xác nhận', color: 'gold' },
    { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'blue' },
    { value: 'SHIPPED', label: 'Đang giao', color: 'purple' },
    { value: 'DELIVERED', label: 'Hoàn thành', color: 'green' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'red' },
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
            setError('Không tải được dữ liệu tổng quan.');
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
            title: 'Đơn hàng',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 120,
            render: (id: number) => <span className="admin-entity-title">#{id}</span>,
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            render: (_, record) => (
                <div>
                    <div className="admin-entity-title">{record.customerName || record.receiver || '-'}</div>
                    <div className="admin-entity-meta">{record.customerEmail || '-'}</div>
                </div>
            ),
        },
        {
            title: 'Thời gian',
            dataIndex: 'orderDate',
            key: 'orderDate',
            width: 170,
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
        },
        ...(hasPaymentMethod
            ? [{
                title: 'Thanh toán',
                dataIndex: 'paymentMethod',
                key: 'paymentMethod',
                width: 130,
                render: (method?: string) => method || '-',
            }] satisfies ColumnsType<OrderListDto>
            : []),
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (status: OrderStatus) => {
                const option = getStatusOption(status);
                return <Tag className="admin-tag" color={option.color}>{option.label}</Tag>;
            },
        },
        {
            title: 'Tổng tiền',
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
                    <div className="admin-page-eyebrow">Tổng quan</div>
                    <Title level={2} className="admin-page-title">Vận hành cửa hàng</Title>
                </div>
                <div className="admin-page-actions">
                    <Button type="primary" icon={<ShoppingOutlined />}>
                        <Link to="/admin/orders">Xử lý đơn hàng</Link>
                    </Button>
                </div>
            </div>

            {error && (
                <Alert
                    showIcon
                    type="error"
                    className="admin-inline-alert"
                    message={error}
                    action={<Button size="small" onClick={loadDashboard}>Thử lại</Button>}
                />
            )}

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card">
                        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                            <div>
                                <div className="admin-stat-kicker">Doanh thu đã giao</div>
                                <div className="admin-stat-value">
                                    {loading ? <Skeleton.Input active size="small" /> : formatCurrency(stats.totalRevenue)}
                                </div>
                            </div>
                            <div className="admin-stat-icon"><DollarOutlined /></div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card">
                        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                            <div>
                                <div className="admin-stat-kicker">Tổng đơn hàng</div>
                                <div className="admin-stat-value">
                                    {loading ? <Skeleton.Input active size="small" /> : stats.totalOrders}
                                </div>
                            </div>
                            <div className="admin-stat-icon"><ShoppingCartOutlined /></div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card">
                        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                            <div>
                                <div className="admin-stat-kicker">Khách hàng</div>
                                <div className="admin-stat-value">
                                    {loading ? <Skeleton.Input active size="small" /> : stats.totalUsers}
                                </div>
                            </div>
                            <div className="admin-stat-icon"><UserOutlined /></div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card">
                        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                            <div>
                                <div className="admin-stat-kicker">Sản phẩm</div>
                                <div className="admin-stat-value">
                                    {loading ? <Skeleton.Input active size="small" /> : stats.totalProducts}
                                </div>
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
                    message={`Có ${stats.pendingOrders} đơn đang chờ xác nhận`}
                    action={<Button size="small"><Link to="/admin/orders">Xem đơn</Link></Button>}
                />
            )}

            <Row gutter={[16, 16]}>
                <Col xs={24} xl={16}>
                    <Card
                        className="admin-table-card"
                        title="Đơn hàng mới nhất"
                        extra={<Link to="/admin/orders">Xem tất cả</Link>}
                    >
                        <Table
                            rowKey="orderId"
                            columns={recentOrdersColumns}
                            dataSource={recentOrders}
                            pagination={false}
                            loading={loading}
                            size="middle"
                            scroll={{ x: 880 }}
                            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có đơn hàng" /> }}
                            onRow={(record) => ({
                                onClick: () => setDetailOrderId(record.orderId),
                            })}
                            rowClassName="admin-clickable-row"
                        />
                    </Card>
                </Col>
                <Col xs={24} xl={8}>
                    <Card className="admin-panel admin-watch-card" title="Cần theo dõi">
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
                                            <strong>Đơn #{order.orderId}</strong>
                                            <Text type="secondary">{order.customerName || order.receiver || 'Khách hàng'}</Text>
                                        </span>
                                        <Tag className="admin-tag" color="gold">{dayjs(order.orderDate).format('DD/MM HH:mm')}</Tag>
                                    </button>
                                ))
                            ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có đơn chờ xác nhận" />
                            )}

                            {lowStockProducts.length > 0 ? (
                                <div className="admin-watch-section">
                                    <div className="admin-stat-kicker">Sản phẩm sắp hết hàng</div>
                                    {lowStockProducts.map(product => (
                                        <div key={product.productId} className="admin-watch-row">
                                            <span>{product.name}</span>
                                            <Tag className="admin-tag" color="red">{getProductStock(product)} còn lại</Tag>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="admin-empty-state">
                                    Chưa có dữ liệu tồn kho.
                                </div>
                            )}
                        </Space>
                    </Card>
                </Col>
            </Row>

            <Drawer
                title={`Chi tiết đơn hàng #${detailOrderId ?? ''}`}
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

import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, Row, Skeleton, Space, Table, Tag, Typography } from 'antd';
import {
    DollarOutlined,
    ProductOutlined,
    ShoppingCartOutlined,
    ShoppingOutlined,
    UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { OrderListDto, OrderStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate, Link } from 'react-router-dom';
import { fetchAdminStatistics } from '../../api/adminAPI';
import { fetchAdminOrders } from '../../api/orderAPI';
import dayjs from 'dayjs';

const { Title } = Typography;

interface AdminStats {
    totalRevenue: number;
    totalOrders: number;
    totalUsers: number;
    totalProducts: number;
    pendingOrders: number;
}

const emptyStats: AdminStats = {
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    pendingOrders: 0,
};

const statusColorMap: Record<OrderStatus, string> = {
    PENDING: 'gold',
    CONFIRMED: 'blue',
    SHIPPED: 'purple',
    DELIVERED: 'green',
    CANCELLED: 'red',
};

const statusLabelMap: Record<OrderStatus, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Hoàn thành',
    CANCELLED: 'Đã hủy',
};

const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    });

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<OrderListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAdmin } = useAuth();

    useEffect(() => {
        if (!isAdmin) return;

        let ignore = false;

        const loadDashboard = async () => {
            setLoading(true);

            try {
                const dashboardStats = await fetchAdminStatistics();
                if (!ignore) setStats(dashboardStats);
            } catch (error) {
                console.error('Failed to load dashboard stats:', error);
                if (!ignore) setStats(emptyStats);
            }

            try {
                const orders = await fetchAdminOrders();
                const sortedOrders = [...orders].sort((a, b) =>
                    dayjs(b.orderDate).valueOf() - dayjs(a.orderDate).valueOf()
                );
                if (!ignore) setRecentOrders(sortedOrders.slice(0, 6));
            } catch (error) {
                console.error('Failed to load dashboard orders:', error);
                if (!ignore) setRecentOrders([]);
            }

            if (!ignore) setLoading(false);
        };

        void loadDashboard();

        return () => {
            ignore = true;
        };
    }, [isAdmin]);

    const openOrders = useMemo(
        () => recentOrders.filter(order => ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(order.status)),
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
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 140,
            render: (status: OrderStatus) => (
                <Tag className="admin-tag" color={statusColorMap[status]}>
                    {statusLabelMap[status]}
                </Tag>
            ),
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
                    <p className="admin-page-subtitle">
                        Theo dõi doanh thu, đơn mới và các dữ liệu chính trong ngày.
                    </p>
                </div>
                <div className="admin-page-actions">
                    <Button type="primary" icon={<ShoppingOutlined />}>
                        <Link to="/admin/orders">Xử lý đơn hàng</Link>
                    </Button>
                </div>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card className="admin-stat-card">
                        <Space align="start" style={{ width: '100%', justifyContent: 'space-between' }}>
                            <div>
                                <div className="admin-stat-kicker">Doanh thu đã giao</div>
                                <div className="admin-stat-value">
                                    {loading ? <Skeleton.Input active size="small" /> : formatCurrency(stats?.totalRevenue || 0)}
                                </div>
                                <div className="admin-stat-footnote">Tính trên đơn hoàn thành</div>
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
                                    {loading ? <Skeleton.Input active size="small" /> : stats?.totalOrders || 0}
                                </div>
                                <div className="admin-stat-footnote">{stats?.pendingOrders || 0} đơn chờ xác nhận</div>
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
                                    {loading ? <Skeleton.Input active size="small" /> : stats?.totalUsers || 0}
                                </div>
                                <div className="admin-stat-footnote">Tài khoản đang quản lý</div>
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
                                    {loading ? <Skeleton.Input active size="small" /> : stats?.totalProducts || 0}
                                </div>
                                <div className="admin-stat-footnote">Đang hiển thị trong hệ thống</div>
                            </div>
                            <div className="admin-stat-icon"><ProductOutlined /></div>
                        </Space>
                    </Card>
                </Col>
            </Row>

            {stats?.pendingOrders && stats.pendingOrders > 0 ? (
                <Alert
                    showIcon
                    type="warning"
                    style={{ marginBottom: 16, borderRadius: 8 }}
                    message={`Có ${stats.pendingOrders} đơn đang chờ xác nhận`}
                    description="Ưu tiên kiểm tra thanh toán, tồn kho và cập nhật trạng thái để khách hàng nhận thông tin kịp thời."
                    action={<Button size="small"><Link to="/admin/orders">Xem đơn</Link></Button>}
                />
            ) : null}

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
                            scroll={{ x: 780 }}
                        />
                    </Card>
                </Col>
                <Col xs={24} xl={8}>
                    <Card className="admin-panel" title="Việc cần theo dõi">
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            <div>
                                <div className="admin-stat-kicker">Đơn đang mở</div>
                                <div className="admin-stat-value">{openOrders.length}</div>
                                <div className="admin-stat-footnote">Chờ xác nhận, đã xác nhận hoặc đang giao</div>
                            </div>
                            <div>
                                <div className="admin-stat-kicker">Tốc độ xử lý</div>
                                <div className="admin-stat-footnote">
                                    Giữ số đơn chờ xác nhận thấp để tránh trễ giao hàng.
                                </div>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

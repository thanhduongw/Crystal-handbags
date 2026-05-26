import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Typography, Table, Tag } from 'antd';
import {
    DollarOutlined,
    ProductOutlined,
    ShoppingCartOutlined,
    ShoppingOutlined,
    UserOutlined,
} from '@ant-design/icons';
import type { OrderListDto, OrderStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
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
    PENDING: 'orange',
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

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [recentOrders, setRecentOrders] = useState<OrderListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAdmin } = useAuth();

    useEffect(() => {
        const loadDashboard = async () => {
            setLoading(true);

            const [statsResult, ordersResult] = await Promise.allSettled([
                fetchAdminStatistics(),
                fetchAdminOrders(),
            ]);

            if (statsResult.status === 'fulfilled') {
                setStats(statsResult.value);
            } else {
                console.error('Failed to load dashboard stats:', statsResult.reason);
                setStats(emptyStats);
            }

            if (ordersResult.status === 'fulfilled') {
                const sortedOrders = [...ordersResult.value].sort((a, b) =>
                    dayjs(b.orderDate).unix() - dayjs(a.orderDate).unix()
                );
                setRecentOrders(sortedOrders.slice(0, 5));
            } else {
                console.error('Failed to load dashboard orders:', ordersResult.reason);
                setRecentOrders([]);
            }

            setLoading(false);
        };

        void loadDashboard();
    }, []);

    const recentOrdersColumns = [
        {
            title: 'Mã đơn',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 80,
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'orderDate',
            key: 'orderDate',
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: OrderStatus) => (
                <Tag color={statusColorMap[status]}>
                    {statusLabelMap[status]}
                </Tag>
            ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (amount: number) => `${Number(amount ?? 0).toLocaleString('vi-VN')} đ`,
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
            <Title level={3}>Bảng điều khiển</Title>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card
                        style={{
                            height: 130,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Statistic
                            title="Tổng doanh thu"
                            value={stats?.totalRevenue || 0}
                            prefix={<DollarOutlined />}
                            formatter={(value) =>
                                `${Number(value).toLocaleString('vi-VN')} đ`
                            }
                            styles={{ content: { color: '#3f8600' } }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Card
                        style={{
                            height: 130,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                        }}
                    >
                        <Statistic
                            title="Đơn hàng"
                            value={stats?.totalOrders || 0}
                            prefix={<ShoppingOutlined />}
                            styles={{ content: { color: '#1890ff' } }}
                        />

                        {stats?.pendingOrders && stats.pendingOrders > 0 && (
                            <div
                                style={{
                                    marginTop: 8,
                                    fontSize: 12,
                                    color: '#faad14',
                                }}
                            >
                                {stats.pendingOrders} đơn chờ xử lý
                            </div>
                        )}
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Card
                        style={{
                            height: 130,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Statistic
                            title="Người dùng"
                            value={stats?.totalUsers || 0}
                            prefix={<UserOutlined />}
                            styles={{ content: { color: '#722ed1' } }}
                        />
                    </Card>
                </Col>

                <Col xs={24} sm={12} md={6}>
                    <Card
                        style={{
                            height: 130,
                            display: 'flex',
                            alignItems: 'center',
                        }}
                    >
                        <Statistic
                            title="Sản phẩm"
                            value={stats?.totalProducts || 0}
                            prefix={<ProductOutlined />}
                            styles={{ content: { color: '#eb2f96' } }}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Đơn hàng gần đây" style={{ marginBottom: 24 }}>
                <Table
                    rowKey="orderId"
                    columns={recentOrdersColumns}
                    dataSource={recentOrders}
                    pagination={false}
                    size="small"
                />
            </Card>

            {stats?.pendingOrders && stats.pendingOrders > 0 ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                        <ShoppingCartOutlined style={{ fontSize: 48, color: '#faad14' }} />
                        <Title level={4} style={{ marginTop: 16 }}>
                            Có {stats.pendingOrders} đơn hàng đang chờ xác nhận
                        </Title>
                        <p style={{ color: '#8c8c8c' }}>
                            Vui lòng xem và xử lý các đơn hàng mới
                        </p>
                    </div>
                </Card>
            ) : null}
        </div>
    );
}

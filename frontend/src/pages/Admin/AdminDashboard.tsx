import { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic, Spin, Typography } from 'antd';
import { ShoppingCartOutlined, UserOutlined, ProductOutlined, DollarOutlined } from '@ant-design/icons';
import type { OrderListDto } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { fetchAdminStatistics } from '../../api/adminAPI';
import { fetchAdminOrders } from '../../api/orderAPI';

const { Title } = Typography;

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [recentOrders, setRecentOrders] = useState<OrderListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const { isAdmin } = useAuth();

    if (!isAdmin) return <Navigate to="/" replace />;

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const [statsData, ordersData] = await Promise.all([
                fetchAdminStatistics(),
                fetchAdminOrders(),
            ]);
            setStats(statsData);
            setRecentOrders(ordersData.slice(0, 5));
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Bảng điều khiển</Title>

            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Tổng doanh thu"
                            value={stats?.totalRevenue || 0}
                            prefix={<DollarOutlined />}
                            valueStyle={{ color: '#3f8600' }}
                            formatter={(value) => `${Number(value).toLocaleString()} đ`}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Đơn hàng"
                            value={stats?.totalOrders || 0}
                            prefix={<ShoppingCartOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Người dùng"
                            value={stats?.totalUsers || 0}
                            prefix={<UserOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card>
                        <Statistic
                            title="Sản phẩm"
                            value={stats?.totalProducts || 0}
                            prefix={<ProductOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            <Card title="Đơn hàng gần đây">
                {/* Add a simple table or list of recent orders here */}
                <p>Total pending orders: {stats?.pendingOrders || 0}</p>
            </Card>
        </div>
    );
}
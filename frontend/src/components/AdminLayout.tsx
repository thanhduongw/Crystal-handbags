import { Layout, Menu, Typography } from 'antd';
import { DashboardOutlined, ShoppingOutlined, AppstoreOutlined, UserOutlined } from '@ant-design/icons';
import { Link, useLocation } from 'react-router-dom';

const { Sider, Content } = Layout;
const { Title } = Typography;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const location = useLocation();

    const menuItems = [
        {
            key: '/admin',
            icon: <DashboardOutlined />,
            label: <Link to="/admin">Dashboard</Link>,
        },
        {
            key: '/admin/orders',
            icon: <ShoppingOutlined />,
            label: <Link to="/admin/orders">Đơn hàng</Link>,
        },
        {
            key: '/admin/products',
            icon: <AppstoreOutlined />,
            label: <Link to="/admin/products">Sản phẩm</Link>,
        },
        {
            key: '/admin/categories',
            icon: <AppstoreOutlined />,
            label: <Link to="/admin/categories">Danh mục</Link>,
        },
        {
            key: '/admin/users',
            icon: <UserOutlined />,
            label: <Link to="/admin/users">Người dùng</Link>,
        },
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider width={250} theme="light">
                <div style={{ padding: 16, borderBottom: '1px solid #e8e8e8' }}>
                    <Title level={4} style={{ margin: 0 }}>
                        Quản trị
                    </Title>
                </div>
                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    style={{ borderRight: 0 }}
                />
            </Sider>
            <Layout>
                <Content style={{ padding: 24 }}>{children}</Content>
            </Layout>
        </Layout>
    );
}
import {
    Layout,
    Menu,
    Dropdown,
    Avatar,
    Badge,
    Space,
} from 'antd';
import type { MenuProps } from 'antd';
import {
    ShoppingCartOutlined,
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined,
    HistoryOutlined,
    EnvironmentOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useCart from '../hooks/useCart';

const { Header } = Layout;

export default function AppHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const { lines } = useCart();
    const { user, logout, isAdmin } = useAuth();

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            label: 'Hồ sơ',
            icon: <UserOutlined />,
            onClick: () => navigate('/profile'),
        },
        {
            key: 'addresses',
            label: 'Địa chỉ',
            icon: <EnvironmentOutlined />,
            onClick: () => navigate('/addresses'),
        },
        {
            key: 'orders',
            label: 'Đơn hàng',
            icon: <HistoryOutlined />,
            onClick: () => navigate('/orders'),
        },
        ...(isAdmin
            ? [
                {
                    type: 'divider' as const,
                },
                {
                    key: 'admin',
                    label: 'Quản trị',
                    icon: <DashboardOutlined />,
                    onClick: () => navigate('/admin'),
                },
            ]
            : []),
        {
            type: 'divider' as const,
        },
        {
            key: 'logout',
            label: 'Đăng xuất',
            icon: <LogoutOutlined />,
            onClick: logout,
            danger: true,
        },
    ];

    const mainMenuItems: MenuProps['items'] = [
        {
            key: '/',
            label: <Link to="/">Trang chủ</Link>
        },
        {
            key: '/products',
            label: <Link to="/products">Sản phẩm</Link>
        },
        {
            key: '/about',
            label: <Link to="/about">Về chúng tôi</Link>
        },
        {
            key: '/contact',
            label: <Link to="/contact">Liên hệ</Link>
        },
    ];

    const getCurrentMenuKey = () => {
        if (location.pathname === '/') return '/';
        if (location.pathname.startsWith('/products')) return '/products';
        if (location.pathname.startsWith('/about')) return '/about';
        if (location.pathname.startsWith('/contact')) return '/contact';
        return location.pathname;
    };

    return (
        <Header
            style={{
                background: '#fff',
                padding: '0 48px',
                height: 64,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #f0f0f0',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
        >
            <Link
                to="/"
                style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#1890ff',
                    letterSpacing: 1,
                    textDecoration: 'none',
                    marginRight: 48,
                    whiteSpace: 'nowrap',
                }}
            >
                Crystal
            </Link>

            <Menu
                mode="horizontal"
                selectedKeys={[getCurrentMenuKey()]}
                items={mainMenuItems}
                style={{
                    flex: 1,
                    border: 'none',
                    fontWeight: 500,
                }}
            />

            <Space size="large">
                <Badge count={lines.length} size="small" offset={[-2, 2]}>
                    <ShoppingCartOutlined
                        style={{
                            fontSize: 22,
                            cursor: 'pointer',
                            color: '#595959',
                        }}
                        onClick={() => navigate('/cart')}
                    />
                </Badge>

                {user ? (
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        placement="bottomRight"
                        trigger={['click']}
                    >
                        <Space style={{ cursor: 'pointer' }}>
                            <Avatar
                                size="default"
                                icon={<UserOutlined />}
                                style={{
                                    backgroundColor: '#1890ff',
                                }}
                            />
                            <span style={{
                                maxWidth: 150,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}>
                                {user.email}
                            </span>
                        </Space>
                    </Dropdown>
                ) : (
                    <Link to="/login">
                        <Avatar
                            size="default"
                            icon={<UserOutlined />}
                            style={{
                                backgroundColor: '#d9d9d9',
                                cursor: 'pointer',
                            }}
                        />
                    </Link>
                )}
            </Space>
        </Header>
    );
}
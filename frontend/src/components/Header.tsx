import {
    Layout,
    Menu,
    Dropdown,
    Avatar,
    Badge
} from 'antd';
import type { MenuProps } from 'antd';
import {
    ShoppingCartOutlined,
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined,
    HistoryOutlined,
    EnvironmentOutlined,
    SearchOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useCart from '../hooks/useCart';

const { Header } = Layout;

export default function AppHeader() {
    const navigate = useNavigate();
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
                    key: 'admin',
                    label: 'Quản trị',
                    icon: <DashboardOutlined />,
                    onClick: () => navigate('/admin'),
                },
            ]
            : []),
        {
            type: 'divider',
        },
        {
            key: 'logout',
            label: 'Đăng xuất',
            icon: <LogoutOutlined />,
            onClick: logout,
        },
    ];

    const mainMenuItems: MenuProps['items'] = [
        { key: 'home', label: <Link to="/">Trang chủ</Link> },
        { key: 'products', label: <Link to="/products">Sản phẩm</Link> },
        { key: 'about', label: <Link to="/about">Về chúng tôi</Link> },
        { key: 'contact', label: <Link to="/contact">Liên hệ</Link> },
    ];

    return (
        <Header
            style={{
                background: '#fff',
                padding: '0 64px',
                height: 60,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #f0f0f0',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
            }}
        >

            <Link
                to="/"
                style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#000',
                    letterSpacing: 1,
                }}
            >
                Crystal
            </Link>

            <Menu
                mode="horizontal"
                selectable={false}
                items={mainMenuItems}
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    borderBottom: 'none',
                    fontWeight: 500,
                }}
            />

            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 20,
                }}
            >
                <SearchOutlined
                    style={{ fontSize: 18, cursor: 'pointer' }}
                />

                <Badge count={lines.length} size="small">
                    <ShoppingCartOutlined
                        style={{ fontSize: 20, cursor: 'pointer' }}
                        onClick={() => navigate('/cart')}
                    />
                </Badge>

                {user ? (
                    <Dropdown
                        menu={{ items: userMenuItems }}
                        placement="bottomRight"
                        trigger={['hover']}
                    >
                        <Avatar
                            size="small"
                            icon={<UserOutlined />}
                            style={{ cursor: 'pointer' }}
                        />
                    </Dropdown>
                ) : (
                    <Link to="/login">
                        <UserOutlined style={{ fontSize: 20 }} />
                    </Link>
                )}
            </div>
        </Header>
    );
}

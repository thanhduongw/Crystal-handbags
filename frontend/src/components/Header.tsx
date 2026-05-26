import {
    Layout,
    Menu,
    Dropdown,
    Avatar,
    Badge,
    Space,
    Input,
} from 'antd';
import type { MenuProps } from 'antd';
import {
    ShoppingCartOutlined,
    UserOutlined,
    LogoutOutlined,
    DashboardOutlined,
    HistoryOutlined,
    EnvironmentOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useCart from '../hooks/useCart';
import { useState } from 'react';

const { Header } = Layout;
const { Search } = Input;

export default function AppHeader() {
    const navigate = useNavigate();
    const location = useLocation();
    const { lines } = useCart();
    const { user, logout, isAdmin } = useAuth();
    const [searchValue, setSearchValue] = useState('');

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

    const handleSearch = (value: string) => {
        if (value.trim()) {
            navigate(`/products/search?q=${encodeURIComponent(value.trim())}`);
            setSearchValue('');
        }
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
                    marginRight: 32,
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
                    border: 'none',
                    fontWeight: 500,
                    minWidth: 0,
                    margin: '0 auto',
                    flex: 1
                }}
            />
            <Search
                placeholder="Tìm kiếm sản phẩm..."
                allowClear
                enterButton={<SearchOutlined />}
                size="middle"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onSearch={handleSearch}
                style={{
                    maxWidth: 400,
                    margin: '0 auto',
                }}
            />

            <Space size="large" style={{ marginLeft: 32 }}>
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

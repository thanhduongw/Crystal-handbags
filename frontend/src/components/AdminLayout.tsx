import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Avatar, Breadcrumb, Dropdown, Grid, Layout, Menu, Space, Typography } from 'antd';
import {
    AppstoreOutlined,
    DashboardOutlined,
    HomeOutlined,
    LogoutOutlined,
    ShoppingOutlined,
    TagsOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { useAuth } from '../hooks/useAuth';
import { getProfile } from '../api/userAPI';
import type { UserProfileDto } from '../types';
import '../styles/admin.css';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);
    const [profile, setProfile] = useState<UserProfileDto | null>(null);

    const isMobileLayout = !screens.lg;

    useEffect(() => {
        let mounted = true;

        const loadProfile = async () => {
            if (!user) return;

            try {
                const data = await getProfile();

                if (mounted) {
                    setProfile(data);
                }
            } catch (error) {
                console.error('Load admin profile error:', error);

                if (mounted) {
                    setProfile(null);
                }
            }
        };

        void loadProfile();

        const reloadProfile = () => {
            void loadProfile();
        };

        window.addEventListener('profile:updated', reloadProfile);

        return () => {
            mounted = false;
            window.removeEventListener('profile:updated', reloadProfile);
        };
    }, [user]);

    const selectedKey = useMemo(() => {
        if (location.pathname.startsWith('/admin/orders')) return '/admin/orders';
        if (location.pathname.startsWith('/admin/products')) return '/admin/products';
        if (location.pathname.startsWith('/admin/categories')) return '/admin/categories';
        if (location.pathname.startsWith('/admin/users')) return '/admin/users';
        return '/admin';
    }, [location.pathname]);

    const breadcrumbItems = useMemo(() => {
        const items = [{ title: <Link to="/admin">Tổng quan</Link> }];

        if (location.pathname.startsWith('/admin/orders')) {
            items.push({ title: <Link to="/admin/orders">Đơn hàng</Link> });
        } else if (location.pathname.startsWith('/admin/products')) {
            items.push({ title: <Link to="/admin/products">Sản phẩm</Link> });
        } else if (location.pathname.startsWith('/admin/categories')) {
            items.push({ title: <Link to="/admin/categories">Danh mục</Link> });
        } else if (location.pathname.startsWith('/admin/users')) {
            items.push({ title: <Link to="/admin/users">Khách hàng</Link> });
        }

        return items;
    }, [location.pathname]);

    const menuItems: MenuProps['items'] = [
        {
            key: '/admin',
            icon: <DashboardOutlined />,
            label: <Link to="/admin">Tổng quan</Link>,
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
            icon: <TagsOutlined />,
            label: <Link to="/admin/categories">Danh mục</Link>,
        },
        {
            key: '/admin/users',
            icon: <UserOutlined />,
            label: <Link to="/admin/users">Khách hàng</Link>,
        },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'home',
            icon: <HomeOutlined />,
            label: 'Về cửa hàng',
            onClick: () => navigate('/'),
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            onClick: handleLogout,
            danger: true,
        },
    ];

    const adminName = profile
        ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim()
        : '';

    return (
        <Layout className="admin-shell">
            <Sider
                width={252}
                theme="light"
                collapsible
                collapsed={collapsed}
                onCollapse={setCollapsed}
                breakpoint="lg"
                collapsedWidth={isMobileLayout ? 0 : 76}
                className="admin-sider"
            >
                <div className="admin-brand">
                    <Space size={12} align="center">
                        <img
                            src="/Crystal-logo.png"
                            alt="Crystal Handbags"
                            className="admin-brand-logo"
                        />
                        {!collapsed && (
                            <div>
                                <p className="admin-brand-title">Crystal Handbags</p>
                                <p className="admin-brand-subtitle">Quản trị</p>
                            </div>
                        )}
                    </Space>
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    className="admin-menu"
                />
            </Sider>

            <Layout className={`admin-layout ${collapsed ? 'admin-layout-collapsed' : ''}`}>
                <Header className="admin-topbar">
                    <div>
                        <div className="admin-topbar-title">Bảng quản trị</div>
                        <Breadcrumb className="admin-breadcrumb" items={breadcrumbItems} />
                    </div>

                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                        <div className="admin-profile-trigger">
                            <Avatar
                                src={profile?.photoUrl}
                                icon={<UserOutlined />}
                                style={{
                                    backgroundColor: profile?.photoUrl ? undefined : '#d9d9d9',
                                }}
                            />
                            <div style={{ minWidth: 0 }}>
                                <Text strong ellipsis style={{ maxWidth: 180, display: 'block' }}>
                                    {adminName || 'Admin'}
                                </Text>
                            </div>
                        </div>
                    </Dropdown>
                </Header>

                <Content className="admin-main">{children}</Content>
            </Layout>
        </Layout>
    );
}

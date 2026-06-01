import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography } from 'antd';
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
import { useAuth } from '../hooks/useAuth';
import { getProfile } from '../api/userAPI';
import type { MenuProps } from 'antd';
import '../styles/admin.css';

const { Sider, Content, Header } = Layout;
const { Text } = Typography;

interface AdminLayoutProps {
    children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [profilePhotoUrl, setProfilePhotoUrl] = useState<string>();

    useEffect(() => {
        let mounted = true;

        const loadProfilePhoto = async () => {
            if (!user) return;

            try {
                const profile = await getProfile();

                if (mounted) {
                    setProfilePhotoUrl(profile.photoUrl);
                }
            } catch (error) {
                console.error('Load admin profile photo error:', error);

                if (mounted) {
                    setProfilePhotoUrl(undefined);
                }
            }
        };

        void loadProfilePhoto();

        const reloadProfilePhoto = () => {
            void loadProfilePhoto();
        };

        window.addEventListener('profile:updated', reloadProfilePhoto);

        return () => {
            mounted = false;
            window.removeEventListener('profile:updated', reloadProfilePhoto);
        };
    }, [user]);

    const selectedKey = useMemo(() => {
        if (location.pathname.startsWith('/admin/orders')) return '/admin/orders';
        if (location.pathname.startsWith('/admin/products')) return '/admin/products';
        if (location.pathname.startsWith('/admin/categories')) return '/admin/categories';
        if (location.pathname.startsWith('/admin/users')) return '/admin/users';
        return '/admin';
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

    return (
        <Layout className="admin-shell">
            <Sider width={252} theme="light" className="admin-sider">
                <div className="admin-brand">
                    <Space size={12} align="center">
                        <img
                            src="/Crystal-logo.png"
                            alt="Crystal Handbags"
                            className="admin-brand-logo"
                        />
                        <div>
                            <p className="admin-brand-title">Crystal Handbags</p>
                            <p className="admin-brand-subtitle">Quản trị</p>
                        </div>
                    </Space>
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[selectedKey]}
                    items={menuItems}
                    className="admin-menu"
                />
            </Sider>

            <Layout className="admin-layout">
                <Header className="admin-topbar">
                    <div>
                        <div className="admin-topbar-title">Bảng quản trị</div>
                        <div className="admin-topbar-subtitle">
                            Theo dõi vận hành, đơn hàng và dữ liệu cửa hàng
                        </div>
                    </div>

                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                        <div className="admin-profile-trigger">
                            <Avatar
                                src={profilePhotoUrl}
                                icon={<UserOutlined />}
                                style={{
                                    backgroundColor: profilePhotoUrl ? undefined : '#d9d9d9',
                                }}
                            />
                            <div style={{ minWidth: 0 }}>
                                <Text strong ellipsis style={{ maxWidth: 180, display: 'block' }}>
                                    {user?.email}
                                </Text>
                                <div className="admin-topbar-subtitle">Quản trị viên</div>
                            </div>
                        </div>
                    </Dropdown>
                </Header>

                <Content className="admin-main">{children}</Content>
            </Layout>
        </Layout>
    );
}

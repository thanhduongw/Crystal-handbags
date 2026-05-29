import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Layout, Menu, Typography, Avatar, Dropdown } from 'antd';
import {
    DashboardOutlined,
    ShoppingOutlined,
    AppstoreOutlined,
    UserOutlined,
    LogoutOutlined,
    HomeOutlined,
    TagsOutlined,
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getProfile } from '../api/userAPI';
import type { MenuProps } from 'antd';

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

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

    const menuItems: MenuProps['items'] = [
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
            icon: <TagsOutlined />,
            label: <Link to="/admin/categories">Danh mục</Link>,
        },
        {
            key: '/admin/users',
            icon: <UserOutlined />,
            label: <Link to="/admin/users">Người dùng</Link>,
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
            label: 'Về trang chủ',
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
        <Layout style={{ minHeight: '100vh' }}>
            <Sider
                width={250}
                theme="light"
                style={{
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                }}
            >
                <div
                    style={{
                        padding: 16,
                        borderBottom: '1px solid #e8e8e8',
                        textAlign: 'center',
                    }}
                >
                    <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
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

            <Layout style={{ marginLeft: 250 }}>
                <Header
                    style={{
                        background: '#fff',
                        padding: '0 24px',
                        borderBottom: '1px solid #e8e8e8',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                    }}
                >
                    <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                padding: '0 12px',
                            }}
                        >
                            <Avatar
                                src={profilePhotoUrl}
                                icon={<UserOutlined />}
                                style={{
                                    marginRight: 8,
                                    backgroundColor: profilePhotoUrl ? undefined : '#d9d9d9',
                                }}
                            />
                            <span>{user?.email}</span>
                        </div>
                    </Dropdown>
                </Header>

                <Content
                    style={{
                        padding: 24,
                        minHeight: 'calc(100vh - 64px)',
                        background: '#f0f2f5',
                    }}
                >
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
}
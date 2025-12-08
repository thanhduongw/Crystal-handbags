import { Menu, Dropdown, Avatar, Typography, Badge, type MenuProps } from 'antd';
import { ShoppingCartOutlined, UserOutlined, LogoutOutlined, DashboardOutlined, HistoryOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import useCart from '../hooks/useCart';

const { Text } = Typography;

export default function Header() {
    const navigate = useNavigate();
    const { lines } = useCart();
    const { user, logout, isAdmin } = useAuth();

    const userMenuItems: MenuProps['items'] = [
        {
            key: 'profile',
            icon: <UserOutlined />,
            label: 'Hồ sơ',
            onClick: () => navigate('/profile'),
        },
        {
            key: 'orders',
            icon: <HistoryOutlined />,
            label: 'Đơn hàng',
            onClick: () => navigate('/orders'),
        },
        ...(isAdmin
            ? [
                {
                    key: 'admin',
                    icon: <DashboardOutlined />,
                    label: 'Quản trị',
                    onClick: () => navigate('/admin'),
                },
            ]
            : []),
        {
            type: 'divider' as const, // <-- cast to 'divider' to satisfy TS
        },
        {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Đăng xuất',
            onClick: logout,
        },
    ];

    const menuItems: MenuProps['items'] = [
        {
            key: 'home',
            label: <Link to="/">Trang chủ</Link>,
        },
        {
            key: 'cart',
            label: (
                <Badge count={lines.length} offset={[10, 0]}>
                    Giỏ hàng
                </Badge>
            ),
            icon: <ShoppingCartOutlined />,
            onClick: () => navigate('/cart'),
        },
    ];

    if (user) {
        menuItems.push({
            key: 'user',
            label: (
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                    <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar size="small" icon={<UserOutlined />} />
                        <Text>{user.email}</Text>
                    </div>
                </Dropdown>
            ),
        });
    } else {
        menuItems.push(
            {
                key: 'login',
                label: <Link to="/login">Đăng nhập</Link>,
            },
            {
                key: 'register',
                label: <Link to="/register">Đăng ký</Link>,
            }
        );
    }

    return (
        <Menu
            mode="horizontal"
            selectedKeys={[]}
            style={{ justifyContent: 'center', fontWeight: 'bold' }}
            items={menuItems}
        />
    );
}

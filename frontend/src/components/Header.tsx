import { Badge, Menu } from 'antd';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';

export default function Header() {
    const navigate = useNavigate();
    const { lines } = useCart();

    const menuItems = [
        {
            key: 'home',
            label: <Link to="/">Trang chủ</Link>,
        },
        {
            key: 'cart',
            label: 'Giỏ hàng',
            icon: <Badge count={lines.length}><ShoppingCartOutlined /></Badge>,
            onClick: () => navigate('/cart'),
        },
    ];

    return (
        <Menu mode="horizontal" selectedKeys={[]} items={menuItems} />
    );
}

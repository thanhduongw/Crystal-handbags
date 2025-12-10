import { Table, Button, InputNumber, Typography, Card, Empty } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import type { CartLineDto } from '../types';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

export default function Cart() {
    const navigate = useNavigate();
    const { lines, updateQty, removeItem, total } = useCart();
    const { user } = useAuth();

    const columns = [
        {
            title: 'Tên',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Ảnh',
            key: 'img',
            render: (_: any, r: CartLineDto) => (
                <img src={r.avatar || 'https://placehold.co/600x400'} alt="" width={60} style={{ borderRadius: 8 }} />
            ),
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            render: (p: number) => `${p.toLocaleString()} đ`,
        },
        {
            title: 'Số lượng',
            key: 'qty',
            render: (_: any, r: CartLineDto) => (
                <InputNumber
                    min={1}
                    value={r.qty}
                    onChange={(val) => updateQty(r.itemId, val || 1)}
                />
            ),
        },
        {
            title: 'Thành tiền',
            key: 'total',
            render: (_: any, r: CartLineDto) => `${(r.price * r.qty).toLocaleString()} đ`,
        },
        {
            title: '',
            key: 'del',
            render: (_: any, r: CartLineDto) => (
                <Button danger icon={<DeleteOutlined />} onClick={() => removeItem(r.itemId)} />
            ),
        },
    ];

    if (lines.length === 0) {
        return (
            <div style={{ maxWidth: 800, margin: '50px auto', textAlign: 'center' }}>
                <Empty
                    image={<ShoppingCartOutlined style={{ fontSize: 64 }} />}
                    description="Giỏ hàng trống"
                />
                <Button type="primary" onClick={() => navigate('/')}>
                    Tiếp tục mua sắm
                </Button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '50px auto', padding: '0 16px' }}>
            <Card>
                <Title level={3}>Giỏ hàng</Title>
                <Table rowKey="itemId" columns={columns} dataSource={lines} pagination={false} />
                <div style={{ marginTop: 24, textAlign: 'right' }}>
                    <Title level={4}>Tổng cộng: {total.toLocaleString()} đ</Title>
                    <Button
                        type="primary"
                        size="large"
                        onClick={() => user ? navigate('/checkout') : navigate('/login')}
                    >
                        {user ? 'Tiến hành đặt hàng' : 'Đăng nhập để đặt hàng'}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
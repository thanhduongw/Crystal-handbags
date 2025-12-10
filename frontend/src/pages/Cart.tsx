import { Table, Button, InputNumber, Typography, Card, Empty, Space, Image } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ShoppingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import type { CartLineDto } from '../types';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

export default function Cart() {
    const navigate = useNavigate();
    const { lines, updateQty, removeItem, total, loading } = useCart();
    const { user } = useAuth();

    const columns = [
        {
            title: 'Sản phẩm',
            key: 'product',
            render: (_: any, record: CartLineDto) => (
                <Space>
                    <Image
                        src={record.avatar || 'https://placehold.co/80x80'}
                        alt={record.name}
                        width={80}
                        height={80}
                        style={{
                            objectFit: 'cover',
                            borderRadius: 8
                        }}
                        fallback="https://placehold.co/80x80?text=No+Image"
                    />
                    <Text strong>{record.name}</Text>
                </Space>
            ),
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            align: 'center' as const,
            render: (price: number) => `${price.toLocaleString()} đ`,
        },
        {
            title: 'Số lượng',
            key: 'qty',
            align: 'center' as const,
            render: (_: any, record: CartLineDto) => (
                <InputNumber
                    min={1}
                    value={record.qty}
                    onChange={(val) => updateQty(record.itemId, val || 1)}
                    style={{ width: 80 }}
                />
            ),
        },
        {
            title: 'Thành tiền',
            key: 'total',
            align: 'right' as const,
            render: (_: any, record: CartLineDto) => (
                <Text strong style={{ color: '#ff4d4f' }}>
                    {(record.price * record.qty).toLocaleString()} đ
                </Text>
            ),
        },
        {
            title: '',
            key: 'action',
            width: 80,
            align: 'center' as const,
            render: (_: any, record: CartLineDto) => (
                <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeItem(record.itemId)}
                    type="text"
                />
            ),
        },
    ];

    if (lines.length === 0 && !loading) {
        return (
            <div style={{
                maxWidth: 800,
                margin: '80px auto',
                padding: '0 16px',
                textAlign: 'center'
            }}>
                <Empty
                    image={<ShoppingCartOutlined style={{ fontSize: 80, color: '#d9d9d9' }} />}
                    description="Giỏ hàng trống"
                    style={{ marginBottom: 24 }}
                >
                    <Button
                        type="primary"
                        size="large"
                        icon={<ShoppingOutlined />}
                        onClick={() => navigate('/products')}
                    >
                        Tiếp tục mua sắm
                    </Button>
                </Empty>
            </div>
        );
    }

    return (
        <div style={{
            maxWidth: 1200,
            margin: '24px auto',
            padding: '0 16px'
        }}>
            <Card loading={loading}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 24
                }}>
                    <Title level={3} style={{ margin: 0 }}>
                        Giỏ hàng của bạn
                    </Title>
                    <Text type="secondary">
                        {lines.length} sản phẩm
                    </Text>
                </div>

                <Table
                    rowKey="itemId"
                    columns={columns}
                    dataSource={lines}
                    pagination={false}
                    scroll={{ x: 800 }}
                />

                <div style={{
                    marginTop: 32,
                    padding: '24px',
                    background: '#fafafa',
                    borderRadius: 8,
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <div>
                            <Text type="secondary" style={{ fontSize: 16 }}>
                                Tổng cộng:
                            </Text>
                            <Title level={3} style={{
                                margin: '8px 0 0 0',
                                color: '#ff4d4f'
                            }}>
                                {total.toLocaleString()} đ
                            </Title>
                        </div>
                        <Button
                            type="primary"
                            size="large"
                            onClick={() => user ? navigate('/checkout') : navigate('/login')}
                            style={{ minWidth: 200 }}
                        >
                            {user ? 'Tiến hành đặt hàng' : 'Đăng nhập để đặt hàng'}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
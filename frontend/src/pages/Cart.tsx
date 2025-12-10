import { Table, Button, InputNumber, Typography, Card, Empty, Space, Image, message } from 'antd';
import { DeleteOutlined, ShoppingCartOutlined, ShoppingOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import type { CartLineDto } from '../types';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

export default function Cart() {
    const navigate = useNavigate();
    const { lines, updateQty, removeItem, total, loading } = useCart();
    const { user } = useAuth();

    const handleQtyChange = (itemId: number, newQty: number) => {
        if (newQty < 1) {
            message.warning('Số lượng tối thiểu là 1');
            return;
        }
        updateQty(itemId, newQty);
    };

    const handleRemove = (itemId: number, name: string) => {
        removeItem(itemId);
        message.success(`Đã xóa "${name}" khỏi giỏ hàng`);
    };

    const columns = [
        {
            title: 'Sản phẩm',
            key: 'product',
            render: (_: any, record: CartLineDto) => (
                <Space>
                    <Image
                        src={record.avatar || 'https://placehold.co/80x80?text=No+Image'}
                        alt={record.name}
                        width={80}
                        height={80}
                        style={{
                            objectFit: 'cover',
                            borderRadius: 8
                        }}
                        fallback="https://placehold.co/80x80?text=Error"
                        preview={false}
                    />
                    <Text strong style={{ maxWidth: 300 }}>{record.name}</Text>
                </Space>
            ),
        },

        {
            title: 'Màu',
            dataIndex: 'color',
            key: 'color',
            align: 'center' as const,
            render: (color: string) => (
                <Text>{color}</Text>
            ),
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            align: 'center' as const,
            render: (price: number) => (
                <Text>{price.toLocaleString('vi-VN')} ₫</Text>
            ),
        },
        {
            title: 'Số lượng',
            key: 'qty',
            align: 'center' as const,
            render: (_: any, record: CartLineDto) => (
                <Space.Compact>
                    <Button
                        size="small"
                        icon={<MinusOutlined />}
                        onClick={() => handleQtyChange(record.itemId, record.qty - 1)}
                        disabled={record.qty <= 1}
                    />
                    <InputNumber
                        min={1}
                        value={record.qty}
                        onChange={(val) => handleQtyChange(record.itemId, val || 1)}
                        style={{ width: 60, textAlign: 'center' }}
                        size="small"
                        controls={false}
                    />
                    <Button
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={() => handleQtyChange(record.itemId, record.qty + 1)}
                    />
                </Space.Compact>
            ),
        },
        {
            title: 'Thành tiền',
            key: 'total',
            align: 'right' as const,
            render: (_: any, record: CartLineDto) => (
                <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                    {(record.price * record.qty).toLocaleString('vi-VN')} ₫
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
                    onClick={() => handleRemove(record.itemId, record.name)}
                    type="text"
                    title="Xóa khỏi giỏ hàng"
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
                    description={
                        <div>
                            <Text style={{ fontSize: 18, display: 'block', marginBottom: 8 }}>
                                Giỏ hàng trống
                            </Text>
                            <Text type="secondary">
                                Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
                            </Text>
                        </div>
                    }
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
                        flexWrap: 'wrap',
                        gap: 16,
                    }}>
                        <div>
                            <Text type="secondary" style={{ fontSize: 14 }}>
                                Tạm tính:
                            </Text>
                            <Title level={3} style={{
                                margin: '8px 0 0 0',
                                color: '#ff4d4f'
                            }}>
                                {total.toLocaleString('vi-VN')} ₫
                            </Title>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                (Chưa bao gồm phí vận chuyển)
                            </Text>
                        </div>
                        <Space orientation="vertical" size="small">
                            <Button
                                type="primary"
                                size="large"
                                onClick={() => user ? navigate('/checkout') : navigate('/login')}
                                style={{ minWidth: 200 }}
                                block
                            >
                                {user ? 'Tiến hành đặt hàng' : 'Đăng nhập để đặt hàng'}
                            </Button>
                            <Button
                                size="large"
                                onClick={() => navigate('/products')}
                                style={{ minWidth: 200 }}
                                block
                            >
                                Tiếp tục mua sắm
                            </Button>
                        </Space>
                    </div>
                </div>
            </Card>
        </div>
    );
}
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Typography, Card, Button, Spin, message, Divider, Radio, Space, Table, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import useCart from '../hooks/useCart';
import { fetchAddresses } from '../api/addressAPI';
import { checkout as checkoutAPI } from '../api/cartAPI';
import type { Address, CartLineDto, PaymentMethod } from '../types';

const { Title, Text } = Typography;

function AddressSelector({ addresses, selectedId, onSelect }: { addresses: Address[], selectedId: number | null, onSelect: (id: number) => void }) {
    if (addresses.length === 0) {
        return (
            <Button type="dashed" block icon={<PlusOutlined />} onClick={() => window.location.href = '/addresses'}>
                Thêm địa chỉ mới
            </Button>
        );
    }
    return (
        <Radio.Group value={selectedId} style={{ width: '100%' }}>
            <Space orientation="vertical" style={{ width: '100%' }}>
                {addresses.map(addr => (
                    <Card
                        key={addr.addressId}
                        size="small"
                        hoverable
                        style={{
                            borderColor: selectedId === addr.addressId ? '#1890ff' : '#d9d9d9',
                            backgroundColor: selectedId === addr.addressId ? '#e6f7ff' : '#fff',
                            cursor: 'pointer',
                        }}
                        onClick={() => onSelect(addr.addressId)}
                    >
                        <Radio value={addr.addressId} style={{ width: '100%' }}>
                            <Space orientation="vertical">
                                <Text strong>{addr.fullName} - {addr.phoneNumber}</Text>
                                <Text type="secondary">{addr.street}, {addr.ward}, {addr.district}, {addr.province}</Text>
                                {addr.isDefault && <Tag color="blue">Mặc định</Tag>}
                            </Space>
                        </Radio>
                    </Card>
                ))}
            </Space>
        </Radio.Group>
    );
}

function PaymentSelector({ value, onChange }: { value: PaymentMethod, onChange: (val: PaymentMethod) => void }) {
    return (
        <Radio.Group onChange={e => onChange(e.target.value)} value={value}>
            <Space orientation="vertical">
                <Radio value="CASH">Tiền mặt</Radio>
                <Radio value="CARD">Thẻ</Radio>
            </Space>
        </Radio.Group>
    );
}

export default function Checkout() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { lines, total: cartTotal, loading: cartLoading, clearCart } = useCart();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('CASH');
    const [loading, setLoading] = useState(false);

    const shippingFee = 30000;
    const totalAmount = cartTotal + shippingFee;

    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
        (async () => {
            try {
                const data = await fetchAddresses();
                setAddresses(data);
                const defaultAddr = data.find(a => a.isDefault);
                setSelectedAddressId(defaultAddr?.addressId || data[0]?.addressId || null);
            } catch {
                message.error('Không thể tải địa chỉ!');
            }
        })();
    }, [user]);

    const handleCheckout = async () => {
        if (!selectedAddressId) return;
        try {
            setLoading(true);
            const order = await checkoutAPI(selectedAddressId, selectedPayment, lines.map(l => l.itemId));
            clearCart();
            message.success('Đặt hàng thành công!');
            navigate(`/orders/${order.orderId}`);
        } catch {
            message.error('Đặt hàng thất bại!');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            title: 'Sản phẩm',
            render: (record: CartLineDto) => (
                <Space>
                    <img src={record.avatar || 'https://placehold.co/80x80'} alt={record.name} width={60} height={60} style={{ objectFit: 'cover', borderRadius: 6 }} />
                    <Text strong>{record.name}</Text>
                </Space>
            ),
        },
        { title: 'Số lượng', dataIndex: 'qty', align: 'center' as const },
        { title: 'Đơn giá', render: (r: CartLineDto) => `${r.price.toLocaleString()} đ` },
        { title: 'Thành tiền', render: (r: CartLineDto) => `${(r.price * r.qty).toLocaleString()} đ` },
    ];

    if (cartLoading) return <Spin style={{ display: 'block', margin: '100px auto' }} size="large" />;
    if (!user) return null;

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
            <Title level={2}>Thanh toán</Title>
            <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                    <Card title="Địa chỉ giao hàng" style={{ marginBottom: 24 }}>
                        <AddressSelector addresses={addresses} selectedId={selectedAddressId} onSelect={setSelectedAddressId} />
                        <Button
                            type="dashed"
                            block
                            icon={<PlusOutlined />}
                            style={{ marginTop: 16 }}
                            onClick={() => navigate('/addresses', { state: { fromCheckout: true } })}
                        >
                            Quản lý địa chỉ
                        </Button>
                    </Card>

                    <Card title="Phương thức thanh toán">
                        <PaymentSelector value={selectedPayment} onChange={setSelectedPayment} />
                    </Card>
                </Col>

                <Col xs={24} md={12}>
                    <Card title="Tóm tắt đơn hàng">
                        <Table dataSource={lines} columns={columns} pagination={false} rowKey="itemId" size="small" />
                        <Divider />
                        <Space orientation="vertical" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Tạm tính:</Text><Text>{cartTotal.toLocaleString()} đ</Text>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text>Phí vận chuyển:</Text><Text>{shippingFee.toLocaleString()} đ</Text>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 600 }}>
                                <Text strong>Tổng cộng:</Text>
                                <Text type="danger" strong>{totalAmount.toLocaleString()} đ</Text>
                            </div>
                            <Button
                                type="primary"
                                size="large"
                                block
                                disabled={lines.length === 0 || !selectedAddressId}
                                loading={loading}
                                style={{ marginTop: 16 }}
                                onClick={handleCheckout}
                            >
                                Đặt hàng
                            </Button>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
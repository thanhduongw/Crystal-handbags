import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Row,
    Col,
    Typography,
    Radio,
    Table,
    Card,
    Button,
    Spin,
    Alert,
    Divider,
    Space,
    message,
    Tag,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import useCart from '../hooks/useCart';
import { fetchAddresses } from '../api/addressAPI';
import { checkout as checkoutAPI } from '../api/cartAPI';
import type { Address, CartLineDto, PaymentMethod } from '../types';

const { Title, Text } = Typography;

export default function Checkout() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { lines, total: cartTotal, loading: cartLoading, clearCart } = useCart();
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const shippingFee = 30000; // Có thể thay đổi theo logic tính phí ship
    const totalAmount = cartTotal + shippingFee;

    useEffect(() => {
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
        loadAddresses();
    }, [user, navigate]);

    const loadAddresses = async () => {
        try {
            const data = await fetchAddresses();
            setAddresses(data);
            const defaultAddr = data.find((a) => a.isDefault);
            if (defaultAddr) setSelectedAddressId(defaultAddr.addressId);
            else if (data.length > 0) setSelectedAddressId(data[0].addressId);
        } catch (error) {
            message.error('Không thể tải danh sách địa chỉ!');
        }
    };

    const handleCheckout = async () => {
        if (!selectedAddressId) {
            setError('Vui lòng chọn địa chỉ giao hàng!');
            return;
        }
        if (lines.length === 0) {
            setError('Giỏ hàng trống!');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            await checkoutAPI(selectedAddressId);
            await clearCart();
            message.success('Đặt hàng thành công! Chuyển hướng đến lịch sử đơn hàng...');
            setTimeout(() => navigate('/orders'), 1500);
        } catch (error: any) {
            setError(error?.response?.data?.message || 'Đặt hàng thất bại. Vui lòng thử lại!');
        } finally {
            setLoading(false);
        }
    };

    if (cartLoading) return <Spin style={{ display: 'block', margin: '100px auto' }} size="large" />;
    if (!user) return null;

    const columns = [
        {
            title: 'Sản phẩm',
            render: (record: CartLineDto) => (
                <Space size="middle">
                    <img
                        src={record.avatar || 'https://placehold.co/600x400'}
                        alt={record.name}
                        width={50}
                        height={50}
                        style={{ objectFit: 'cover', borderRadius: 6 }}
                    />
                    <Text strong>{record.name}</Text>
                </Space>
            ),
        },
        { title: 'Số lượng', dataIndex: 'qty', align: 'center' as const },
        { title: 'Đơn giá', render: (record: CartLineDto) => `${record.price.toLocaleString()} đ` },
        { title: 'Thành tiền', render: (record: CartLineDto) => `${(record.price * record.qty).toLocaleString()} đ` },
    ];

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
            <Title level={2} style={{ marginBottom: 24 }}>Thanh toán</Title>
            {error && <Alert message={error} type="error" showIcon closable style={{ marginBottom: 24 }} />}

            <Row gutter={[24, 24]}>
                <Col xs={24} md={16}>
                    <Card title={<Title level={4}>Địa chỉ giao hàng</Title>} style={{ marginBottom: 24 }}>
                        {addresses.length === 0 ? (
                            <Alert
                                message="Bạn chưa có địa chỉ nào"
                                type="warning"
                                action={<Button type="primary" size="small" onClick={() => navigate('/addresses')}>Thêm địa chỉ</Button>}
                            />
                        ) : (
                            <Radio.Group value={selectedAddressId} onChange={(e) => setSelectedAddressId(e.target.value)} style={{ width: '100%' }}>
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {addresses.map((addr) => (
                                        <Card key={addr.addressId} size="small" hoverable
                                            style={{ width: '100%', cursor: 'pointer', borderColor: selectedAddressId === addr.addressId ? '#1890ff' : '#d9d9d9', backgroundColor: selectedAddressId === addr.addressId ? '#e6f7ff' : '#fff' }}
                                            onClick={() => setSelectedAddressId(addr.addressId)}>
                                            <Radio value={addr.addressId} style={{ width: '100%' }}>
                                                <Space direction="vertical" size={0} style={{ width: '100%' }}>
                                                    <div>
                                                        <Text strong>{addr.fullName} - {addr.phoneNumber}</Text>
                                                        {addr.isDefault && <Tag color="blue" style={{ marginLeft: 8 }}>Mặc định</Tag>}
                                                    </div>
                                                    <Text type="secondary">{addr.street}, {addr.ward}, {addr.district}, {addr.province}</Text>
                                                </Space>
                                            </Radio>
                                        </Card>
                                    ))}
                                </Space>
                            </Radio.Group>
                        )}
                        <Button type="dashed" block icon={<PlusOutlined />} style={{ marginTop: 16 }} onClick={() => navigate('/addresses')}>
                            Quản lý địa chỉ
                        </Button>
                    </Card>

                    <Card title={<Title level={4}>Phương thức thanh toán</Title>}>
                        <Radio.Group value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} style={{ width: '100%' }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Radio value="CASH">Thanh toán khi nhận hàng (COD)</Radio>
                                <Radio value="CARD">Thẻ tín dụng/ghi nợ</Radio>
                                <Radio value="UPI">UPI</Radio>
                                <Radio value="BANK_TRANSFER">Chuyển khoản ngân hàng</Radio>
                            </Space>
                        </Radio.Group>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card title={<Title level={4}>Tóm tắt đơn hàng</Title>}>
                        <Table dataSource={lines} columns={columns} pagination={false} rowKey="itemId" size="small" />
                        <Divider />
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Tạm tính:</Text><Text>{cartTotal.toLocaleString()} đ</Text></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}><Text>Phí vận chuyển:</Text><Text>{shippingFee.toLocaleString()} đ</Text></div>
                            <Divider style={{ margin: '8px 0' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 600 }}>
                                <Text strong>Tổng cộng:</Text>
                                <Text type="danger" strong>{totalAmount.toLocaleString()} đ</Text>
                            </div>
                            <Button type="primary" size="large" block onClick={handleCheckout} disabled={lines.length === 0 || !selectedAddressId} loading={loading} style={{ marginTop: 16 }}>
                                Đặt hàng
                            </Button>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
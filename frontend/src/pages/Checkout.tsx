import { useState, useEffect } from 'react';
import { Form, Select, Button, Card, Typography, Spin, message, Radio, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import useCart from '../hooks/useCart';
import { fetchCart, clearCart } from '../api/sessionCartAPI';
import type { Address, CartLine } from '../types';
import { fetchAddresses } from '../api/addressAPI';

const { Title } = Typography;

export default function Checkout() {
    const SHIP_FEE = 15_000;
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { total } = useCart();
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [cartItems, setCartItems] = useState<CartLine[]>([]);

    useEffect(() => {
        loadCheckoutData();
    }, []);
    const loadCheckoutData = async () => {
        try {
            setLoading(true);
            const [cartData, addressesData] = await Promise.all([
                fetchCart(),
                fetchAddresses(),           // <-- thay cho fetch('/api/addresses')
            ]);
            setCartItems(cartData);
            setAddresses(addressesData);
        } catch (error: any) {
            console.error(error);
            message.error(error.message || 'Không thể tải thông tin thanh toán!');
        } finally {
            setLoading(false);
        }
    };


    const onFinish = async (values: any) => {
        try {
            const res = await fetch('/api/cart/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
                },
                body: JSON.stringify({
                    addressId: values.addressId,
                    paymentMethod: values.paymentMethod,
                }),
            });

            if (!res.ok) {
                const txt = await res.text();
                throw new Error(txt || 'Checkout thất bại');
            }
            const order = await res.json();
            await clearCart();
            message.success('Đặt hàng thành công!');
            navigate(`/orders/${order.orderId}`);
        } catch (err: any) {
            message.error(err.message || 'Đặt hàng thất bại!');
        }
    };

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    if (cartItems.length === 0) {
        return (
            <div style={{ maxWidth: 800, margin: '50px auto', textAlign: 'center' }}>
                <Title level={4}>Giỏ hàng trống</Title>
                <Button type="primary" onClick={() => navigate('/')}>
                    Tiếp tục mua sắm
                </Button>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 800, margin: '50px auto', padding: '0 16px' }}>
            <Card>
                <Title level={3}>Thanh toán</Title>
                <Form form={form} onFinish={onFinish} layout="vertical">
                    <Form.Item
                        name="addressId"
                        label="Địa chỉ nhận hàng"
                        rules={[{ required: true, message: 'Vui lòng chọn địa chỉ!' }]}
                    >
                        <Select placeholder="Chọn địa chỉ">
                            {addresses.map((addr) => (
                                <Select.Option key={addr.addressId} value={addr.addressId}>
                                    {addr.fullName} - {addr.street}, {addr.ward}, {addr.district}, {addr.province}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="paymentMethod"
                        label="Phương thức thanh toán"
                        rules={[{ required: true }]}
                    >
                        <Radio.Group>
                            <Space direction="vertical">
                                <Radio value="CASH">Thanh toán khi nhận hàng</Radio>
                                <Radio value="CARD" disabled>Thẻ tín dụng (Chưa hỗ trợ)</Radio>
                            </Space>
                        </Radio.Group>
                    </Form.Item>

                    <Card style={{ marginBottom: 24 }}>
                        <Title level={5}>Tóm tắt đơn hàng</Title>
                        {cartItems.map((item) => (
                            <div key={item.itemId} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span>{item.name} x {item.qty}</span>
                                <span>{(item.price * item.qty).toLocaleString()} đ</span>
                            </div>
                        ))}
                        <div style={{ borderTop: '1px solid #e8e8e8', marginTop: 16, paddingTop: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <strong>Tổng cộng:</strong>
                                <strong>{total.toLocaleString()} đ</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Phí vận chuyển:</span>
                                <span>15.000 đ</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, color: '#cf1322' }}>
                                <strong>Thành tiền:</strong>
                                <strong>{(total + SHIP_FEE).toLocaleString()} đ</strong>
                            </div>
                        </div>
                    </Card>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" size="large" block>
                            Xác nhận đặt hàng
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
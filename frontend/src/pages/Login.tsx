import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../api/authAPI';
import * as sessionCartAPI from '../api/sessionCartAPI';
import type { AxiosError } from 'axios';

const { Title } = Typography;

export default function Login() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { login: loginContext } = useAuth();

    const onFinish = async (values: { email: string; password: string }) => {
        try {
            setLoading(true);
            const response = await login(values);

            // Parse payload
            const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
            const userData = {
                email: payload.sub,
                role: payload.scope,
                userId: payload.userId,
            };

            // Lưu token trước (cần cho API merge)
            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);

            // === FIX QUAN TRỌNG: Merge session cart TRƯỚC khi set user context ===
            try {
                const sessionCart = await sessionCartAPI.fetchCart();
                if (sessionCart && sessionCart.length > 0) {
                    await sessionCartAPI.mergeCart();
                    console.log('✅ Đã merge giỏ hàng session vào database:', sessionCart.length, 'items');
                    // Xóa session cart sau khi merge thành công
                    await sessionCartAPI.clearCart();
                } else {
                    console.log('Không có session cart để merge');
                }
            } catch (error) {
                console.error('❌ Lỗi khi merge giỏ hàng:', error);
                message.warning('Không thể đồng bộ giỏ hàng, vui lòng kiểm tra lại');
            }

            // Set user context (trigger reload cart ở components)
            loginContext(response.accessToken, response.refreshToken, userData);

            message.success('Đăng nhập thành công!');
            navigate('/');
        } catch (err) {
            const error = err as AxiosError<any>;
            if (error.response) {
                const { status, data } = error.response;
                if (data?.code === 'GMAIL_WRONG_PASSWORD') {
                    message.error('Sai mật khẩu Gmail. Vui lòng kiểm tra lại mật khẩu Gmail của bạn.');
                } else if (data?.code === 'ACCOUNT_NOT_FOUND') {
                    message.error('Không tìm thấy tài khoản với email này.');
                } else if (data?.message) {
                    message.error(data.message);
                } else if (status === 401) {
                    message.error('Email hoặc mật khẩu không đúng!');
                } else {
                    message.error('Đăng nhập thất bại. Vui lòng thử lại.');
                }
            } else if (error.request) {
                message.error('Không thể kết nối tới server. Vui lòng kiểm tra mạng hoặc thử lại sau.');
            } else {
                message.error('Đã xảy ra lỗi. Vui lòng thử lại.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '100px auto' }}>
            <Card>
                <Title level={3} style={{ textAlign: 'center' }}>
                    Đăng nhập
                </Title>
                <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                >
                    <Form.Item
                        name="email"
                        rules={[{ required: true, message: 'Vui lòng nhập email!' }, { type: 'email' }]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Email" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Đăng nhập
                        </Button>
                    </Form.Item>
                    <div style={{ textAlign: 'center' }}>
                        Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
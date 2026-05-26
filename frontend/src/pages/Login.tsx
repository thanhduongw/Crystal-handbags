import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
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

            const payload = JSON.parse(atob(response.accessToken.split('.')[1]));
            const userData = {
                email: payload.sub,
                role: payload.scope,
                userId: payload.userId,
            };

            localStorage.setItem('accessToken', response.accessToken);
            localStorage.setItem('refreshToken', response.refreshToken);

            try {
                const sessionCart = await sessionCartAPI.fetchCart();
                if (sessionCart && sessionCart.length > 0) {
                    await sessionCartAPI.mergeCart();
                    await sessionCartAPI.clearCart();
                }
            } catch (error) {
                console.error('Merge cart error:', error);
                message.warning('Không thể đồng bộ giỏ hàng, vui lòng kiểm tra lại');
            }

            loginContext(response.accessToken, response.refreshToken, userData);

            message.success('Đăng nhập thành công!');
            navigate('/');
        } catch (err) {
            const error = err as AxiosError<{ code?: string; message?: string }>;
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
        <div style={{ maxWidth: 400, margin: '100px auto', padding: '0 16px' }}>
            <Card>
                <Title level={3} style={{ textAlign: 'center' }}>
                    Đăng nhập
                </Title>
                <Form name="login" onFinish={onFinish} layout="vertical">
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <Link to="/forgot-password">Quên mật khẩu?</Link>
                        <span>
                            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
                        </span>
                    </div>
                </Form>
            </Card>
        </div>
    );
}

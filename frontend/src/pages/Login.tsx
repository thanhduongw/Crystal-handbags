import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login } from '../api/authAPI';

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

            loginContext(
                response.accessToken,
                response.refreshToken,
                {
                    email: payload.sub,
                    role: payload.scope,
                    userId: payload.userId,
                }
            );

            message.success('Đăng nhập thành công!');
            navigate('/');
        } catch (error) {
            message.error('Email hoặc mật khẩu không đúng!');
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
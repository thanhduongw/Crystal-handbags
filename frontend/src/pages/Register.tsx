import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/authAPI';

const { Title } = Typography;

export default function Register() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
    }) => {
        try {
            setLoading(true);
            await register(values);
            message.success('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (error) {
            message.error('Email đã được sử dụng!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 400, margin: '100px auto' }}>
            <Card>
                <Title level={3} style={{ textAlign: 'center' }}>
                    Đăng ký
                </Title>
                <Form name="register" onFinish={onFinish} layout="vertical">
                    <Form.Item name="firstName" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                        <Input placeholder="Tên" />
                    </Form.Item>
                    <Form.Item name="lastName" rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}>
                        <Input placeholder="Họ" />
                    </Form.Item>
                    <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>
                    <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                    </Form.Item>
                    <Form.Item name="phoneNumber" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}>
                        <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Đăng ký
                        </Button>
                    </Form.Item>
                    <div style={{ textAlign: 'center' }}>
                        Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
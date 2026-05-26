import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Space } from 'antd';
import { LockOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { register, sendOtp } from '../api/authAPI';
import type { RegisterRequest } from '../types';

const { Title, Text } = Typography;

type RegisterFormValues = RegisterRequest & {
    confirmPassword: string;
};

export default function Register() {
    const [form] = Form.useForm<RegisterFormValues>();
    const [loading, setLoading] = useState(false);
    const [sendingOtp, setSendingOtp] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        if (countdown <= 0) return;
        const timer = window.setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => window.clearTimeout(timer);
    }, [countdown]);

    const handleSendOtp = async () => {
        try {
            await form.validateFields(['email']);
            const email = form.getFieldValue('email');
            setSendingOtp(true);
            await sendOtp({ email, purpose: 'REGISTER' });
            setCountdown(60);
            message.success('Mã OTP đã được gửi đến Gmail của bạn.');
        } catch {
            message.error('Không thể gửi OTP. Vui lòng kiểm tra email.');
        } finally {
            setSendingOtp(false);
        }
    };

    const onFinish = async (values: RegisterFormValues) => {
        try {
            setLoading(true);
            await register({
                email: values.email,
                password: values.password,
                firstName: values.firstName,
                lastName: values.lastName,
                phoneNumber: values.phoneNumber,
                otp: values.otp,
            });
            message.success('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch {
            message.error('Đăng ký thất bại. Vui lòng kiểm tra OTP hoặc email đã sử dụng.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 440, margin: '72px auto', padding: '0 16px' }}>
            <Card>
                <Title level={3} style={{ textAlign: 'center' }}>
                    Đăng ký
                </Title>
                <Form form={form} name="register" onFinish={onFinish} layout="vertical">
                    <Form.Item name="firstName" label="Tên" rules={[{ required: true, message: 'Vui lòng nhập tên!' }]}>
                        <Input placeholder="Tên" />
                    </Form.Item>
                    <Form.Item name="lastName" label="Họ" rules={[{ required: true, message: 'Vui lòng nhập họ!' }]}>
                        <Input placeholder="Họ" />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}>
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>
                    <Form.Item name="phoneNumber" label="Số điện thoại" rules={[
                        { required: true, message: 'Vui lòng nhập số điện thoại!' },
                        { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ!' },
                    ]}>
                        <Input prefix={<PhoneOutlined />} placeholder="0369384679" />
                    </Form.Item>
                    <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="Nhập lại mật khẩu"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: 'Vui lòng nhập lại mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu nhập lại không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" />
                    </Form.Item>
                    <Form.Item
                        name="otp"
                        label="Mã OTP"
                        rules={[
                            { required: true, message: 'Vui lòng nhập OTP!' },
                            { pattern: /^[0-9]{6}$/, message: 'OTP gồm 6 chữ số!' },
                        ]}
                    >
                        <Space.Compact style={{ width: '100%' }}>
                            <Input placeholder="Nhập OTP từ Gmail" maxLength={6} />
                            <Button onClick={handleSendOtp} loading={sendingOtp} disabled={countdown > 0}>
                                {countdown > 0 ? `${countdown}s` : 'Gửi OTP'}
                            </Button>
                        </Space.Compact>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Đăng ký
                        </Button>
                    </Form.Item>
                    <div style={{ textAlign: 'center' }}>
                        <Text>Đã có tài khoản? </Text>
                        <Link to="/login">Đăng nhập</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { Button, Card, Form, Input, Space, Typography, message } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { resetPassword, sendOtp } from '../api/authAPI';

const { Title, Text } = Typography;

type ForgotPasswordValues = {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
};

type ApiError = {
    response?: {
        data?: {
            message?: string;
        };
    };
};

const getApiErrorMessage = (error: unknown) =>
    (error as ApiError).response?.data?.message;

export default function ForgotPassword() {
    const [form] = Form.useForm<ForgotPasswordValues>();
    const [sendingOtp, setSendingOtp] = useState(false);
    const [saving, setSaving] = useState(false);
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
            await sendOtp({ email, purpose: 'RESET_PASSWORD' });
            setCountdown(60);
            message.success('Mã OTP đặt lại mật khẩu đã được gửi đến Gmail.');
        } catch (error) {
            const apiMessage = getApiErrorMessage(error);
            if (apiMessage) {
                message.error(apiMessage);
                return;
            }
            message.error('Không thể gửi OTP. Vui lòng kiểm tra email.');
        } finally {
            setSendingOtp(false);
        }
    };

    const onFinish = async (values: ForgotPasswordValues) => {
        try {
            setSaving(true);
            await resetPassword({
                email: values.email,
                otp: values.otp,
                newPassword: values.newPassword,
            });
            message.success('Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');
            navigate('/login');
        } catch (error) {
            const apiMessage = getApiErrorMessage(error);
            if (apiMessage) {
                message.error(apiMessage);
                return;
            }
            message.error('Đổi mật khẩu thất bại. Vui lòng kiểm tra OTP.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ maxWidth: 440, margin: '72px auto', padding: '0 16px' }}>
            <Card>
                <Title level={3} style={{ textAlign: 'center' }}>
                    Quên mật khẩu
                </Title>
                <Form form={form} layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, type: 'email', message: 'Email không hợp lệ!' }]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="Email tài khoản" />
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

                    <Form.Item
                        name="newPassword"
                        label="Mật khẩu mới"
                        rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label="Nhập lại mật khẩu mới"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Vui lòng nhập lại mật khẩu!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Mật khẩu nhập lại không khớp!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={saving} block>
                            Đổi mật khẩu
                        </Button>
                    </Form.Item>
                </Form>

                <div style={{ textAlign: 'center' }}>
                    <Text>Nhớ mật khẩu? </Text>
                    <Link to="/login">Đăng nhập</Link>
                </div>
            </Card>
        </div>
    );
}

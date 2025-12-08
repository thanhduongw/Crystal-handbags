import { useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Spin } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { getProfile, updateProfile } from '../api/userAPI';
import type { UserProfileDto } from '../types';

const { Title } = Typography;

export default function Profile() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const profile = await getProfile();
            form.setFieldsValue(profile);
        } catch (error) {
            message.error('Không thể tải thông tin hồ sơ!');
        } finally {
            setLoading(false);
        }
    };

    const onFinish = async (values: UserProfileDto) => {
        try {
            setSaving(true);
            await updateProfile(values);
            message.success('Cập nhật hồ sơ thành công!');
        } catch (error) {
            message.error('Cập nhật thất bại!');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div style={{ maxWidth: 600, margin: '50px auto' }}>
            <Card>
                <Title level={3}>Hồ sơ người dùng</Title>
                <Form form={form} onFinish={onFinish} layout="vertical">
                    <Form.Item name="email" label="Email">
                        <Input prefix={<MailOutlined />} disabled />
                    </Form.Item>
                    <Form.Item name="firstName" label="Tên" rules={[{ required: true }]}>
                        <Input prefix={<UserOutlined />} />
                    </Form.Item>
                    <Form.Item name="lastName" label="Họ" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phoneNumber" label="Số điện thoại" rules={[{ required: true }]}>
                        <Input prefix={<PhoneOutlined />} />
                    </Form.Item>
                    <Form.Item name="gender" label="Giới tính">
                        <Input />
                    </Form.Item>
                    <Form.Item name="dob" label="Ngày sinh">
                        <Input type="date" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={saving}>
                            Lưu thay đổi
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
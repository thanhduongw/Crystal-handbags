import { useCallback, useEffect, useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Spin, Upload, Avatar, Space } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { getProfile, updateProfile, uploadProfileAvatar, deleteProfileAvatar } from '../api/userAPI';
import type { UserProfileDto } from '../types';

const { Title } = Typography;

export default function Profile() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState<string>();
    const [avatarPreview, setAvatarPreview] = useState<string>();
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

    const loadProfile = useCallback(async () => {
        try {
            setLoading(true);
            const profile = await getProfile();

            form.setFieldsValue(profile);
            setAvatarUrl(profile.photoUrl);
            setAvatarPreview(undefined);
            setSelectedAvatarFile(null);
        } catch {
            message.error('Không thể tải thông tin hồ sơ!');
        } finally {
            setLoading(false);
        }
    }, [form]);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    useEffect(() => {
        return () => {
            if (avatarPreview) {
                URL.revokeObjectURL(avatarPreview);
            }
        };
    }, [avatarPreview]);

    const notifyProfileChanged = () => {
        window.dispatchEvent(new Event('profile:updated'));
    };

    const onFinish = async (values: UserProfileDto) => {
        try {
            setSaving(true);


            let updatedProfile = await updateProfile(values);

            if (selectedAvatarFile) {
                updatedProfile = await uploadProfileAvatar(selectedAvatarFile);
            }

            form.setFieldsValue(updatedProfile);
            setAvatarUrl(updatedProfile.photoUrl);
            setAvatarPreview(undefined);
            setSelectedAvatarFile(null);
            notifyProfileChanged();

            message.success('Cập nhật hồ sơ thành công!');
        } catch (error) {
            console.error('Update profile error:', error);
            message.error('Cập nhật thất bại!');
        } finally {
            setSaving(false);
        }
    };

    const handleSelectAvatar = (file: File) => {
        if (avatarPreview) {
            URL.revokeObjectURL(avatarPreview);
        }

        setSelectedAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));

        return false;
    };

    const handleDeleteAvatar = async () => {
        try {
            setSaving(true);

            if (selectedAvatarFile || avatarPreview) {
                setSelectedAvatarFile(null);
                setAvatarPreview(undefined);

                if (!avatarUrl) {
                    message.success('Đã xóa ảnh vừa chọn!');
                    return;
                }
            }

            const updatedProfile = await deleteProfileAvatar();

            form.setFieldsValue(updatedProfile);
            setAvatarUrl(updatedProfile.photoUrl);
            notifyProfileChanged();

            message.success('Đã xóa ảnh đại diện!');
        } catch (error) {
            console.error('Delete avatar error:', error);
            message.error('Xóa ảnh đại diện thất bại!');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div style={{ maxWidth: 600, margin: '50px auto' }}>
            <Card>
                <Title level={3}>Hồ sơ người dùng</Title>

                <Space direction="vertical" align="center" style={{ width: '100%', marginBottom: 24 }}>
                    <Avatar
                        size={96}
                        src={avatarPreview || avatarUrl}
                        icon={<UserOutlined />}
                    />

                    <Space>
                        <Upload
                            showUploadList={false}
                            accept="image/*"
                            beforeUpload={handleSelectAvatar}
                        >
                            <Button icon={<UploadOutlined />}>
                                Chọn ảnh đại diện
                            </Button>
                        </Upload>

                        {(avatarPreview || avatarUrl) && (
                            <Button
                                danger
                                icon={<DeleteOutlined />}
                                onClick={handleDeleteAvatar}
                                loading={saving}
                            >
                                Xóa ảnh
                            </Button>
                        )}
                    </Space>
                </Space>

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
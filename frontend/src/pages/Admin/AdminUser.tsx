import { useEffect, useState } from 'react';
import { Table, Button, Typography, message, Modal, Space, Tag, Spin, Form, Input, Select } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { getAllUsers, deleteUser, createUser, updateUser } from '../../api/userAPI';
import type { Gender, UserProfileDto } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { TableProps } from 'antd';

const { Title } = Typography;

type UserFormValues = {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    gender?: Gender;
    dob?: string;
    photoUrl?: string;
    roles: string[];
};

const roleOptions = [
    { value: 'CUSTOMER', label: 'Khách hàng' },
    { value: 'ADMIN', label: 'Admin' },
];

const genderOptions = [
    { value: 'MALE', label: 'Nam' },
    { value: 'FEMALE', label: 'Nữ' },
    { value: 'OTHER', label: 'Khác' },
];

function getPrimaryRole(user: UserProfileDto) {
    if (user.roles?.includes('ADMIN')) return 'ADMIN';
    return user.roles?.[0] || 'CUSTOMER';
}

export default function AdminUsers() {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<UserProfileDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfileDto | null>(null);
    const [form] = Form.useForm<UserFormValues>();

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Load users error:', error);
            message.error('Tải người dùng thất bại');
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        form.resetFields();
        form.setFieldsValue({ roles: ['CUSTOMER'] });
        setModalVisible(true);
    };

    const openEditModal = (user: UserProfileDto) => {
        setEditingUser(user);
        form.setFieldsValue({
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            phoneNumber: user.phoneNumber,
            gender: user.gender,
            dob: user.dob,
            photoUrl: user.photoUrl,
            roles: user.roles?.length ? user.roles : ['CUSTOMER'],
        });
        setModalVisible(true);
    };

    const handleSubmit = async (values: UserFormValues) => {
        try {
            setSaving(true);
            if (editingUser?.userId) {
                await updateUser(editingUser.userId, {
                    email: editingUser.email,
                    firstName: values.firstName,
                    lastName: values.lastName,
                    phoneNumber: values.phoneNumber,
                    gender: values.gender,
                    dob: values.dob,
                    photoUrl: values.photoUrl,
                    roles: values.roles,
                });
                message.success('Cập nhật người dùng thành công');
            } else {
                await createUser({
                    email: values.email,
                    password: values.password || '',
                    firstName: values.firstName,
                    lastName: values.lastName,
                    phoneNumber: values.phoneNumber,
                    roles: values.roles,
                });
                message.success('Thêm người dùng thành công');
            }

            setModalVisible(false);
            setEditingUser(null);
            form.resetFields();
            await load();
        } catch (error) {
            console.error('Save user error:', error);
            message.error(editingUser ? 'Cập nhật thất bại' : 'Thêm người dùng thất bại');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = (user: UserProfileDto) => {
        if (!user.userId) return;

        Modal.confirm({
            title: 'Xác nhận xóa người dùng?',
            content: 'Hành động này không thể hoàn tác!',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteUser(user.userId!);
                    message.success('Đã xóa');
                    await load();
                } catch (error) {
                    console.error('Delete error:', error);
                    message.error('Xóa thất bại');
                }
            }
        });
    };

    const columns: TableProps<UserProfileDto>['columns'] = [
        {
            title: 'ID',
            dataIndex: 'userId',
            key: 'userId',
            width: 80,
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            ellipsis: true,
        },
        {
            title: 'Họ tên',
            key: 'fullName',
            render: (_, record) =>
                `${record.firstName || ''} ${record.lastName || ''}`.trim() || '-',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            width: 140,
        },
        {
            title: 'Giới tính',
            dataIndex: 'gender',
            key: 'gender',
            width: 110,
            render: (gender?: Gender) =>
                genderOptions.find(option => option.value === gender)?.label || '-',
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'dob',
            key: 'dob',
            width: 120,
            render: (dob?: string) => dob ? dayjs(dob).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Vai trò',
            key: 'roles',
            width: 140,
            render: (_, record) => {
                const role = getPrimaryRole(record);
                return (
                    <Tag color={role === 'ADMIN' ? 'red' : 'blue'}>
                        {role === 'ADMIN' ? 'Admin' : 'Khách hàng'}
                    </Tag>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            fixed: 'right',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => openEditModal(record)}
                    />
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDelete(record)}
                        disabled={record.roles?.includes('ADMIN')}
                    />
                </Space>
            )
        }
    ];

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (loading) {
        return <Spin style={{ display: 'block', margin: '100px auto' }} />;
    }

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Quản lý người dùng</Title>

            <div style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={openCreateModal}
                >
                    Thêm người dùng
                </Button>
            </div>

            <Table
                rowKey="userId"
                columns={columns}
                dataSource={users}
                loading={loading}
                pagination={{
                    pageSize: 10,
                    showTotal: (total) => `Tổng ${total} người dùng`,
                }}
                scroll={{ x: 1200 }}
            />

            <Modal
                open={modalVisible}
                title={editingUser ? 'Sửa người dùng' : 'Thêm người dùng'}
                onCancel={() => {
                    setModalVisible(false);
                    setEditingUser(null);
                    form.resetFields();
                }}
                onOk={() => form.submit()}
                okText={editingUser ? 'Cập nhật' : 'Thêm'}
                cancelText="Hủy"
                confirmLoading={saving}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}
                    >
                        <Input disabled={!!editingUser} />
                    </Form.Item>

                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label="Mật khẩu"
                            rules={[{ required: true, min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }]}
                        >
                            <Input.Password />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="firstName"
                        label="Tên"
                        rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="lastName"
                        label="Họ"
                        rules={[{ required: true, message: 'Vui lòng nhập họ' }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="phoneNumber"
                        label="Số điện thoại"
                        rules={[
                            { required: true, message: 'Vui lòng nhập số điện thoại' },
                            { pattern: /^[0-9]{10}$/, message: 'Số điện thoại không hợp lệ' },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item name="gender" label="Giới tính">
                        <Select allowClear options={genderOptions} />
                    </Form.Item>

                    <Form.Item name="dob" label="Ngày sinh">
                        <Input type="date" />
                    </Form.Item>

                    <Form.Item name="photoUrl" label="Ảnh đại diện">
                        <Input />
                    </Form.Item>

                    <Form.Item
                        name="roles"
                        label="Vai trò"
                        rules={[{ type: 'array', required: true, min: 1, message: 'Vui lòng chọn vai trò' }]}
                    >
                        <Select mode="multiple" options={roleOptions} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

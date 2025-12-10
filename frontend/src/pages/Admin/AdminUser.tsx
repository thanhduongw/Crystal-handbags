import { useEffect, useState } from 'react';
import { Table, Button, Typography, message, Modal, Space, Tag, Spin } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { getAllUsers, deleteUser } from '../../api/userAPI';
import type { UserProfileDto } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function AdminUsers() {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<UserProfileDto[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleDelete = (userId: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa người dùng?',
            content: 'Hành động này không thể hoàn tác!',
            okText: 'Xóa',
            cancelText: 'Hủy',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await deleteUser(userId);
                    message.success('Đã xóa');
                    load();
                } catch (error) {
                    console.error('Delete error:', error);
                    message.error('Xóa thất bại');
                }
            }
        });
    };

    const columns = [
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
            render: (_: any, record: UserProfileDto) =>
                `${record.firstName || ''} ${record.lastName || ''}`.trim() || '-',
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phoneNumber',
            key: 'phoneNumber',
            width: 130,
        },
        {
            title: 'Giới tính',
            dataIndex: 'gender',
            key: 'gender',
            width: 100,
            render: (gender: string) => {
                const genderMap: Record<string, string> = {
                    MALE: 'Nam',
                    FEMALE: 'Nữ',
                    OTHER: 'Khác',
                };
                return genderMap[gender] || '-';
            },
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'dob',
            key: 'dob',
            width: 120,
            render: (dob: string) => dob ? dayjs(dob).format('DD/MM/YYYY') : '-',
        },
        {
            title: 'Vai trò',
            dataIndex: 'role',
            key: 'role',
            width: 120,
            render: (role: string) => {
                const isAdminUser = role === 'ADMIN';
                return (
                    <Tag color={isAdminUser ? 'red' : 'blue'}>
                        {isAdminUser ? 'Admin' : 'Khách hàng'}
                    </Tag>
                );
            },
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            fixed: 'right' as const,
            render: (_: any, record: UserProfileDto) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        onClick={() => message.info('Chức năng đang phát triển')}
                        disabled
                    />
                    <Button
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => record.userId && handleDelete(record.userId)}
                        disabled={record.role === 'ADMIN'}
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
                    onClick={() => message.info('Chức năng đang phát triển')}
                    disabled
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
        </div>
    );
}
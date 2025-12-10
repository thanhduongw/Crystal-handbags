import { useEffect, useState } from 'react';
import { Table, Button, Typography, message, Modal, Space } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { getAllUsers, deleteUser, createUser, updateUser } from '../../api/userAPI';
import type { UserProfileDto, UserCreateRequest } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const { Title } = Typography;

export default function AdminUsers() {
    const { isAdmin } = useAuth();
    const [users, setUsers] = useState<UserProfileDto[]>([]);
    const [loading, setLoading] = useState(true);

    if (!isAdmin) return <Navigate to="/" replace />;

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers();
            setUsers(data);
        } catch (e) {
            console.error(e);
            message.error('Tải người dùng thất bại');
        } finally { setLoading(false); }
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xoá người dùng?',
            async onOk() {
                try {
                    await deleteUser(id);
                    message.success('Đã xoá');
                    load();
                } catch {
                    message.error('Xoá thất bại');
                }
            }
        });
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id' },
        { title: 'Tên đăng nhập', dataIndex: 'username', key: 'username' },
        { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
        {
            title: 'Thao tác', key: 'action',
            render: (_: any, r: UserProfileDto) => (
                <Space>
                    <Button icon={<EditOutlined />} />
                    {/* <Button danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.)} /> */}
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Quản lý người dùng</Title>
            <Table rowKey="id" columns={columns} dataSource={users} loading={loading} pagination={{ pageSize: 10 }} />
        </div>
    );
}

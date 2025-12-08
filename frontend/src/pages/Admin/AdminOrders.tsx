import { useEffect, useState } from 'react';
import { Table, Tag, Spin, Typography, Select, message } from 'antd';
import type { OrderListDto, OrderStatus } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../api/orderAPI';

const { Title } = Typography;

const statusOptions = [
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'SHIPPED', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã huỷ' },
];

export default function AdminOrders() {
    const { isAdmin } = useAuth();
    const [orders, setOrders] = useState<OrderListDto[]>([]);
    const [loading, setLoading] = useState(true);

    if (!isAdmin) return <Navigate to="/" replace />;

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await fetchAdminOrders();
            setOrders(data);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId: number, status: OrderStatus) => {
        try {
            await updateAdminOrderStatus(orderId, status);
            message.success('Cập nhật trạng thái thành công!');
            loadOrders();
        } catch (error) {
            message.error('Cập nhật thất bại!');
        }
    };

    const columns = [
        { title: 'Mã đơn', dataIndex: 'orderId', key: 'orderId' },
        {
            title: 'Ngày đặt',
            dataIndex: 'orderDate',
            key: 'orderDate',
            render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (s: OrderStatus) => <Tag color={statusOptions.find(o => o.value === s)?.label.includes('Huỷ') ? 'red' : 'blue'}>{statusOptions.find(o => o.value === s)?.label}</Tag>,
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            render: (v: number) => <b>{v.toLocaleString()} đ</b>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, r: OrderListDto) => (
                <Select
                    value={r.status}
                    onChange={(value) => handleStatusChange(r.orderId, value as OrderStatus)}
                    style={{ width: 150 }}
                >
                    {statusOptions.map((opt) => (
                        <Select.Option key={opt.value} value={opt.value}>
                            {opt.label}
                        </Select.Option>
                    ))}
                </Select>
            ),
        },
    ];

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Quản lý đơn hàng</Title>
            <Table rowKey="orderId" columns={columns} dataSource={orders} pagination={{ pageSize: 10 }} />
        </div>
    );
}
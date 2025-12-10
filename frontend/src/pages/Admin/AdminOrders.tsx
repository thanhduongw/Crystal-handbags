import { useEffect, useState } from 'react';
import { Table, Select, Tag, Typography, Spin, message } from 'antd';
import type { OrderListDto, OrderStatus } from '../../types';
import dayjs from 'dayjs';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../api/orderAPI';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const { Title } = Typography;
const statusOptions = [
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'SHIPPED', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã huỷ' },
] as const;

const statusColorMap: Record<OrderStatus, string> = {
    PENDING: 'orange',
    CONFIRMED: 'blue',
    SHIPPED: 'purple',
    DELIVERED: 'green',
    CANCELLED: 'red',
};

export default function AdminOrders() {
    const { isAdmin } = useAuth();
    const [orders, setOrders] = useState<OrderListDto[]>([]);
    const [loading, setLoading] = useState(true);

    if (!isAdmin) return <Navigate to="/" replace />;

    useEffect(() => { load(); }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await fetchAdminOrders();
            setOrders(data);
        } catch (e) {
            console.error(e);
            message.error('Tải đơn hàng thất bại');
        } finally { setLoading(false); }
    };

    const handleStatusChange = async (orderId: number, status: OrderStatus) => {
        try {
            await updateAdminOrderStatus(orderId, status);
            message.success('Cập nhật trạng thái');
            load();
        } catch (e) {
            console.error(e);
            message.error('Cập nhật thất bại');
        }
    };

    const columns = [
        { title: 'Mã đơn', dataIndex: 'orderId', key: 'orderId' },
        { title: 'Ngày đặt', dataIndex: 'orderDate', key: 'orderDate', render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm') },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status',
            render: (s: OrderStatus) => <Tag color={statusColorMap[s]}>{statusOptions.find(o => o.value === s)?.label}</Tag>
        },
        { title: 'Tổng tiền', dataIndex: 'totalAmount', key: 'totalAmount', render: (v: number) => `${v?.toLocaleString()} đ` },
        {
            title: 'Thao tác', key: 'action',
            render: (_: any, r: OrderListDto) => (
                <Select value={r.status} onChange={(val) => handleStatusChange(r.orderId, val as OrderStatus)} style={{ width: 160 }}>
                    {statusOptions.map((o) => <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>)}
                </Select>
            )
        }
    ];

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    return (
        <div style={{ padding: 24 }}>
            <Title level={3}>Quản lý đơn hàng</Title>
            <Table rowKey="orderId" columns={columns} dataSource={orders} pagination={{ pageSize: 10 }} />
        </div>
    );
}

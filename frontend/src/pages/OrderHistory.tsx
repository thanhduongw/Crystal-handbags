import { useEffect, useState } from 'react';
import { Table, Tag, Button, Spin, Typography, Empty, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { fetchOrders } from '../api/orderAPI';
import type { OrderListDto, OrderStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

const statusColor: Record<OrderStatus, string> = {
    PENDING: 'orange',
    CONFIRMED: 'blue',
    SHIPPED: 'cyan',
    DELIVERED: 'green',
    CANCELLED: 'red',
};

const statusText: Record<OrderStatus, string> = {
    PENDING: 'Chờ xác nhận',
    CONFIRMED: 'Đã xác nhận',
    SHIPPED: 'Đang giao',
    DELIVERED: 'Hoàn thành',
    CANCELLED: 'Đã huỷ',
};

export default function OrderHistory() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [orders, setOrders] = useState<OrderListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<OrderStatus | undefined>();

    useEffect(() => {
        if (user) loadOrders();
    }, [user, status]);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await fetchOrders(status);
            setOrders(data);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setLoading(false);
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
            render: (s: OrderStatus) => <Tag color={statusColor[s]}>{statusText[s]}</Tag>,
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            align: 'right' as const,
            render: (v: number) => <b>{v.toLocaleString()} đ</b>,
        },
        {
            title: '',
            key: 'action',
            render: (_: any, r: OrderListDto) => (
                <Button size="small" onClick={() => navigate(`/orders/${r.orderId}`)}>
                    Chi tiết
                </Button>
            ),
        },
    ];

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    if (orders.length === 0) {
        return (
            <div style={{ maxWidth: 800, margin: '50px auto', textAlign: 'center' }}>
                <Empty description="Chưa có đơn hàng nào" />
            </div>
        );
    }

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
            <Title level={3}>Lịch sử đơn hàng</Title>
            <Select
                allowClear
                placeholder="Lọc theo trạng thái"
                style={{ width: 220, marginBottom: 16 }}
                onChange={(v) => setStatus(v)}
                options={Object.entries(statusText).map(([value, label]) => ({ value, label }))}
            />
            <Table rowKey="orderId" columns={columns} dataSource={orders} pagination={false} />
        </div>
    );
}
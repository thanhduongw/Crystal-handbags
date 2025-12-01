import { useEffect, useState } from 'react';
import { Table, Tag, Button, Spin, Typography, Empty, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { fetchOrders } from '../api/orderAPI';
import type { OrderListDto, OrderStatus } from '../types';

const { Title } = Typography;

const statusColor: Record<OrderStatus, string> = {
    PENDING: 'orange',
    CONFIRMED: 'blue',
    SHIPPED: 'cyan',
    DELIVERED: 'green',
    CANCELLED: 'red',
};

export default function OrderHistory() {
    const nav = useNavigate();
    const [orders, setOrders] = useState<OrderListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<OrderStatus | undefined>();


    useEffect(() => {
        setLoading(true);
        fetchOrders(status)
            .then(setOrders)
            .finally(() => setLoading(false));
    }, [status]);


    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'orderId',
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'orderDate',
            render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            render: (s: OrderStatus) => (
                <Tag color={statusColor[s]}>{s}</Tag>
            ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            align: 'right' as const,
            render: (v: number) => <b>{v.toLocaleString()} đ</b>,
        },
        {
            title: '',
            render: (_: any, r: OrderListDto) => (
                <Button size="small" onClick={() => nav(`/orders/${r.orderId}`)}>
                    Chi tiết
                </Button>
            ),
        },
    ];

    if (loading) return <Spin style={{ marginTop: 80 }} />;

    if (orders.length === 0) {
        return <Empty description="Chưa có đơn hàng nào" />;
    }

    return (
        <>
            <Title level={3}>Lịch sử đơn hàng</Title>
            <Select
                allowClear
                placeholder="Lọc theo trạng thái"
                style={{ width: 220, marginBottom: 16 }}
                onChange={(v) => setStatus(v)}
                options={[
                    { value: 'PENDING', label: 'Chờ xác nhận' },
                    { value: 'CONFIRMED', label: 'Đã xác nhận' },
                    { value: 'SHIPPED', label: 'Đang giao' },
                    { value: 'DELIVERED', label: 'Hoàn thành' },
                    { value: 'CANCELLED', label: 'Đã huỷ' },
                ]}
            />

            <Table
                rowKey="orderId"
                columns={columns}
                dataSource={orders}
                pagination={false}
            />
        </>
    );
}

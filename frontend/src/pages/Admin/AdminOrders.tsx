import { useEffect, useState } from 'react';
import { Table, Select, Tag, Typography, Spin, message, Button, Space } from 'antd';
import { EyeOutlined } from '@ant-design/icons';
import type { OrderListDto, OrderStatus } from '../../types';
import dayjs from 'dayjs';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../api/orderAPI';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';

const { Title } = Typography;

const statusOptions = [
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'SHIPPED', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
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
    const navigate = useNavigate();
    const [orders, setOrders] = useState<OrderListDto[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        load();
    }, []);

    const load = async () => {
        try {
            setLoading(true);
            const data = await fetchAdminOrders();
            setOrders(data);
        } catch (error) {
            console.error('Load orders error:', error);
            message.error('Tải đơn hàng thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (orderId: number, status: OrderStatus) => {
        try {
            await updateAdminOrderStatus(orderId, status);
            message.success('Cập nhật trạng thái thành công');
            load();
        } catch (error) {
            console.error('Update status error:', error);
            message.error('Cập nhật thất bại');
        }
    };

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 100,
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'orderDate',
            key: 'orderDate',
            width: 180,
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
            sorter: (a: OrderListDto, b: OrderListDto) =>
                dayjs(a.orderDate).unix() - dayjs(b.orderDate).unix(),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: OrderStatus) => (
                <Tag color={statusColorMap[status]}>
                    {statusOptions.find(o => o.value === status)?.label}
                </Tag>
            ),
            filters: statusOptions.map(s => ({ text: s.label, value: s.value })),
            onFilter: (value: any, record: OrderListDto) => record.status === value,
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 150,
            render: (amount: number) => `${amount?.toLocaleString('vi-VN')} đ`,
            sorter: (a: OrderListDto, b: OrderListDto) => a.totalAmount - b.totalAmount,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 250,
            fixed: 'right' as const,
            render: (_: any, record: OrderListDto) => (
                <Space>
                    <Select
                        value={record.status}
                        onChange={(val) => handleStatusChange(record.orderId, val as OrderStatus)}
                        style={{ width: 140 }}
                        disabled={record.status === 'CANCELLED' || record.status === 'DELIVERED'}
                    >
                        {statusOptions.map((option) => (
                            <Select.Option key={option.value} value={option.value}>
                                {option.label}
                            </Select.Option>
                        ))}
                    </Select>
                    <Button
                        icon={<EyeOutlined />}
                        onClick={() => navigate(`/admin/orders/${record.orderId}`)}
                    >
                        Chi tiết
                    </Button>
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
            <Title level={3}>Quản lý đơn hàng</Title>
            <Table
                rowKey="orderId"
                columns={columns}
                dataSource={orders}
                pagination={{
                    pageSize: 10,
                    showTotal: (total) => `Tổng ${total} đơn hàng`,
                }}
                scroll={{ x: 1000 }}
            />
        </div>
    );
}
// pages/OrderDetail.tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    Card, Table, Tag, Button, Spin, Typography, message, Modal, Space, Divider
} from 'antd';
import dayjs from 'dayjs';
import { fetchOrderDetail, cancelOrder } from '../api/orderAPI';
import type { OrderDetailDto, OrderItemDto, OrderStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;
const { confirm } = Modal;

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

export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [order, setOrder] = useState<OrderDetailDto | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) load();
    }, [id]);

    const load = async () => {
        try {
            setLoading(true);
            const data = await fetchOrderDetail(Number(id));

            if (!user || data.userId !== user.userId) {
                message.error('Không có quyền truy cập');
                navigate('/orders');
                return;
            }

            setOrder(data);
        } catch {
            message.error('Không tìm thấy đơn hàng');
            navigate('/orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (!order) return;
        confirm({
            title: 'Huỷ đơn hàng?',
            content: 'Bạn không thể hoàn tác sau khi huỷ.',
            okType: 'danger',
            async onOk() {
                await cancelOrder(order.orderId);
                message.success('Đã huỷ đơn hàng');
                setOrder({ ...order, status: 'CANCELLED' });
            },
        });
    };

    if (loading) return <Spin style={{ margin: '100px auto', display: 'block' }} />;
    if (!order) return null;

    const columns = [
        {
            title: 'Sản phẩm',
            dataIndex: 'productName',
        },
        {
            title: 'Màu',
            dataIndex: 'color',
            render: (c: string | null) => c || '—',
        },
        {
            title: 'SL',
            dataIndex: 'quantity',
            align: 'center' as const,
        },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            render: (v: number) => `${v.toLocaleString()} ₫`,
        },
        {
            title: 'Thành tiền',
            render: (_: any, r: OrderItemDto) =>
                `${(r.price * r.quantity).toLocaleString()} ₫`,
        },
    ];

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: 24 }}>
            <Button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
                ← Quay lại
            </Button>

            <Card
                title={<Title level={4}>Đơn hàng #{order.orderId}</Title>}
                extra={
                    order.status === 'PENDING' && (
                        <Button danger onClick={handleCancel}>
                            Huỷ đơn
                        </Button>
                    )
                }
            >
                <Space direction="vertical" size="small">
                    <Tag color={statusColor[order.status]}>
                        {statusText[order.status]}
                    </Tag>

                    <Text>
                        <b>Ngày đặt:</b>{' '}
                        {dayjs(order.orderDate).format('DD/MM/YYYY HH:mm')}
                    </Text>

                    <Text><b>Người nhận:</b> {order.receiver}</Text>
                    <Text><b>Địa chỉ:</b> {order.address}</Text>
                    <Text><b>Phí ship:</b> {order.shippingFee.toLocaleString()} ₫</Text>
                </Space>

                <Divider />

                <Table
                    rowKey="itemId"
                    columns={columns}
                    dataSource={order.items}
                    pagination={false}
                />

                <Divider />

                <Title level={5} style={{ textAlign: 'right', color: '#ff4d4f' }}>
                    Tổng cộng:{' '}
                    {(order.totalAmount + order.shippingFee).toLocaleString()} ₫
                </Title>
            </Card>
        </div>
    );
}

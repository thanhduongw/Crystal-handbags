import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Spin, Typography, message, Modal } from 'antd';
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
        if (id) loadOrder();
    }, [id]);

    const loadOrder = async () => {
        try {
            setLoading(true);
            const data = await fetchOrderDetail(Number(id));
            if (!user || data.userId !== user.userId) {
                message.error('Bạn không có quyền xem đơn hàng này!');
                navigate('/orders');
                return;
            }
            setOrder(data);
        } catch (error) {
            message.error('Không tìm thấy đơn hàng!');
            navigate('/orders');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        if (!order) return;
        confirm({
            title: 'Xác nhận huỷ đơn hàng?',
            content: 'Bạn không thể hoàn tác sau khi huỷ.',
            okText: 'Huỷ đơn',
            okType: 'danger',
            cancelText: 'Đóng',
            async onOk() {
                try {
                    await cancelOrder(order.orderId);
                    message.success('Đã huỷ đơn hàng');
                    setOrder({ ...order, status: 'CANCELLED' });
                } catch {
                    message.error('Không thể huỷ đơn!');
                }
            },
        });
    };

    if (loading) return <Spin style={{ display: 'block', margin: '100px auto' }} />;

    if (!order) return null;

    const canCancel = order.status === 'PENDING';

    const columns = [
        { title: 'Sản phẩm', dataIndex: 'productName', key: 'productName' },
        { title: 'Màu', dataIndex: 'color', key: 'color' },
        { title: 'SL', dataIndex: 'quantity', key: 'quantity' },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            key: 'price',
            render: (v: number) => `${v.toLocaleString()} đ`,
        },
        {
            title: 'Thành tiền',
            key: 'total',
            render: (_: any, r: OrderItemDto) => `${(r.price * r.quantity).toLocaleString()} đ`,
        },
    ];

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px' }}>
            <Button onClick={() => navigate(-1)} style={{ marginBottom: 16 }}>
                ← Quay lại
            </Button>

            <Card
                title={<Title level={4}>Đơn hàng #{order.orderId}</Title>}
                extra={
                    canCancel && (
                        <Button danger onClick={handleCancel}>
                            Huỷ đơn
                        </Button>
                    )
                }
            >
                <p>
                    <Text strong>Trạng thái:</Text>{' '}
                    <Tag color={statusColor[order.status]}>{statusText[order.status]}</Tag>
                </p>
                <p>
                    <Text strong>Ngày đặt:</Text> {dayjs(order.orderDate).format('DD/MM/YYYY HH:mm')}
                </p>
                <p>
                    <Text strong>Người nhận:</Text> {order.receiver || 'N/A'}
                </p>
                <p>
                    <Text strong>Địa chỉ:</Text> {order.address}
                </p>
                <p>
                    <Text strong>Phí ship:</Text> {order.shippingFee.toLocaleString()} đ
                </p>
                <p>
                    <Text strong>Tổng cộng:</Text>{' '}
                    <Text type="danger">{(order.totalAmount + order.shippingFee).toLocaleString()} đ</Text>
                </p>

                <Table
                    rowKey="itemId"
                    columns={columns}
                    dataSource={order.items}
                    pagination={false}
                    style={{ marginTop: 24 }}
                />
            </Card>
        </div>
    );
}
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
    Card,
    Table,
    Tag,
    Button,
    Spin,
    Typography,
    message,
    Modal,
    Alert
} from 'antd';
import dayjs from 'dayjs';

import { fetchOrderDetail, cancelOrder } from '../api/orderAPI';
import type { OrderDetailDto, OrderItemDto, OrderStatus } from '../types';

const { Title, Text } = Typography;
const { confirm } = Modal;

/* ======================= STATUS COLOR ======================= */
const statusColor: Record<OrderStatus, string> = {
    PENDING: 'orange',
    CONFIRMED: 'blue',
    SHIPPED: 'cyan',
    DELIVERED: 'green',
    CANCELLED: 'red',
};

export default function OrderDetail() {
    const { id } = useParams<{ id: string }>();
    const nav = useNavigate();

    const [order, setOrder] = useState<OrderDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>();

    /* ======================= LOAD DETAIL ======================= */
    useEffect(() => {
        if (!id) return;

        setLoading(true);
        fetchOrderDetail(Number(id))
            .then(setOrder)
            .catch(() => setError('Không tìm thấy đơn hàng'))
            .finally(() => setLoading(false));
    }, [id]);

    /* ======================= CANCEL ======================= */
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
                    message.error('Không thể huỷ đơn');
                }
            }
        });
    };

    if (loading) return <Spin style={{ marginTop: 80 }} />;

    if (error) return <Alert type="error" message={error} />;

    if (!order) return null;

    const canCancel = order.status === 'PENDING';

    /* ======================= ITEMS TABLE ======================= */
    const itemCols = [
        { title: 'Sản phẩm', dataIndex: 'productName' },
        { title: 'Màu', dataIndex: 'color' },
        { title: 'Size', dataIndex: 'size' },
        { title: 'SL', dataIndex: 'quantity' },
        {
            title: 'Đơn giá',
            dataIndex: 'price',
            render: (v: number) => `${v.toLocaleString()} đ`
        },
        {
            title: 'Thành tiền',
            render: (_: any, r: OrderItemDto) =>
                `${(r.price * r.quantity).toLocaleString()} đ`
        }
    ];

    return (
        <>
            <Button onClick={() => nav(-1)} style={{ marginBottom: 16 }}>
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
                    <Tag color={statusColor[order.status]}>
                        {order.status}
                    </Tag>
                </p>

                <p>
                    <Text strong>Ngày đặt:</Text>{' '}
                    {dayjs(order.orderDate).format('DD/MM/YYYY HH:mm')}
                </p>

                <p><Text strong>Người nhận:</Text> {order.receiver}</p>
                <p><Text strong>Địa chỉ:</Text> {order.address}</p>
                <p><Text strong>Phí ship:</Text> {order.shippingFee.toLocaleString()} đ</p>

                <p>
                    <Text strong>Tổng cộng:</Text>{' '}
                    <Text type="danger">
                        {(order.totalAmount + order.shippingFee).toLocaleString()} đ
                    </Text>
                </p>

                <Table
                    rowKey="itemId"
                    columns={itemCols}
                    dataSource={order.items}
                    pagination={false}
                    style={{ marginTop: 24 }}
                />
            </Card>
        </>
    );
}

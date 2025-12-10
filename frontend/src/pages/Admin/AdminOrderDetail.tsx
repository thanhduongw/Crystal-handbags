import { useEffect, useState, useCallback } from 'react';
import {
    Card, Descriptions, Table, Tag, Typography, Spin, Button, Space,
    message, Select, Modal, Row, Col, Divider
} from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { fetchAdminOrderDetail, updateAdminOrderStatus } from '../../api/orderAPI';
import { getUserById } from '../../api/userAPI';
import { fetchProductDetail } from '../../api/productAPI';
import type {
    OrderDetailDto,
    OrderStatus,
    OrderItemDto,
    UserProfileDto
} from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusOptions = [
    { value: 'PENDING', label: 'Chờ xác nhận', color: 'orange' },
    { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'blue' },
    { value: 'SHIPPED', label: 'Đang giao', color: 'purple' },
    { value: 'DELIVERED', label: 'Hoàn thành', color: 'green' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'red' },
];

type ItemWithAvatar = OrderItemDto & { avatar?: string };

interface Props {
    orderId: number;
    onLoaded?: () => void;
}

export default function AdminOrderDetail({ orderId, onLoaded }: Props) {
    const [order, setOrder] = useState<OrderDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfileDto | null>(null);
    const [items, setItems] = useState<ItemWithAvatar[]>([]);

    const loadOrder = useCallback(async () => {
        try {
            setLoading(true);
            // dùng API admin
            const data = await fetchAdminOrderDetail(orderId);
            setOrder(data);

            if (data.userId) {
                try {
                    setUserProfile(await getUserById(data.userId));
                } catch {
                    setUserProfile(null);
                }
            }

            const result = await Promise.all(
                data.items.map(async (i) => {
                    try {
                        const p = await fetchProductDetail(i.itemId);
                        return { ...i, avatar: p.avatar ?? p.images?.[0] };
                    } catch {
                        return i;
                    }
                })
            );

            setItems(result);
        } catch (err: any) {
            // xử lý rõ ràng khi backend trả 403/404
            if (err?.response?.status === 403) {
                message.error('Bạn không có quyền xem đơn hàng này.');
            } else if (err?.response?.status === 404) {
                message.error('Không tìm thấy đơn hàng.');
            } else {
                message.error('Không tải được đơn hàng');
            }
            setOrder(null);
        } finally {
            setLoading(false);
            onLoaded?.();
        }
    }, [orderId]);


    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    const handleChangeStatus = (status: OrderStatus) => {
        if (!order) return;

        Modal.confirm({
            title: 'Xác nhận đổi trạng thái',
            content: `Chuyển sang "${statusOptions.find(s => s.value === status)?.label}"?`,
            onOk: async () => {
                try {
                    setUpdating(true);
                    await updateAdminOrderStatus(order.orderId, status);
                    message.success('Cập nhật thành công');
                    await loadOrder();
                } finally {
                    setUpdating(false);
                }
            }
        });
    };

    if (loading) return <Spin />;

    if (!order) return null;

    const statusInfo = statusOptions.find(s => s.value === order.status);

    return (
        <>
            <Row justify="space-between" align="middle">
                <Col>
                    <Title level={4}>Đơn hàng #{order.orderId}</Title>
                    <Text type="secondary">
                        {dayjs(order.orderDate).format('DD/MM/YYYY HH:mm')}
                    </Text>
                </Col>
                <Col>
                    <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
                        In hóa đơn
                    </Button>
                </Col>
            </Row>

            <Divider />

            <Space orientation="vertical" style={{ width: '100%' }}>
                <Tag color={statusInfo?.color}>{statusInfo?.label}</Tag>

                {order.status !== 'DELIVERED' &&
                    order.status !== 'CANCELLED' && (
                        <Select
                            style={{ width: 220 }}
                            value={order.status}
                            onChange={handleChangeStatus}
                            loading={updating}
                        >
                            {statusOptions.map(s => (
                                <Select.Option key={s.value} value={s.value}>
                                    {s.label}
                                </Select.Option>
                            ))}
                        </Select>
                    )}
            </Space>

            <Divider />

            <Row gutter={16}>
                <Col span={12}>
                    <Card title="Khách hàng" size="small">
                        <Descriptions column={1} size="small">
                            <Descriptions.Item label="Họ tên">
                                {userProfile
                                    ? `${userProfile.firstName} ${userProfile.lastName}`
                                    : order.receiver}
                            </Descriptions.Item>
                            <Descriptions.Item label="Email">
                                {userProfile?.email ?? '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="SĐT">
                                {userProfile?.phoneNumber ?? '—'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                </Col>

                <Col span={12}>
                    <Card title="Giao hàng" size="small">
                        <Text>{order.address ?? 'Chưa có địa chỉ'}</Text>
                    </Card>
                </Col>
            </Row>

            <Divider />

            <Table
                rowKey="itemId"
                pagination={false}
                dataSource={items}
                columns={[
                    {
                        title: 'Sản phẩm',
                        render: (_, r) => (
                            <Space>
                                {r.avatar ? (
                                    <img
                                        src={r.avatar}
                                        width={50}
                                        height={50}
                                        style={{ objectFit: 'cover', borderRadius: 6 }}
                                        alt={r.productName}
                                        onError={(e) => {
                                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: 50, height: 50, borderRadius: 6,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: '#f5f5f5', color: '#999', fontSize: 12
                                    }}>
                                        No image
                                    </div>
                                )}
                                <div>
                                    <div>{r.productName}</div>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        Màu: {r.color || 'Không có'}
                                    </Text>
                                </div>
                            </Space>
                        )
                    }
                    ,
                    {
                        title: 'Đơn giá',
                        render: (_, r) =>
                            `${r.price.toLocaleString('vi-VN')} ₫`
                    },
                    { title: 'SL', dataIndex: 'quantity', align: 'center' },
                    {
                        title: 'Thành tiền',
                        render: (_, r) =>
                            `${(r.price * r.quantity).toLocaleString('vi-VN')} ₫`
                    }
                ]}
            />

            <Divider />

            <Title level={5} style={{ textAlign: 'right', color: '#ff4d4f' }}>
                Tổng cộng: {order.totalAmount.toLocaleString('vi-VN')} ₫
            </Title>
        </>
    );
}

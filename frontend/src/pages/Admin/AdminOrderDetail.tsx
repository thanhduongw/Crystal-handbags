import { useEffect, useState, useCallback } from 'react';
import {
    Card, Descriptions, Table, Tag, Typography, Spin, Button, Space,
    message, Select, Modal, Row, Col, Divider
} from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import { fetchAdminOrderDetail, updateAdminOrderStatus } from '../../api/orderAPI';
import { getUserById } from '../../api/userAPI';
import type {
    OrderDetailDto,
    OrderStatus,
    OrderItemDto,
    UserProfileDto
} from '../../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusOptions = [
    { value: 'PENDING', label: 'Chờ xác nhận', color: 'gold' },
    { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'blue' },
    { value: 'SHIPPED', label: 'Đang giao', color: 'purple' },
    { value: 'DELIVERED', label: 'Hoàn thành', color: 'green' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'red' },
] as const;

type ItemWithAvatar = OrderItemDto & { avatar?: string };

interface Props {
    orderId: number;
    onLoaded?: () => void;
}

type ApiError = {
    response?: {
        status?: number;
    };
};

const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    });

export default function AdminOrderDetail({ orderId, onLoaded }: Props) {
    const [order, setOrder] = useState<OrderDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfileDto | null>(null);
    const [items, setItems] = useState<ItemWithAvatar[]>([]);

    const loadOrder = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchAdminOrderDetail(orderId);
            setOrder(data);

            if (data.userId) {
                try {
                    setUserProfile(await getUserById(data.userId));
                } catch {
                    setUserProfile(null);
                }
            }

            setItems(data.items);
        } catch (err: unknown) {
            const status = (err as ApiError).response?.status;
            if (status === 403) {
                message.error('Bạn không có quyền xem đơn hàng này.');
            } else if (status === 404) {
                message.error('Không tìm thấy đơn hàng.');
            } else {
                message.error('Không tải được đơn hàng');
            }
            setOrder(null);
        } finally {
            setLoading(false);
            onLoaded?.();
        }
    }, [orderId, onLoaded]);

    useEffect(() => {
        void loadOrder();
    }, [loadOrder]);

    const handleChangeStatus = (status: OrderStatus) => {
        if (!order) return;

        Modal.confirm({
            title: 'Xác nhận đổi trạng thái',
            content: `Chuyển sang "${statusOptions.find(s => s.value === status)?.label}"?`,
            okText: 'Cập nhật',
            cancelText: 'Hủy',
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
    const canChangeStatus = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    return (
        <div>
            <Row justify="space-between" align="middle" gutter={[16, 16]}>
                <Col>
                    <Title level={4} style={{ margin: 0 }}>Đơn hàng #{order.orderId}</Title>
                    <Text type="secondary">{dayjs(order.orderDate).format('DD/MM/YYYY HH:mm')}</Text>
                </Col>
                <Col>
                    <Space>
                        <Tag className="admin-tag" color={statusInfo?.color}>{statusInfo?.label}</Tag>
                        {canChangeStatus && (
                            <Select
                                style={{ width: 190 }}
                                value={order.status}
                                onChange={handleChangeStatus}
                                loading={updating}
                                options={statusOptions.map(status => ({
                                    value: status.value,
                                    label: status.label,
                                }))}
                            />
                        )}
                        <Button icon={<PrinterOutlined />} onClick={() => window.print()}>
                            In hóa đơn
                        </Button>
                    </Space>
                </Col>
            </Row>

            <Divider />

            <div className="admin-detail-grid">
                <Card className="admin-panel" title="Khách hàng" size="small">
                    <Descriptions column={1} size="small">
                        <Descriptions.Item label="Họ tên">
                            {userProfile
                                ? `${userProfile.firstName} ${userProfile.lastName}`
                                : order.receiver}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                            {userProfile?.email ?? '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="SĐT">
                            {userProfile?.phoneNumber ?? '-'}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                <Card className="admin-panel" title="Giao hàng" size="small">
                    <Descriptions column={1} size="small">
                        <Descriptions.Item label="Người nhận">{order.receiver || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">{order.address || '-'}</Descriptions.Item>
                    </Descriptions>
                </Card>
            </div>

            <Divider />

            <Card className="admin-table-card" title="Sản phẩm trong đơn">
                <Table
                    rowKey={(record) => `${record.itemId}-${record.productName}`}
                    pagination={false}
                    dataSource={items}
                    columns={[
                        {
                            title: 'Sản phẩm',
                            render: (_, record) => (
                                <div className="admin-entity-cell">
                                    {record.avatar ? (
                                        <img
                                            src={record.avatar}
                                            className="admin-entity-image"
                                            alt={record.productName}
                                            onError={(event) => {
                                                (event.currentTarget as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="admin-empty-thumb">No image</div>
                                    )}
                                    <div>
                                        <div className="admin-entity-title">{record.productName}</div>
                                        <div className="admin-entity-meta">Màu: {record.color || 'Không có'}</div>
                                    </div>
                                </div>
                            )
                        },
                        {
                            title: 'Đơn giá',
                            align: 'right',
                            render: (_, record) => <span className="admin-money">{formatCurrency(record.price)}</span>
                        },
                        { title: 'SL', dataIndex: 'quantity', align: 'center', width: 80 },
                        {
                            title: 'Thành tiền',
                            align: 'right',
                            render: (_, record) => (
                                <span className="admin-money">{formatCurrency(record.price * record.quantity)}</span>
                            )
                        }
                    ]}
                />
            </Card>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Card className="admin-panel" style={{ minWidth: 320 }}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Row justify="space-between">
                            <Text type="secondary">Tạm tính</Text>
                            <Text>{formatCurrency(subtotal)}</Text>
                        </Row>
                        <Row justify="space-between">
                            <Text type="secondary">Phí giao hàng</Text>
                            <Text>{formatCurrency(order.shippingFee || 0)}</Text>
                        </Row>
                        <Divider style={{ margin: '6px 0' }} />
                        <Row justify="space-between" align="middle">
                            <Text strong>Tổng cộng</Text>
                            <Title level={4} style={{ margin: 0 }}>{formatCurrency(order.totalAmount)}</Title>
                        </Row>
                    </Space>
                </Card>
            </div>
        </div>
    );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    Descriptions,
    Divider,
    Image,
    Input,
    message,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Steps,
    Table,
    Tag,
    Typography,
} from 'antd';
import { PrinterOutlined, SaveOutlined, UserOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { fetchAdminOrderDetail, updateAdminOrderStatus } from '../../api/orderAPI';
import { getUserById } from '../../api/userAPI';
import type {
    OrderDetailDto,
    OrderItemDto,
    OrderStatus,
    UserProfileDto,
} from '../../types';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusOptions: Array<{ value: OrderStatus; label: string; color: string }> = [
    { value: 'PENDING', label: 'Chờ xác nhận', color: 'gold' },
    { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'blue' },
    { value: 'SHIPPED', label: 'Đang giao', color: 'purple' },
    { value: 'DELIVERED', label: 'Hoàn thành', color: 'green' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'red' },
];

const stepStatuses: OrderStatus[] = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];

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

const getStatusOption = (status: OrderStatus) =>
    statusOptions.find(option => option.value === status) ?? statusOptions[0];

const getFullName = (user: UserProfileDto) =>
    `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

export default function AdminOrderDetail({ orderId, onLoaded }: Props) {
    const [order, setOrder] = useState<OrderDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [userProfile, setUserProfile] = useState<UserProfileDto | null>(null);
    const [items, setItems] = useState<OrderItemDto[]>([]);
    const [internalNote, setInternalNote] = useState('');

    const noteKey = `admin-order-note-${orderId}`;

    const loadOrder = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchAdminOrderDetail(orderId);
            setOrder(data);
            setItems(data.items);
            setInternalNote(window.localStorage.getItem(`admin-order-note-${orderId}`) || '');

            if (data.userId) {
                try {
                    setUserProfile(await getUserById(data.userId));
                } catch {
                    setUserProfile(null);
                }
            }
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

    const subtotal = useMemo(
        () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [items]
    );

    const discount = useMemo(
        () => Math.max(0, subtotal + (order?.shippingFee || 0) - (order?.totalAmount || 0)),
        [order?.shippingFee, order?.totalAmount, subtotal]
    );

    const handleChangeStatus = (status: OrderStatus) => {
        if (!order) return;

        Modal.confirm({
            title: 'Xác nhận đổi trạng thái',
            content: `Chuyển sang "${getStatusOption(status).label}"?`,
            okText: 'Cập nhật',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    setUpdating(true);
                    await updateAdminOrderStatus(order.orderId, status);
                    message.success('Cập nhật thành công');
                    await loadOrder();
                } catch (error) {
                    console.error('Update order status error:', error);
                    message.error('Cập nhật thất bại');
                } finally {
                    setUpdating(false);
                }
            },
        });
    };

    const handleSaveNote = () => {
        window.localStorage.setItem(noteKey, internalNote);
        message.success('Da luu ghi chu noi bo tren thiet bi nay');
    };

    const itemColumns: ColumnsType<OrderItemDto> = [
        {
            title: 'Sản phẩm',
            render: (_, record) => (
                <div className="admin-entity-cell">
                    {record.avatar ? (
                        <Image
                            src={record.avatar}
                            width={56}
                            height={56}
                            className="admin-entity-image"
                            alt={record.productName}
                            fallback="https://placehold.co/80x80?text=Error"
                        />
                    ) : (
                        <div className="admin-empty-thumb">No image</div>
                    )}
                    <div>
                        <div className="admin-entity-title">{record.productName}</div>
                        <div className="admin-entity-meta">SKU: PRD-{record.productId}-ITEM-{record.itemId}</div>
                        <div className="admin-entity-meta">Màu: {record.color || 'Khong co'}</div>
                    </div>
                </div>
            ),
        },
        {
            title: 'Don gia',
            align: 'right',
            width: 130,
            render: (_, record) => <span className="admin-money">{formatCurrency(record.price)}</span>,
        },
        { title: 'SL', dataIndex: 'quantity', align: 'center', width: 80 },
        {
            title: 'Thanh tien',
            align: 'right',
            width: 150,
            render: (_, record) => (
                <span className="admin-money">{formatCurrency(record.price * record.quantity)}</span>
            ),
        },
    ];

    if (loading) {
        return <Spin />;
    }

    if (!order) {
        return null;
    }

    const statusInfo = getStatusOption(order.status);
    const canChangeStatus = order.status !== 'DELIVERED' && order.status !== 'CANCELLED';
    const currentStep = Math.max(0, stepStatuses.findIndex(status => status === order.status));

    return (
        <div>
            <Row justify="space-between" align="middle" gutter={[16, 16]}>
                <Col>
                    <Space direction="vertical" size={4}>
                        <Title level={4} style={{ margin: 0 }}>Đơn hàng #{order.orderId}</Title>
                        <Text type="secondary">{dayjs(order.orderDate).format('DD/MM/YYYY HH:mm')}</Text>
                    </Space>
                </Col>
                <Col>
                    <Space wrap>
                        <Tag className="admin-tag admin-status-highlight" color={statusInfo.color}>{statusInfo.label}</Tag>
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

            <Card className="admin-panel admin-timeline-card">
                {order.status === 'CANCELLED' ? (
                    <Alert showIcon type="error" message="Đơn hàng đã bị hủy" />
                ) : (
                    <Steps
                        current={currentStep}
                        items={stepStatuses.map(status => ({
                            title: getStatusOption(status).label,
                        }))}
                    />
                )}
            </Card>

            <div className="admin-detail-grid">
                <Card className="admin-panel" title="Khách hàng" size="small">
                    <Descriptions column={1} size="small">
                        <Descriptions.Item label="Họ tên">
                            {userProfile ? getFullName(userProfile) : order.receiver}
                        </Descriptions.Item>
                        <Descriptions.Item label="Email">
                            {userProfile?.email ?? '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="SĐT">
                            {userProfile?.phoneNumber ?? '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ho so">
                            {order.userId ? (
                                <Link to={`/admin/users?userId=${order.userId}`}>
                                    <UserOutlined /> Xem khách hàng #{order.userId}
                                </Link>
                            ) : (
                                <span className="admin-muted">Chưa có dữ liệu</span>
                            )}
                        </Descriptions.Item>
                    </Descriptions>
                </Card>

                <Card className="admin-panel" title="Giao hàng" size="small">
                    <Descriptions column={1} size="small">
                        <Descriptions.Item label="Người nhận">{order.receiver || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">{order.address || '-'}</Descriptions.Item>
                        <Descriptions.Item label="Thống kê đơn">
                            <span className="admin-muted">Chưa có dữ liệu thống kê</span>
                        </Descriptions.Item>
                    </Descriptions>
                </Card>
            </div>

            <Divider />

            <Card className="admin-table-card" title="Sản phẩm trong đơn">
                <Table
                    rowKey={(record) => `${record.itemId}-${record.productName}`}
                    pagination={false}
                    dataSource={items}
                    columns={itemColumns}
                    scroll={{ x: 720 }}
                />
            </Card>

            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
                <Col xs={24} lg={14}>
                    <Card className="admin-panel" title="Ghi chú nội bộ" size="small">
                        <Space direction="vertical" size={10} style={{ width: '100%' }}>
                            <TextArea
                                rows={5}
                                value={internalNote}
                                onChange={(event) => setInternalNote(event.target.value)}
                                placeholder="Ghi chú xử lý đơn hàng..."
                            />
                            <Button icon={<SaveOutlined />} onClick={handleSaveNote}>
                                Lưu ghi chú
                            </Button>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card className="admin-panel admin-payment-summary" title="Thanh toan" size="small">
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Row justify="space-between">
                                <Text type="secondary">Tam tinh</Text>
                                <Text>{formatCurrency(subtotal)}</Text>
                            </Row>
                            <Row justify="space-between">
                                <Text type="secondary">Phi ship</Text>
                                <Text>{formatCurrency(order.shippingFee || 0)}</Text>
                            </Row>
                            <Row justify="space-between">
                                <Text type="secondary">Giam gia</Text>
                                <Text>{discount > 0 ? `-${formatCurrency(discount)}` : '--'}</Text>
                            </Row>
                            <Divider style={{ margin: '6px 0' }} />
                            <Row justify="space-between" align="middle">
                                <Text strong>Tong cong</Text>
                                <Title level={4} style={{ margin: 0 }}>{formatCurrency(order.totalAmount)}</Title>
                            </Row>
                            <Tag className="admin-tag" color={order.status === 'DELIVERED' ? 'green' : 'default'}>
                                {order.status === 'DELIVERED' ? 'Da thanh toan' : 'Chua thanh toan'}
                            </Tag>
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

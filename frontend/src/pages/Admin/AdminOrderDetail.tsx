import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Button,
    Card,
    Col,
    Divider,
    Image,
    message,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Table,
    Tag,
    Typography,
} from 'antd';
import { PrinterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { fetchAdminOrderDetail, updateAdminOrderStatus } from '../../api/orderAPI';
import type {
    OrderDetailDto,
    OrderItemDto,
    OrderStatus,
} from '../../types';

const { Title, Text } = Typography;

const statusOptions: Array<{ value: OrderStatus; label: string; color: string }> = [
    { value: 'PENDING', label: 'Chờ xác nhận', color: 'gold' },
    { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'blue' },
    { value: 'SHIPPED', label: 'Đang giao', color: 'purple' },
    { value: 'DELIVERED', label: 'Hoàn thành', color: 'green' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'red' },
];

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

const escapeHtml = (value: string | number | undefined | null) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

export default function AdminOrderDetail({ orderId, onLoaded }: Props) {
    const [order, setOrder] = useState<OrderDetailDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [items, setItems] = useState<OrderItemDto[]>([]);

    const loadOrder = useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchAdminOrderDetail(orderId);
            setOrder(data);
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

    const handlePrintInvoice = () => {
        if (!order) return;

        const statusInfo = getStatusOption(order.status);
        const itemRows = items.map((item, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <strong>${escapeHtml(item.productName)}</strong>
                    ${item.color ? `<div class="muted">Màu: ${escapeHtml(item.color)}</div>` : ''}
                </td>
                <td class="center">${item.quantity}</td>
                <td class="right">${escapeHtml(formatCurrency(item.price))}</td>
                <td class="right">${escapeHtml(formatCurrency(item.price * item.quantity))}</td>
            </tr>
        `).join('');

        const invoiceHtml = `
            <!doctype html>
            <html lang="vi">
            <head>
                <meta charset="utf-8" />
                <title>Hóa đơn #${escapeHtml(order.orderId)}</title>
                <style>
                    * { box-sizing: border-box; }
                    body { margin: 0; padding: 32px; color: #111827; font-family: Arial, sans-serif; font-size: 14px; }
                    h1, h2, p { margin: 0; }
                    .invoice { max-width: 820px; margin: 0 auto; }
                    .header { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111827; padding-bottom: 18px; }
                    .brand { font-size: 24px; font-weight: 700; color: #1677ff; }
                    .title { text-align: right; }
                    .title h1 { font-size: 24px; }
                    .muted { color: #6b7280; font-size: 12px; margin-top: 4px; }
                    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 22px 0; }
                    .box { border: 1px solid #d1d5db; padding: 14px; border-radius: 6px; }
                    .box h2 { margin-bottom: 10px; font-size: 15px; }
                    .line { display: flex; justify-content: space-between; gap: 12px; margin-top: 8px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
                    th, td { border: 1px solid #d1d5db; padding: 10px; vertical-align: top; }
                    th { background: #f3f4f6; text-align: left; }
                    .center { text-align: center; }
                    .right { text-align: right; }
                    .summary { width: 320px; margin: 18px 0 0 auto; }
                    .total { border-top: 2px solid #111827; padding-top: 10px; font-size: 18px; font-weight: 700; }
                    @media print {
                        body { padding: 0; }
                        .invoice { max-width: none; }
                    }
                </style>
            </head>
            <body>
                <main class="invoice">
                    <section class="header">
                        <div>
                            <div class="brand">Crystal Handbags</div>
                            <div class="muted">Cảm ơn quý khách đã mua hàng</div>
                        </div>
                        <div class="title">
                            <h1>Hóa đơn bán hàng</h1>
                            <div class="muted">Mã đơn: #${escapeHtml(order.orderId)}</div>
                            <div class="muted">Ngày đặt: ${escapeHtml(dayjs(order.orderDate).format('DD/MM/YYYY HH:mm'))}</div>
                        </div>
                    </section>

                    <section class="grid">
                        <div class="box">
                            <h2>Người nhận</h2>
                            <p>${escapeHtml(order.receiver || '-')}</p>
                            <p class="muted">${escapeHtml(order.address || '-')}</p>
                        </div>
                        <div class="box">
                            <h2>Đơn hàng</h2>
                            <div class="line"><span>Trạng thái</span><strong>${escapeHtml(statusInfo.label)}</strong></div>
                            <div class="line"><span>Số sản phẩm</span><strong>${items.length}</strong></div>
                        </div>
                    </section>

                    <table>
                        <thead>
                            <tr>
                                <th style="width: 48px;">STT</th>
                                <th>Sản phẩm</th>
                                <th class="center" style="width: 80px;">SL</th>
                                <th class="right" style="width: 140px;">Đơn giá</th>
                                <th class="right" style="width: 150px;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>${itemRows}</tbody>
                    </table>

                    <section class="summary">
                        <div class="line"><span>Tạm tính</span><span>${escapeHtml(formatCurrency(subtotal))}</span></div>
                        <div class="line"><span>Phí giao hàng</span><span>${escapeHtml(formatCurrency(order.shippingFee || 0))}</span></div>
                        ${discount > 0 ? `<div class="line"><span>Giảm giá</span><span>-${escapeHtml(formatCurrency(discount))}</span></div>` : ''}
                        <div class="line total"><span>Tổng cộng</span><span>${escapeHtml(formatCurrency(order.totalAmount))}</span></div>
                    </section>
                </main>
                <script>
                    window.addEventListener('load', function () {
                        window.print();
                    });
                </script>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank', 'width=900,height=700');
        if (!printWindow) {
            message.error('Trình duyệt đang chặn cửa sổ in.');
            return;
        }

        printWindow.document.open();
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
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
                        <div className="admin-empty-thumb">Ảnh</div>
                    )}
                    <div>
                        <div className="admin-entity-title">{record.productName}</div>
                        {record.color && <div className="admin-entity-meta">Màu: {record.color}</div>}
                    </div>
                </div>
            ),
        },
        {
            title: 'Đơn giá',
            align: 'right',
            width: 130,
            render: (_, record) => <span className="admin-money">{formatCurrency(record.price)}</span>,
        },
        { title: 'SL', dataIndex: 'quantity', align: 'center', width: 80 },
        {
            title: 'Thành tiền',
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
                        <Button icon={<PrinterOutlined />} onClick={handlePrintInvoice}>
                            In hóa đơn
                        </Button>
                    </Space>
                </Col>
            </Row>

            <div className="admin-detail-grid" style={{ marginTop: 16 }}>
                <Card className="admin-panel" title="Người nhận" size="small">
                    <Space direction="vertical" size={6}>
                        <Text strong>{order.receiver || '-'}</Text>
                        <Text>{order.address || '-'}</Text>
                    </Space>
                </Card>

                <Card className="admin-panel" title="Thanh toán" size="small">
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Row justify="space-between">
                            <Text type="secondary">Tạm tính</Text>
                            <Text>{formatCurrency(subtotal)}</Text>
                        </Row>
                        <Row justify="space-between">
                            <Text type="secondary">Phí giao hàng</Text>
                            <Text>{formatCurrency(order.shippingFee || 0)}</Text>
                        </Row>
                        {discount > 0 && (
                            <Row justify="space-between">
                                <Text type="secondary">Giảm giá</Text>
                                <Text>-{formatCurrency(discount)}</Text>
                            </Row>
                        )}
                        <Divider style={{ margin: '6px 0' }} />
                        <Row justify="space-between" align="middle">
                            <Text strong>Tổng cộng</Text>
                            <Title level={4} style={{ margin: 0 }}>{formatCurrency(order.totalAmount)}</Title>
                        </Row>
                    </Space>
                </Card>
            </div>

            <Card className="admin-table-card" title="Sản phẩm trong đơn" style={{ marginTop: 16 }}>
                <Table
                    rowKey={(record) => `${record.itemId}-${record.productName}`}
                    pagination={false}
                    dataSource={items}
                    columns={itemColumns}
                    scroll={{ x: 720 }}
                />
            </Card>
        </div>
    );
}

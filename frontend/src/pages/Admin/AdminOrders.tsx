import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Key } from 'react';
import {
    Alert,
    Button,
    Card,
    Col,
    DatePicker,
    Drawer,
    Empty,
    Input,
    message,
    Row,
    Select,
    Space,
    Table,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
    DownloadOutlined,
    EyeOutlined,
    LeftOutlined,
    ReloadOutlined,
    RightOutlined,
    SearchOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import type { OrderListDto, OrderStatus } from '../../types';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../api/orderAPI';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AdminOrderDetail from './AdminOrderDetail';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const statusOptions: Array<{ value: OrderStatus; label: string; color: string }> = [
    { value: 'PENDING', label: 'Chờ xác nhận', color: 'gold' },
    { value: 'CONFIRMED', label: 'Đã xác nhận', color: 'blue' },
    { value: 'SHIPPED', label: 'Đang giao', color: 'purple' },
    { value: 'DELIVERED', label: 'Hoàn thành', color: 'green' },
    { value: 'CANCELLED', label: 'Đã hủy', color: 'red' },
];

const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    });

const escapeCsv = (value: string | number | undefined) =>
    `"${String(value ?? '').replace(/"/g, '""')}"`;

const getStatusOption = (status: OrderStatus) =>
    statusOptions.find(option => option.value === status) ?? statusOptions[0];

export default function AdminOrders() {
    const { isAdmin } = useAuth();
    const [orders, setOrders] = useState<OrderListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
    const [paymentFilter, setPaymentFilter] = useState<string | undefined>();
    const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
    const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
    const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([]);

    const load = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await fetchAdminOrders();
            setOrders([...data].sort((a, b) => dayjs(b.orderDate).valueOf() - dayjs(a.orderDate).valueOf()));
        } catch (loadError) {
            console.error('Load orders error:', loadError);
            setError('Tải đơn hàng thất bại.');
            message.error('Tải đơn hàng thất bại');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void load();
    }, [load]);

    const paymentOptions = useMemo(
        () => Array.from(new Set(orders.map(order => order.paymentMethod).filter(Boolean)))
            .map(method => ({ value: String(method), label: String(method) })),
        [orders]
    );

    const filteredOrders = useMemo(() => {
        let filtered = [...orders];

        if (searchText.trim()) {
            const search = searchText.trim().toLowerCase();
            filtered = filtered.filter(order =>
                order.orderId.toString().includes(search) ||
                (order.customerName || '').toLowerCase().includes(search) ||
                (order.customerEmail || '').toLowerCase().includes(search) ||
                (order.receiver || '').toLowerCase().includes(search)
            );
        }

        if (statusFilter) {
            filtered = filtered.filter(order => order.status === statusFilter);
        }

        if (paymentFilter) {
            filtered = filtered.filter(order => String(order.paymentMethod || '') === paymentFilter);
        }

        if (dateRange) {
            const [start, end] = dateRange;
            filtered = filtered.filter(order => {
                const orderDate = dayjs(order.orderDate);
                return orderDate.isAfter(start.startOf('day')) &&
                    orderDate.isBefore(end.endOf('day'));
            });
        }

        return filtered;
    }, [orders, searchText, statusFilter, paymentFilter, dateRange]);

    const detailIndex = useMemo(
        () => filteredOrders.findIndex(order => order.orderId === detailOrderId),
        [detailOrderId, filteredOrders]
    );

    const handleStatusChange = async (orderId: number, status: OrderStatus) => {
        try {
            await updateAdminOrderStatus(orderId, status);
            message.success('Cập nhật trạng thái thành công');
            await load();
        } catch (updateError) {
            console.error('Update status error:', updateError);
            message.error('Cập nhật thất bại');
        }
    };

    const handleClearFilters = () => {
        setSearchText('');
        setStatusFilter(undefined);
        setPaymentFilter(undefined);
        setDateRange(null);
        setSelectedRowKeys([]);
    };

    const handleExportCsv = () => {
        const selectedIds = new Set(selectedRowKeys.map(key => Number(key)));
        const source = selectedRowKeys.length > 0
            ? filteredOrders.filter(order => selectedIds.has(order.orderId))
            : filteredOrders;

        const rows = [
            ['Mã đơn hàng', 'Khách hàng', 'Email', 'Người nhận', 'Ngày đặt', 'Trạng thái', 'Phương thức thanh toán', 'Trạng thái thanh toán', 'Số lượng', 'Tổng tiền'],
            ...source.map(order => [
                order.orderId,
                order.customerName || '',
                order.customerEmail || '',
                order.receiver || '',
                dayjs(order.orderDate).format('YYYY-MM-DD HH:mm:ss'),
                getStatusOption(order.status).label,
                order.paymentMethod || '',
                order.paymentStatus || '',
                order.itemCount ?? '',
                order.totalAmount,
            ]),
        ];

        const csv = `\uFEFF${rows.map(row => row.map(escapeCsv).join(',')).join('\n')}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `orders-${dayjs().format('YYYYMMDD-HHmm')}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const stats = {
        total: orders.length,
        pending: orders.filter(order => order.status === 'PENDING').length,
        open: orders.filter(order => ['PENDING', 'CONFIRMED', 'SHIPPED'].includes(order.status)).length,
        delivered: orders.filter(order => order.status === 'DELIVERED').length,
        cancelled: orders.filter(order => order.status === 'CANCELLED').length,
        revenue: orders
            .filter(order => order.status === 'DELIVERED')
            .reduce((sum, order) => sum + order.totalAmount, 0),
    };

    const columns: ColumnsType<OrderListDto> = [
        {
            title: 'Đơn hàng',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 120,
            render: (orderId: number) => <span className="admin-entity-title">#{orderId}</span>,
            sorter: (a, b) => a.orderId - b.orderId,
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            width: 250,
            render: (_, record) => (
                <div>
                    <div className="admin-entity-title">{record.customerName || record.receiver || '-'}</div>
                    <div className="admin-entity-meta">{record.customerEmail || '-'}</div>
                </div>
            ),
        },
        {
            title: 'Người nhận',
            dataIndex: 'receiver',
            key: 'receiver',
            width: 170,
            render: (receiver?: string) => receiver || <span className="admin-muted">Chưa có</span>,
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'orderDate',
            key: 'orderDate',
            width: 170,
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
            sorter: (a, b) => dayjs(a.orderDate).unix() - dayjs(b.orderDate).unix(),
            defaultSortOrder: 'descend',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: OrderStatus) => {
                const option = getStatusOption(status);
                return <Tag className="admin-tag" color={option.color}>{option.label}</Tag>;
            },
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            width: 160,
            render: (_, record) => (
                <Space direction="vertical" size={2}>
                    <span>{record.paymentMethod || '-'}</span>
                    {record.paymentStatus && <Tag className="admin-tag">{record.paymentStatus}</Tag>}
                </Space>
            ),
        },
        {
            title: 'SL',
            dataIndex: 'itemCount',
            key: 'itemCount',
            align: 'center',
            width: 70,
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 150,
            align: 'right',
            render: (amount: number) => <span className="admin-money">{formatCurrency(amount)}</span>,
            sorter: (a, b) => a.totalAmount - b.totalAmount,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 250,
            fixed: 'right',
            align: 'right',
            render: (_, record) => (
                <Space size={8}>
                    <Select
                        value={record.status}
                        onChange={(value: OrderStatus) => handleStatusChange(record.orderId, value)}
                        style={{ width: 145 }}
                        size="small"
                        disabled={record.status === 'CANCELLED' || record.status === 'DELIVERED'}
                        options={statusOptions.map(option => ({
                            value: option.value,
                            label: option.label,
                        }))}
                    />
                    <Tooltip title="Xem chi tiết">
                        <Button
                            className="admin-icon-button"
                            icon={<EyeOutlined />}
                            onClick={() => setDetailOrderId(record.orderId)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <div className="admin-page-eyebrow">Đơn hàng</div>
                    <Title level={2} className="admin-page-title">Điều phối đơn hàng</Title>
                </div>
                <div className="admin-page-actions">
                    <Button icon={<DownloadOutlined />} onClick={handleExportCsv} disabled={filteredOrders.length === 0}>
                        Xuất CSV
                    </Button>
                    <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
                        Làm mới
                    </Button>
                </div>
            </div>

            {error && (
                <Alert
                    showIcon
                    type="error"
                    className="admin-inline-alert"
                    message={error}
                    action={<Button size="small" onClick={load}>Thử lại</Button>}
                />
            )}

            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col xs={12} sm={8} lg={4}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Tổng đơn</div>
                        <div className="admin-stat-value">{stats.total}</div>
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Chờ xác nhận</div>
                        <div className="admin-stat-value">{stats.pending}</div>
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Đang mở</div>
                        <div className="admin-stat-value">{stats.open}</div>
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Hoàn thành</div>
                        <div className="admin-stat-value">{stats.delivered}</div>
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Đã hủy</div>
                        <div className="admin-stat-value">{stats.cancelled}</div>
                    </Card>
                </Col>
                <Col xs={12} sm={8} lg={4}>
                    <Card className="admin-stat-card">
                        <div className="admin-stat-kicker">Doanh thu</div>
                        <div className="admin-stat-value admin-stat-value-small">{formatCurrency(stats.revenue)}</div>
                    </Card>
                </Col>
            </Row>

            <Card className="admin-toolbar-card">
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} lg={7}>
                        <Input
                            placeholder="Tìm mã đơn, khách hàng, email..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={4}>
                        <Select
                            placeholder="Trạng thái"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: '100%' }}
                            allowClear
                            options={statusOptions.map(option => ({
                                value: option.value,
                                label: option.label,
                            }))}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={4}>
                        <Select
                            placeholder="Thanh toán"
                            value={paymentFilter}
                            onChange={setPaymentFilter}
                            style={{ width: '100%' }}
                            allowClear
                            options={paymentOptions}
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={5}>
                        <RangePicker
                            value={dateRange}
                            onChange={(dates) => setDateRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null)}
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY"
                            placeholder={['Từ ngày', 'Đến ngày']}
                        />
                    </Col>
                    <Col xs={24} lg={4}>
                        <Space>
                            <Button onClick={handleClearFilters}>Xóa lọc</Button>
                            <span className="admin-muted">{filteredOrders.length} đơn</span>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card className="admin-table-card">
                <Table
                    rowKey="orderId"
                    columns={columns}
                    dataSource={filteredOrders}
                    loading={loading}
                    rowSelection={{
                        selectedRowKeys,
                        onChange: setSelectedRowKeys,
                    }}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} trong ${total} đơn hàng`,
                        showSizeChanger: true,
                        showQuickJumper: true,
                    }}
                    scroll={{ x: 1480 }}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có đơn hàng phù hợp" /> }}
                    rowClassName="admin-clickable-row"
                    onRow={(record) => ({
                        onDoubleClick: () => setDetailOrderId(record.orderId),
                    })}
                />
            </Card>

            <Drawer
                title={`Chi tiết đơn hàng #${detailOrderId ?? ''}`}
                open={detailOrderId !== null}
                onClose={() => setDetailOrderId(null)}
                width={860}
                destroyOnHidden
                extra={
                    <Space>
                        <Button
                            icon={<LeftOutlined />}
                            disabled={detailIndex <= 0}
                            onClick={() => setDetailOrderId(filteredOrders[detailIndex - 1]?.orderId ?? null)}
                        >
                            Trước
                        </Button>
                        <Button
                            icon={<RightOutlined />}
                            disabled={detailIndex < 0 || detailIndex >= filteredOrders.length - 1}
                            onClick={() => setDetailOrderId(filteredOrders[detailIndex + 1]?.orderId ?? null)}
                        >
                            Sau
                        </Button>
                    </Space>
                }
            >
                {detailOrderId !== null ? (
                    <AdminOrderDetail orderId={detailOrderId} />
                ) : (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chọn đơn hàng" />
                )}
            </Drawer>
        </div>
    );
}

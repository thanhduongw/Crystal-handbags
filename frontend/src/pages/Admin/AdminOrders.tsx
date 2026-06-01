import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Table, Select, Tag, Typography, Spin, message, Button, Space,
    DatePicker, Input, Card, Row, Col, Modal, Tooltip
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { EyeOutlined, ReloadOutlined, SearchOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import type { OrderListDto, OrderStatus } from '../../types';
import dayjs from 'dayjs';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../api/orderAPI';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import AdminOrderDetail from './AdminOrderDetail';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const statusOptions = [
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'SHIPPED', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Hoàn thành' },
    { value: 'CANCELLED', label: 'Đã hủy' },
] as const;

const statusColorMap: Record<OrderStatus, string> = {
    PENDING: 'gold',
    CONFIRMED: 'blue',
    SHIPPED: 'purple',
    DELIVERED: 'green',
    CANCELLED: 'red',
};

const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
    });

export default function AdminOrders() {
    const { isAdmin } = useAuth();
    const [orders, setOrders] = useState<OrderListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

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

    useEffect(() => {
        void load();
    }, []);

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

        if (dateRange) {
            const [start, end] = dateRange;
            filtered = filtered.filter(order => {
                const orderDate = dayjs(order.orderDate);
                return orderDate.isAfter(start.startOf('day')) &&
                    orderDate.isBefore(end.endOf('day'));
            });
        }

        return filtered;
    }, [orders, searchText, statusFilter, dateRange]);

    const handleStatusChange = async (orderId: number, status: OrderStatus) => {
        try {
            await updateAdminOrderStatus(orderId, status);
            message.success('Cập nhật trạng thái thành công');
            await load();
        } catch (error) {
            console.error('Update status error:', error);
            message.error('Cập nhật thất bại');
        }
    };

    const handleViewDetail = (orderId: number) => {
        setDetailOrderId(orderId);
        setDetailModalVisible(true);
        setDetailLoading(true);
    };

    const handleDetailLoaded = useCallback(() => {
        setDetailLoading(false);
    }, []);

    const handleClearFilters = () => {
        setSearchText('');
        setStatusFilter(undefined);
        setDateRange(null);
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
            render: (status: OrderStatus) => (
                <Tag className="admin-tag" color={statusColorMap[status]}>
                    {statusOptions.find(option => option.value === status)?.label}
                </Tag>
            ),
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            width: 150,
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
                        onChange={(value) => handleStatusChange(record.orderId, value as OrderStatus)}
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
                            onClick={() => handleViewDetail(record.orderId)}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ];

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (loading && orders.length === 0) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '60vh'
            }}>
                <Spin size="large" />
            </div>
        );
    }

    return (
        <div className="admin-page">
            <div className="admin-page-header">
                <div>
                    <div className="admin-page-eyebrow">Đơn hàng</div>
                    <Title level={2} className="admin-page-title">Điều phối đơn hàng</Title>
                    <p className="admin-page-subtitle">
                        Kiểm tra đơn mới, cập nhật trạng thái giao hàng và theo dõi doanh thu hoàn thành.
                    </p>
                </div>
                <div className="admin-page-actions">
                    <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
                        Làm mới
                    </Button>
                </div>
            </div>

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
                        <div className="admin-stat-value" style={{ fontSize: 18 }}>{formatCurrency(stats.revenue)}</div>
                    </Card>
                </Col>
            </Row>

            <Card className="admin-toolbar-card">
                <Row gutter={[12, 12]} align="middle">
                    <Col xs={24} lg={8}>
                        <Input
                            placeholder="Tìm mã đơn, khách hàng, email..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(event) => setSearchText(event.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} lg={5}>
                        <Select
                            placeholder="Lọc trạng thái"
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
                    <Col xs={24} sm={12} lg={6}>
                        <RangePicker
                            value={dateRange}
                            onChange={(dates) => setDateRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null)}
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY"
                            placeholder={['Từ ngày', 'Đến ngày']}
                        />
                    </Col>
                    <Col xs={24} lg={5}>
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
                    pagination={{
                        pageSize: 10,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} trong ${total} đơn hàng`,
                        showSizeChanger: true,
                        showQuickJumper: true,
                    }}
                    scroll={{ x: 1430 }}
                    locale={{ emptyText: <Space><ShoppingCartOutlined /> Không có đơn hàng phù hợp</Space> }}
                />
            </Card>

            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Chi tiết đơn hàng #{detailOrderId}</Title>}
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={1180}
                centered
                styles={{ body: { maxHeight: '78vh', overflow: 'auto' } }}
                afterOpenChange={(open) => {
                    if (!open) {
                        setDetailOrderId(null);
                        setDetailLoading(false);
                    }
                }}
            >
                {detailOrderId && (
                    <div style={{ paddingTop: 8 }}>
                        {detailLoading && (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <Spin size="large" />
                            </div>
                        )}
                        <AdminOrderDetail
                            orderId={detailOrderId}
                            onLoaded={handleDetailLoaded}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}

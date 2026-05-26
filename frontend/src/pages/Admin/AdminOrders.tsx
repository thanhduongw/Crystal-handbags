import { useEffect, useMemo, useState } from 'react';
import {
    Table, Select, Tag, Typography, Spin, message, Button, Space,
    DatePicker, Input, Card, Row, Col, Statistic, Modal
} from 'antd';
import type { TableProps } from 'antd';
import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
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
    PENDING: 'orange',
    CONFIRMED: 'blue',
    SHIPPED: 'purple',
    DELIVERED: 'green',
    CANCELLED: 'red',
};

const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
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
        load();
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

    const handleClearFilters = () => {
        setSearchText('');
        setStatusFilter(undefined);
        setDateRange(null);
    };

    const stats = {
        total: orders.length,
        pending: orders.filter(order => order.status === 'PENDING').length,
        confirmed: orders.filter(order => order.status === 'CONFIRMED').length,
        shipped: orders.filter(order => order.status === 'SHIPPED').length,
        delivered: orders.filter(order => order.status === 'DELIVERED').length,
        revenue: orders
            .filter(order => order.status === 'DELIVERED')
            .reduce((sum, order) => sum + order.totalAmount, 0),
    };

    const columns: TableProps<OrderListDto>['columns'] = [
        {
            title: 'Mã đơn',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 100,
            sorter: (a, b) => a.orderId - b.orderId,
        },
        {
            title: 'Khách hàng',
            key: 'customer',
            width: 240,
            render: (_, record) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{record.customerName || record.receiver || '-'}</div>
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>{record.customerEmail || '-'}</div>
                </div>
            ),
        },
        {
            title: 'Người nhận',
            dataIndex: 'receiver',
            key: 'receiver',
            width: 160,
            render: (receiver?: string) => receiver || '-',
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
            width: 145,
            render: (status: OrderStatus) => (
                <Tag color={statusColorMap[status]}>
                    {statusOptions.find(option => option.value === status)?.label}
                </Tag>
            ),
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            width: 135,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <span>{record.paymentMethod || '-'}</span>
                    {record.paymentStatus && <Tag>{record.paymentStatus}</Tag>}
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
            render: (amount: number) => <strong>{formatCurrency(amount)}</strong>,
            sorter: (a, b) => a.totalAmount - b.totalAmount,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 280,
            fixed: 'right',
            render: (_, record) => (
                <Space size="small">
                    <Select
                        value={record.status}
                        onChange={(value) => handleStatusChange(record.orderId, value as OrderStatus)}
                        style={{ width: 140 }}
                        size="small"
                        disabled={record.status === 'CANCELLED' || record.status === 'DELIVERED'}
                    >
                        {statusOptions.map((option) => (
                            <Select.Option key={option.value} value={option.value}>
                                {option.label}
                            </Select.Option>
                        ))}
                    </Select>
                    <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(record.orderId)}
                    >
                        Chi tiết
                    </Button>
                </Space>
            ),
        },
    ];

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    if (loading) {
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
        <div style={{ padding: 24 }}>
            <Title level={3}>Quản lý đơn hàng</Title>

            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small">
                        <Statistic title="Tổng đơn" value={stats.total} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small">
                        <Statistic title="Chờ xử lý" value={stats.pending} valueStyle={{ color: '#faad14' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small">
                        <Statistic title="Đã xác nhận" value={stats.confirmed} valueStyle={{ color: '#1890ff' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small">
                        <Statistic title="Đang giao" value={stats.shipped} valueStyle={{ color: '#722ed1' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small">
                        <Statistic title="Hoàn thành" value={stats.delivered} valueStyle={{ color: '#52c41a' }} />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small">
                        <Statistic
                            title="Doanh thu"
                            value={stats.revenue}
                            valueStyle={{ color: '#52c41a' }}
                            formatter={(value) => formatCurrency(Number(value))}
                        />
                    </Card>
                </Col>
            </Row>

            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={7}>
                        <Input
                            placeholder="Tìm mã đơn, khách hàng, email..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={5}>
                        <Select
                            placeholder="Lọc trạng thái"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: '100%' }}
                            allowClear
                        >
                            {statusOptions.map((option) => (
                                <Select.Option key={option.value} value={option.value}>
                                    {option.label}
                                </Select.Option>
                            ))}
                        </Select>
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <RangePicker
                            value={dateRange}
                            onChange={(dates) => setDateRange(dates && dates[0] && dates[1] ? [dates[0], dates[1]] : null)}
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY"
                            placeholder={['Từ ngày', 'Đến ngày']}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Space>
                            <Button onClick={handleClearFilters}>Xóa lọc</Button>
                            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
                                Làm mới
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Card>
                <Table
                    rowKey="orderId"
                    columns={columns}
                    dataSource={filteredOrders}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} trong ${total} đơn hàng`,
                        showSizeChanger: true,
                        showQuickJumper: true,
                    }}
                    scroll={{ x: 1450 }}
                />
            </Card>

            <Modal
                title={<Title level={4} style={{ margin: 0 }}>Chi tiết đơn hàng #{detailOrderId}</Title>}
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={null}
                width={1200}
                centered
                style={{ maxHeight: '80vh', overflow: 'auto' }}
                afterOpenChange={(open) => {
                    if (!open) {
                        setDetailOrderId(null);
                        setDetailLoading(false);
                    }
                }}
            >
                {detailOrderId && (
                    <div style={{ paddingTop: 16 }}>
                        {detailLoading && (
                            <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                <Spin size="large" />
                            </div>
                        )}
                        <AdminOrderDetail
                            orderId={detailOrderId}
                            onLoaded={() => setDetailLoading(false)}
                        />
                    </div>
                )}
            </Modal>
        </div>
    );
}

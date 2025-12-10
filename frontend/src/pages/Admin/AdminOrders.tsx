// pages/Admin/AdminOrders.tsx
import { useEffect, useState } from 'react';
import {
    Table, Select, Tag, Typography, Spin, message, Button, Space,
    DatePicker, Input, Card, Row, Col, Statistic, Modal
} from 'antd';
import { EyeOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { OrderListDto, OrderStatus } from '../../types';
import dayjs from 'dayjs';
import { fetchAdminOrders, updateAdminOrderStatus } from '../../api/orderAPI';
import { useAuth } from '../../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import AdminOrderDetail from './AdminOrderDetail'; // Import component chi tiết

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

export default function AdminOrders() {
    const { isAdmin } = useAuth();
    const [orders, setOrders] = useState<OrderListDto[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderListDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

    // State cho modal chi tiết
    const [detailOrderId, setDetailOrderId] = useState<number | null>(null);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);

    useEffect(() => {
        load();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [orders, searchText, statusFilter, dateRange]);

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

    const applyFilters = () => {
        let filtered = [...orders];

        if (searchText.trim()) {
            const search = searchText.toLowerCase();
            filtered = filtered.filter(o =>
                o.orderId.toString().includes(search)
            );
        }

        if (statusFilter) {
            filtered = filtered.filter(o => o.status === statusFilter);
        }

        if (dateRange) {
            const [start, end] = dateRange;
            filtered = filtered.filter(o => {
                const orderDate = dayjs(o.orderDate);
                return orderDate.isAfter(start.startOf('day')) &&
                    orderDate.isBefore(end.endOf('day'));
            });
        }

        setFilteredOrders(filtered);
    };

    const handleStatusChange = async (orderId: number, status: OrderStatus) => {
        try {
            await updateAdminOrderStatus(orderId, status);
            message.success('Cập nhật trạng thái thành công');
            load();
        } catch (error) {
            console.error('Update status error:', error);
            message.error('Cập nhật thất bại');
        }
    };

    // Sửa lại hàm này để mở modal thay vì navigate
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
        pending: orders.filter(o => o.status === 'PENDING').length,
        confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
        shipped: orders.filter(o => o.status === 'SHIPPED').length,
        delivered: orders.filter(o => o.status === 'DELIVERED').length,
        cancelled: orders.filter(o => o.status === 'CANCELLED').length,
        revenue: orders
            .filter(o => o.status === 'DELIVERED')
            .reduce((sum, o) => sum + o.totalAmount, 0),
    };

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 100,
            sorter: (a: OrderListDto, b: OrderListDto) => a.orderId - b.orderId,
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'orderDate',
            key: 'orderDate',
            width: 180,
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
            sorter: (a: OrderListDto, b: OrderListDto) =>
                dayjs(a.orderDate).unix() - dayjs(b.orderDate).unix(),
            defaultSortOrder: 'descend' as const,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 150,
            render: (status: OrderStatus) => (
                <Tag color={statusColorMap[status]}>
                    {statusOptions.find(o => o.value === status)?.label}
                </Tag>
            ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            width: 150,
            render: (amount: number) => (
                <strong>{amount?.toLocaleString('vi-VN')} ₫</strong>
            ),
            sorter: (a: OrderListDto, b: OrderListDto) => a.totalAmount - b.totalAmount,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 280,
            fixed: 'right' as const,
            render: (_: any, record: OrderListDto) => (
                <Space size="small">
                    <Select
                        value={record.status}
                        onChange={(val) => handleStatusChange(record.orderId, val as OrderStatus)}
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
            )
        }
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

            {/* Statistics */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small">
                        <Statistic
                            title="Tổng đơn"
                            value={stats.total}
                            styles={{ content: { color: '#1890ff' } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small">
                        <Statistic
                            title="Chờ xử lý"
                            value={stats.pending}
                            styles={{ content: { color: '#faad14' } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small">
                        <Statistic
                            title="Đã xác nhận"
                            value={stats.confirmed}
                            styles={{ content: { color: '#1890ff' } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small">
                        <Statistic
                            title="Đang giao"
                            value={stats.shipped}
                            styles={{ content: { color: '#722ed1' } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small">
                        <Statistic
                            title="Hoàn thành"
                            value={stats.delivered}
                            styles={{ content: { color: '#52c41a' } }}
                        />
                    </Card>
                </Col>
                <Col xs={12} sm={8} md={4}>
                    <Card size="small">
                        <Statistic
                            title="Doanh thu"
                            value={stats.revenue}
                            styles={{ content: { color: '#52c41a' } }}
                            formatter={(value) => `${Number(value).toLocaleString('vi-VN')} ₫`}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Filters */}
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            placeholder="Tìm theo mã đơn..."
                            prefix={<SearchOutlined />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            allowClear
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Select
                            placeholder="Lọc theo trạng thái"
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
                            onChange={(dates) => setDateRange(dates as any)}
                            style={{ width: '100%' }}
                            format="DD/MM/YYYY"
                            placeholder={['Từ ngày', 'Đến ngày']}
                        />
                    </Col>
                    <Col xs={24} sm={12} md={6}>
                        <Space>
                            <Button onClick={handleClearFilters}>
                                Xóa bộ lọc
                            </Button>
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={load}
                                loading={loading}
                            >
                                Làm mới
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            {/* Table */}
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
                    scroll={{ x: 1000 }}
                />
            </Card>

            {/* Modal hiển thị chi tiết đơn hàng */}
            <Modal
                title={
                    <Title level={4} style={{ margin: 0 }}>
                        Chi tiết đơn hàng #{detailOrderId}
                    </Title>
                }
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
                        {/* Loading state cho modal */}
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
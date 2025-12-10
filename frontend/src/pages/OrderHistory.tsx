import { useEffect, useState } from 'react';
import {
    Card,
    Table,
    Typography,
    Spin,
    message,
    Input,
    Select,
    DatePicker,
    Row,
    Col,
    Button,
    Tag
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { fetchOrders } from '../api/orderAPI';
import type { OrderListDto, OrderStatus } from '../types';

const { Title } = Typography;
const { RangePicker } = DatePicker;

/* ================= CONSTANT ================= */

const statusOptions = [
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'SHIPPED', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Đã giao' },
    { value: 'CANCELLED', label: 'Đã hủy' }
];

/* ================= COMPONENT ================= */

export default function OrderHistory() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<OrderListDto[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderListDto[]>([]);

    // filter state
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
    const [dateRange, setDateRange] = useState<
        [dayjs.Dayjs, dayjs.Dayjs] | null
    >(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const res = await fetchOrders();
            setOrders(res);
            setFilteredOrders(res);
        } catch (err) {
            message.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    /* ================= FILTER LOGIC ================= */

    useEffect(() => {
        applyFilters();
    }, [orders, searchText, statusFilter, dateRange]);

    const applyFilters = () => {
        let data = [...orders];

        // ✅ search theo mã đơn
        if (searchText.trim()) {
            data = data.filter(o =>
                o.orderId.toString().includes(searchText.trim())
            );
        }

        // ✅ lọc theo trạng thái
        if (statusFilter) {
            data = data.filter(o => o.status === statusFilter);
        }

        // ✅ lọc theo ngày
        if (dateRange) {
            const [start, end] = dateRange;
            data = data.filter(o => {
                const d = dayjs(o.orderDate);
                return (
                    d.isAfter(start.startOf('day')) &&
                    d.isBefore(end.endOf('day'))
                );
            });
        }

        setFilteredOrders(data);
    };

    const resetFilters = () => {
        setSearchText('');
        setStatusFilter(undefined);
        setDateRange(null);
    };

    /* ================= TABLE ================= */

    const columns = [
        {
            title: 'Mã đơn',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 120
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'orderDate',
            key: 'orderDate',
            render: (d: string) => dayjs(d).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            align: 'right' as const,
            render: (v: number) =>
                v.toLocaleString('vi-VN', {
                    style: 'currency',
                    currency: 'VND'
                })
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (s: OrderStatus) => {
                const colorMap: Record<OrderStatus, string> = {
                    PENDING: 'orange',
                    CONFIRMED: 'blue',
                    SHIPPED: 'cyan',
                    DELIVERED: 'green',
                    CANCELLED: 'red'
                };
                return <Tag color={colorMap[s]}>{s}</Tag>;
            }
        }
    ];

    /* ================= RENDER ================= */

    return (
        <Card>
            <Title level={3}>Lịch sử đơn hàng</Title>

            {/* FILTER */}
            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Tìm theo mã đơn"
                            value={searchText}
                            allowClear
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Select
                            allowClear
                            placeholder="Trạng thái"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: '100%' }}
                            options={statusOptions}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <RangePicker
                            value={dateRange}
                            onChange={(v) => setDateRange(v as any)}
                            format="DD/MM/YYYY"
                            style={{ width: '100%' }}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <Button onClick={resetFilters}>
                            Xóa bộ lọc
                        </Button>
                    </Col>
                </Row>
            </Card>

            {/* TABLE */}
            <Spin spinning={loading}>
                <Table
                    rowKey="orderId"
                    columns={columns}
                    dataSource={filteredOrders}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Chưa có đơn hàng' }}
                    onRow={(record) => ({
                        onClick: () =>
                            navigate(`/orders/${record.orderId}`)
                    })}
                />
            </Spin>
        </Card>
    );
}

import { useEffect, useMemo, useState } from 'react';
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
    Tag,
    Space
} from 'antd';
import type { TableProps } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import { fetchOrders } from '../api/orderAPI';
import type { OrderListDto, OrderStatus } from '../types';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const statusOptions = [
    { value: 'PENDING', label: 'Chờ xác nhận' },
    { value: 'CONFIRMED', label: 'Đã xác nhận' },
    { value: 'SHIPPED', label: 'Đang giao' },
    { value: 'DELIVERED', label: 'Đã giao' },
    { value: 'CANCELLED', label: 'Đã hủy' }
] as const;

const colorMap: Record<OrderStatus, string> = {
    PENDING: 'orange',
    CONFIRMED: 'blue',
    SHIPPED: 'cyan',
    DELIVERED: 'green',
    CANCELLED: 'red'
};

const formatCurrency = (value: number) =>
    Number(value || 0).toLocaleString('vi-VN', {
        style: 'currency',
        currency: 'VND',
    });

export default function OrderHistory() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [orders, setOrders] = useState<OrderListDto[]>([]);
    const [searchText, setSearchText] = useState('');
    const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>();
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);

    const loadOrders = async () => {
        try {
            setLoading(true);
            const data = await fetchOrders();
            setOrders(data);
        } catch (error) {
            console.error('Load orders error:', error);
            message.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const filteredOrders = useMemo(() => {
        let data = [...orders];

        if (searchText.trim()) {
            const search = searchText.trim().toLowerCase();
            data = data.filter(order =>
                order.orderId.toString().includes(search) ||
                (order.receiver || '').toLowerCase().includes(search)
            );
        }

        if (statusFilter) {
            data = data.filter(order => order.status === statusFilter);
        }

        if (dateRange) {
            const [start, end] = dateRange;
            data = data.filter(order => {
                const orderDate = dayjs(order.orderDate);
                return orderDate.isAfter(start.startOf('day')) &&
                    orderDate.isBefore(end.endOf('day'));
            });
        }

        return data;
    }, [orders, searchText, statusFilter, dateRange]);

    const resetFilters = () => {
        setSearchText('');
        setStatusFilter(undefined);
        setDateRange(null);
    };

    const columns: TableProps<OrderListDto>['columns'] = [
        {
            title: 'Mã đơn',
            dataIndex: 'orderId',
            key: 'orderId',
            width: 110
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'orderDate',
            key: 'orderDate',
            width: 170,
            render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm')
        },
        {
            title: 'Người nhận',
            dataIndex: 'receiver',
            key: 'receiver',
            render: (receiver?: string) => receiver || '-',
        },
        {
            title: 'Sản phẩm',
            dataIndex: 'itemCount',
            key: 'itemCount',
            align: 'center',
            width: 95,
            render: (itemCount?: number) => itemCount || 0,
        },
        {
            title: 'Thanh toán',
            key: 'payment',
            width: 135,
            render: (_, record) => (
                <Space direction="vertical" size={0}>
                    <Text>{record.paymentMethod || '-'}</Text>
                    {record.paymentStatus && <Tag>{record.paymentStatus}</Tag>}
                </Space>
            ),
        },
        {
            title: 'Tổng tiền',
            dataIndex: 'totalAmount',
            key: 'totalAmount',
            align: 'right',
            width: 150,
            render: (value: number) => formatCurrency(value)
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 145,
            render: (status: OrderStatus) => {
                const label = statusOptions.find(option => option.value === status)?.label || status;
                return <Tag color={colorMap[status]}>{label}</Tag>;
            }
        }
    ];

    return (
        <Card>
            <Title level={3}>Lịch sử đơn hàng</Title>

            <Card style={{ marginBottom: 16 }}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} sm={12} md={6}>
                        <Input
                            prefix={<SearchOutlined />}
                            placeholder="Tìm mã đơn hoặc người nhận"
                            value={searchText}
                            allowClear
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={5}>
                        <Select
                            allowClear
                            placeholder="Trạng thái"
                            value={statusFilter}
                            onChange={setStatusFilter}
                            style={{ width: '100%' }}
                            options={[...statusOptions]}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <RangePicker
                            value={dateRange}
                            onChange={(value) => setDateRange(value && value[0] && value[1] ? [value[0], value[1]] : null)}
                            format="DD/MM/YYYY"
                            style={{ width: '100%' }}
                        />
                    </Col>

                    <Col xs={24} sm={12} md={7}>
                        <Space>
                            <Button onClick={resetFilters}>Xóa lọc</Button>
                            <Button icon={<ReloadOutlined />} onClick={loadOrders} loading={loading}>
                                Làm mới
                            </Button>
                        </Space>
                    </Col>
                </Row>
            </Card>

            <Spin spinning={loading}>
                <Table
                    rowKey="orderId"
                    columns={columns}
                    dataSource={filteredOrders}
                    pagination={{ pageSize: 10 }}
                    locale={{ emptyText: 'Chưa có đơn hàng' }}
                    scroll={{ x: 1000 }}
                    onRow={(record) => ({
                        onClick: () => navigate(`/orders/${record.orderId}`),
                        style: { cursor: 'pointer' },
                    })}
                />
            </Spin>
        </Card>
    );
}

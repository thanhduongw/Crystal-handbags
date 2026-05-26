import type { OrderDetailDto, OrderListDto, OrderStatus } from '../types';
import instance from './axiosInstance';

type RawOrderListDto = Omit<OrderListDto, 'totalAmount' | 'shippingFee'> & {
    totalAmount: number | string;
    shippingFee?: number | string;
};

type RawOrderDetailDto = Omit<OrderDetailDto, 'totalAmount' | 'shippingFee' | 'items'> & {
    totalAmount: number | string;
    shippingFee: number | string;
    items: Array<Omit<OrderDetailDto['items'][number], 'price'> & { price: number | string }>;
};

const toNumber = (value: number | string | undefined) => Number(value ?? 0);

const normalizeOrderList = (order: RawOrderListDto): OrderListDto => ({
    ...order,
    totalAmount: toNumber(order.totalAmount),
    shippingFee: toNumber(order.shippingFee),
});

const normalizeOrderDetail = (order: RawOrderDetailDto): OrderDetailDto => ({
    ...order,
    totalAmount: toNumber(order.totalAmount),
    shippingFee: toNumber(order.shippingFee),
    items: order.items.map(item => ({
        ...item,
        price: toNumber(item.price),
    })),
});

// User
export const fetchOrders = (status?: OrderStatus): Promise<OrderListDto[]> =>
    instance.get<RawOrderListDto[]>('/orders', { params: status ? { status } : {} })
        .then(r => r.data.map(normalizeOrderList));

export const fetchOrderDetail = (id: number): Promise<OrderDetailDto> =>
    instance.get<RawOrderDetailDto>(`/orders/${id}`).then(r => normalizeOrderDetail(r.data));

export const cancelOrder = (id: number) =>
    instance.put(`/orders/${id}/cancel`);

// Admin
export const fetchAdminOrders = (): Promise<OrderListDto[]> =>
    instance.get<RawOrderListDto[]>('/admin/orders').then(r => r.data.map(normalizeOrderList));

export const updateAdminOrderStatus = (id: number, status: OrderStatus): Promise<OrderDetailDto> =>
    instance.put<RawOrderDetailDto>(`/admin/orders/${id}/status`, null, { params: { status } })
        .then(r => normalizeOrderDetail(r.data));

export const fetchAdminOrderDetail = (id: number): Promise<OrderDetailDto> =>
    instance.get<RawOrderDetailDto>(`/admin/orders/${id}`).then(r => normalizeOrderDetail(r.data));

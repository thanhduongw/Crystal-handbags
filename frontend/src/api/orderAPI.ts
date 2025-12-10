import type { OrderDetailDto, OrderListDto, OrderStatus } from '../types';
import instance from './axiosInstance';

// User
export const fetchOrders = (status?: OrderStatus): Promise<OrderListDto[]> =>
    instance.get('/orders', { params: status ? { status } : {} }).then(r => r.data);

export const fetchOrderDetail = (id: number): Promise<OrderDetailDto> =>
    instance.get(`/orders/${id}`).then(r => r.data);

export const cancelOrder = (id: number) =>
    instance.put(`/orders/${id}/cancel`);

// Admin
export const fetchAdminOrders = (): Promise<OrderListDto[]> =>
    instance.get('/admin/orders').then(r => r.data);

export const updateAdminOrderStatus = (id: number, status: OrderStatus): Promise<OrderDetailDto> =>
    instance.put(`/admin/orders/${id}/status`, null, { params: { status } }).then(r => r.data);

export const fetchAdminOrderDetail = (id: number): Promise<OrderDetailDto> =>
    instance.get(`/admin/orders/${id}`).then(r => r.data);
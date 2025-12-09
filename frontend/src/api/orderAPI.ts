import type { OrderDetailDto, OrderListDto } from '../types';
import instance from './axiosInstance';

// User
export const fetchOrders = (status?: string): Promise<OrderListDto[]> =>
    instance.get('/orders', { params: status ? { status } : {} }).then(r => r.data);

export const fetchOrderDetail = (id: number): Promise<OrderDetailDto> =>
    instance.get(`/orders/${id}`).then(r => r.data);

export const cancelOrder = (id: number) =>
    instance.put(`/orders/${id}/cancel`);

// Admin
export const fetchAdminOrders = (): Promise<OrderListDto[]> =>
    instance.get('/admin/orders').then(r => r.data);

export const updateAdminOrderStatus = (id: number, status: string): Promise<OrderDetailDto> =>
    instance.put(`/admin/orders/${id}/status?status=${status}`).then(r => r.data);
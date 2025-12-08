import type { OrderDetailDto, OrderListDto } from '../types';
import instance from './axiosInstance';

export const fetchOrders = (status?: string) =>
    instance.get<OrderListDto[]>('/orders', {
        params: status ? { status } : {}
    }).then(r => r.data);

export const fetchOrderDetail = (id: number) =>
    instance.get<OrderDetailDto>(`/orders/${id}`).then(r => r.data);

export const cancelOrder = (id: number) =>
    instance.put(`/orders/${id}/cancel`);

export const fetchAdminOrders = () =>
    instance.get<OrderListDto[]>('/admin/orders').then(r => r.data);

export const updateAdminOrderStatus = (id: number, status: string) =>
    instance.put(`/admin/orders/${id}/status?status=${status}`).then(r => r.data);
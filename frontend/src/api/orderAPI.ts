// src/api/orderAPI.ts
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

// src/api/sessionCartAPI.ts
import type { CartLine } from '../types';
import instance from './axiosInstance';

export const fetchCart = () =>
    instance.get<CartLine[]>('/session-cart').then((r) => r.data);

export const addItem = (dto: CartLine) =>
    instance.post('/session-cart/items', dto);

export const updateQty = (itemId: number, delta: number) =>
    instance.patch(`/session-cart/items/${itemId}?delta=${delta}`);

export const removeItem = (itemId: number) =>
    instance.delete(`/session-cart/items/${itemId}`);
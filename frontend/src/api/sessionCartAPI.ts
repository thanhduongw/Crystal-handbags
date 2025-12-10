import type { CartLineDto } from '../types';
import instance from './axiosInstance';

export const fetchCart = (): Promise<CartLineDto[]> =>
    instance.get('/session-cart').then(r => r.data);

export const addItem = (dto: CartLineDto) =>
    instance.post('/session-cart/items', dto);

export const updateQty = (itemId: number, quantity: number) =>
    instance.put(`/session-cart/items/${itemId}?quantity=${quantity}`);

export const removeItem = (itemId: number) =>
    instance.delete(`/session-cart/items/${itemId}`);

export const clearCart = () =>
    instance.delete('/session-cart');

export const mergeCart = () =>
    instance.post('/session-cart/merge').then(r => r.data);
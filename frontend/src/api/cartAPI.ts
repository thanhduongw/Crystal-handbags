import type { CartLineDto, CheckoutResponse, PaymentMethod } from '../types';
import instance from './axiosInstance';

export const getCart = (): Promise<CartLineDto[]> =>
    instance.get('/cart').then(r => r.data);

export const addItem = (dto: CartLineDto) =>
    instance.post('/cart/items', dto);

export const updateQuantity = (itemId: number, quantity: number) =>
    instance.put(`/cart/items/${itemId}?quantity=${quantity}`);

export const removeItem = (itemId: number) =>
    instance.delete(`/cart/items/${itemId}`);

export const clearCart = () =>
    instance.delete('/cart');

export const checkout = (addressId: number, paymentMethod: PaymentMethod, cartItemIds?: number[] ): Promise<CheckoutResponse> =>
    instance.post('/cart/checkout', { addressId, paymentMethod, cartItemIds }).then(r => r.data);
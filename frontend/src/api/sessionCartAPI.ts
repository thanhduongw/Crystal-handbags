import type { CartLineDto } from '../types';
import instance from './axiosInstance';

const GUEST_CART_STORAGE_KEY = 'guest_cart';

const isBrowser = typeof window !== 'undefined';

const normalizeCart = (cart: CartLineDto[]): CartLineDto[] => {
    const byItemId = new Map<number, CartLineDto>();

    cart.forEach((line) => {
        if (!line?.itemId || line.qty <= 0) return;

        const existing = byItemId.get(line.itemId);
        if (existing) {
            existing.qty += line.qty;
        } else {
            byItemId.set(line.itemId, { ...line });
        }
    });

    return [...byItemId.values()];
};

export const readLocalCart = (): CartLineDto[] => {
    if (!isBrowser) return [];

    try {
        const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
        return raw ? normalizeCart(JSON.parse(raw)) : [];
    } catch {
        return [];
    }
};

const writeLocalCart = (cart: CartLineDto[]) => {
    if (!isBrowser) return;

    const normalized = normalizeCart(cart);
    if (normalized.length === 0) {
        window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
    } else {
        window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(normalized));
    }
};

const syncSessionRequest = async (request: Promise<unknown>) => {
    try {
        await request;
    } catch (error) {
        console.warn('Session cart sync failed; using local guest cart fallback.', error);
    }
};

export const fetchCart = async (): Promise<CartLineDto[]> => {
    const localCart = readLocalCart();

    try {
        const response = await instance.get<CartLineDto[]>('/session-cart');
        const serverCart = Array.isArray(response.data) ? response.data : [];

        if (serverCart.length > 0) {
            writeLocalCart(serverCart);
            return serverCart;
        }
    } catch (error) {
        console.warn('Failed to fetch session cart; using local guest cart fallback.', error);
    }

    return localCart;
};

export const addItem = async (dto: CartLineDto) => {
    writeLocalCart([...readLocalCart(), dto]);
    await syncSessionRequest(instance.post('/session-cart/items', dto));
};

export const updateQty = async (itemId: number, quantity: number) => {
    const nextCart = quantity <= 0
        ? readLocalCart().filter((line) => line.itemId !== itemId)
        : readLocalCart().map((line) =>
            line.itemId === itemId ? { ...line, qty: quantity } : line
        );

    writeLocalCart(nextCart);
    await syncSessionRequest(instance.put(`/session-cart/items/${itemId}?quantity=${quantity}`));
};

export const removeItem = async (itemId: number) => {
    writeLocalCart(readLocalCart().filter((line) => line.itemId !== itemId));
    await syncSessionRequest(instance.delete(`/session-cart/items/${itemId}`));
};

export const clearCart = async () => {
    writeLocalCart([]);
    await syncSessionRequest(instance.delete('/session-cart'));
};

export const mergeCart = () =>
    instance.post('/session-cart/merge', readLocalCart()).then(r => r.data);

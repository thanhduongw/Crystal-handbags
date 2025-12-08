// src/hooks/useCart.ts
import { useEffect, useState } from 'react';
import {
    fetchCart,
    addItem as apiAdd,
    updateQty as apiUpd,
    removeItem as apiDel,
    clearCart as apiClear,
} from '../api/sessionCartAPI';
import type { CartLine, Product, ProductItem } from '../types';
import { useAuth } from '../contexts/AuthContext';

const GUEST_CART_KEY = 'guestCart';

export default function useCart() {
    const [lines, setLines] = useState<CartLine[]>([]);
    const { user } = useAuth();

    // Load cart từ localStorage cho guest
    const loadGuestCart = () => {
        const guestCart = localStorage.getItem(GUEST_CART_KEY);
        if (guestCart) {
            setLines(JSON.parse(guestCart));
        } else {
            setLines([]);
        }
    };

    // Save cart vào localStorage cho guest
    const saveGuestCart = (cartLines: CartLine[]) => {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cartLines));
    };

    const refresh = async () => {
        try {
            if (user) {
                // Đã đăng nhập - lấy từ server
                const data = await fetchCart();
                setLines(data);
            } else {
                // Chưa đăng nhập - lấy từ localStorage
                loadGuestCart();
            }
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        }
    };

    useEffect(() => {
        refresh();
    }, [user]);

    // Sync guest cart lên server khi login
    const syncGuestCartToServer = async () => {
        const guestCart = localStorage.getItem(GUEST_CART_KEY);
        if (!guestCart) return;

        try {
            const guestLines: CartLine[] = JSON.parse(guestCart);
            for (const line of guestLines) {
                await apiAdd(line);
            }
            localStorage.removeItem(GUEST_CART_KEY);
        } catch (error) {
            console.error('Failed to sync guest cart:', error);
        }
    };

    useEffect(() => {
        if (user) {
            syncGuestCartToServer();
        }
    }, [user]);

    const addItem = async (p: Product, selected: ProductItem, qty: number) => {
        const dto = {
            itemId: selected.itemId,
            name: p.name,
            avatar: p.avatar,
            price: selected.price,
            qty,
        };

        if (user) {
            await apiAdd(dto);
            await refresh();
        } else {
            // Guest: thêm vào localStorage
            const existingIndex = lines.findIndex(line => line.itemId === dto.itemId);
            let newLines: CartLine[];

            if (existingIndex >= 0) {
                newLines = [...lines];
                newLines[existingIndex].qty += qty;
            } else {
                newLines = [...lines, dto];
            }

            saveGuestCart(newLines);
            setLines(newLines);
        }
    };

    const updateQty = async (itemId: number, delta: number) => {
        if (user) {
            await apiUpd(itemId, delta);
            await refresh();
        } else {
            // Guest: cập nhật localStorage
            const newLines = lines.map(line =>
                line.itemId === itemId
                    ? { ...line, qty: Math.max(1, line.qty + delta) }
                    : line
            );
            saveGuestCart(newLines);
            setLines(newLines);
        }
    };

    const removeItem = async (itemId: number) => {
        if (user) {
            await apiDel(itemId);
            await refresh();
        } else {
            // Guest: xóa khỏi localStorage
            const newLines = lines.filter(line => line.itemId !== itemId);
            saveGuestCart(newLines);
            setLines(newLines);
        }
    };

    const clearCart = async () => {
        if (user) {
            await apiClear();
        } else {
            localStorage.removeItem(GUEST_CART_KEY);
        }
        setLines([]);
    };

    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

    return { lines, addItem, updateQty, removeItem, clearCart, total, refresh };
}
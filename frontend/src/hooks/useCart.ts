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

export default function useCart() {
    const [lines, setLines] = useState<CartLine[]>([]);
    const { user } = useAuth();

    const refresh = async () => {
        try {
            const data = await fetchCart();
            setLines(data);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
        }
    };

    useEffect(() => {
        refresh();
    }, [user]);

    const addItem = async (p: Product, selected: ProductItem, qty: number) => {
        const dto = {
            itemId: selected.itemId,
            name: p.name,
            avatar: p.avatar,
            price: selected.price,
            qty,
        };
        await apiAdd(dto);
        await refresh();
    };

    const updateQty = async (itemId: number, delta: number) => {
        await apiUpd(itemId, delta);
        await refresh();
    };

    const removeItem = async (itemId: number) => {
        await apiDel(itemId);
        await refresh();
    };

    const clearCart = async () => {
        await apiClear();
        await refresh();
    };

    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

    return { lines, addItem, updateQty, removeItem, clearCart, total, refresh };
}
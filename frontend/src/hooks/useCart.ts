// src/hooks/useCart.ts
import { useEffect, useState } from 'react';
import { fetchCart, addItem as apiAdd, updateQty as apiUpd, removeItem as apiDel } from '../api/sessionCartAPI';
import type { CartLine, Product, ProductItem } from '../types';

export default function useCart() {
    const [lines, setLines] = useState<CartLine[]>([]);

    const refresh = async () => {
        try {
            const data = await fetchCart();
            setLines(data);
        } catch {
            setLines([]); // nếu lỗi -> cart rỗng
        }
    };

    useEffect(() => { refresh(); }, []);

    const addItem = async (p: Product, selected: ProductItem) => {
        const dto: CartLine = {
            id: selected.itemId,
            name: p.name,
            avatar: p.avatar,
            price: selected.price,
            qty: 1,
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

    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

    return { lines, addItem, updateQty, removeItem, total };
}
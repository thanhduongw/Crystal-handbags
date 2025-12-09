import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import type { CartLineDto, ProductItemDto, ProductDetailDto } from '../types';
import { useAuth } from '../contexts/AuthContext';
import * as cartAPI from '../api/cartAPI';
import * as sessionCartAPI from '../api/sessionCartAPI';

interface UseCartReturn {
    lines: CartLineDto[];
    loading: boolean;
    total: number;
    addItem: (product: ProductDetailDto, item: ProductItemDto, quantity: number) => Promise<void>;
    updateQty: (itemId: number, quantity: number) => Promise<void>;
    removeItem: (itemId: number) => Promise<void>;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
}

export default function useCart(): UseCartReturn {
    const { user } = useAuth();
    const [lines, setLines] = useState<CartLineDto[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadCart();
    }, [user]);

    const loadCart = useCallback(async () => {
        try {
            setLoading(true);
            const data = user ? await cartAPI.getCart() : await sessionCartAPI.fetchCart();
            setLines(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load cart:', error);
            message.error('Không thể tải giỏ hàng!');
            setLines([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const total = lines.reduce((sum, item) => sum + item.price * item.qty, 0);

    const addItem = useCallback(async (product: ProductDetailDto, item: ProductItemDto, quantity: number) => {
        try {
            const dto: CartLineDto = {
                itemId: item.itemId,
                name: product.name,
                avatar: product.avatar,
                price: item.price,
                qty: quantity,
            };
            user ? await cartAPI.addItem(dto) : await sessionCartAPI.addItem(dto);
            await loadCart();
            message.success('Đã thêm vào giỏ hàng!');
        } catch (error) {
            console.error('Failed to add item:', error);
            message.error('Không thể thêm vào giỏ hàng!');
            throw error;
        }
    }, [user, loadCart]);

    const removeItem = useCallback(async (itemId: number) => {
        try {
            user ? await cartAPI.removeItem(itemId) : await sessionCartAPI.removeItem(itemId);
            await loadCart();
            message.success('Đã xóa sản phẩm khỏi giỏ hàng!');
        } catch (error) {
            console.error('Failed to remove item:', error);
            message.error('Không thể xóa sản phẩm!');
        }
    }, [user, loadCart]);

    // SỬA: Thêm optimistic update để UI phản hồi nhanh hơn
    const updateQty = useCallback(async (itemId: number, quantity: number) => {
        if (quantity < 1) {
            await removeItem(itemId);
            return;
        }

        // Optimistic update
        const previousLines = [...lines];
        setLines(prev => prev.map(line =>
            line.itemId === itemId ? { ...line, qty: quantity } : line
        ));

        try {
            user
                ? await cartAPI.updateQuantity(itemId, quantity)
                : await sessionCartAPI.updateQty(itemId, quantity);
            // Không cần load lại nếu optimistic thành công
        } catch (error) {
            // Rollback nếu fail
            setLines(previousLines);
            console.error('Failed to update quantity:', error);
            message.error('Không thể cập nhật số lượng!');
        }
    }, [user, lines]);

    const clearCart = useCallback(async () => {
        try {
            user ? await cartAPI.clearCart() : await sessionCartAPI.clearCart();
            setLines([]);
        } catch (error) {
            console.error('Failed to clear cart:', error);
            message.error('Không thể làm trống giỏ hàng!');
        }
    }, [user]);

    return { lines, loading, total, addItem, updateQty, removeItem, clearCart, refreshCart: loadCart };
}
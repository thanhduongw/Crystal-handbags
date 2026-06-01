import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import type { CartLineDto, ProductItemDto, ProductDetailDto } from '../types';
import { useAuth } from './useAuth';
import * as cartAPI from '../api/cartAPI';
import * as sessionCartAPI from '../api/sessionCartAPI';

const CART_CHANGED_EVENT = 'cart:changed';

const notifyCartChanged = () => {
    window.dispatchEvent(new Event(CART_CHANGED_EVENT));
};

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

    const loadCart = useCallback(async () => {
        try {
            setLoading(true);
            const data = user
                ? await cartAPI.getCart()
                : await sessionCartAPI.fetchCart();
            setLines(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load cart:', error);
            setLines([]);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadCart();
    }, [loadCart]);

    useEffect(() => {
        window.addEventListener(CART_CHANGED_EVENT, loadCart);
        return () => window.removeEventListener(CART_CHANGED_EVENT, loadCart);
    }, [loadCart]);

    const total = lines.reduce((sum, item) => sum + item.price * item.qty, 0);

    const addItem = useCallback(
        async (product: ProductDetailDto, item: ProductItemDto, quantity: number) => {
            try {
                if (!item.itemId) {
                    throw new Error('Product item is missing an id');
                }

                const dto: CartLineDto = {
                    itemId: item.itemId,
                    name: product.name,
                    avatar: product.avatar || '',
                    price: item.price,
                    qty: quantity,
                    color: item.color || '',
                };

                if (user) {
                    await cartAPI.addItem(dto);
                } else {
                    await sessionCartAPI.addItem(dto);
                }

                await loadCart();
                notifyCartChanged();
            } catch (error) {
                console.error('Failed to add item:', error);
                throw error;
            }
        },
        [user, loadCart]
    );

    const updateQty = useCallback(
        async (itemId: number, quantity: number) => {
            if (quantity < 1) {
                if (user) {
                    await cartAPI.removeItem(itemId);
                } else {
                    await sessionCartAPI.removeItem(itemId);
                }
                await loadCart();
                notifyCartChanged();
                return;
            }

            const previousLines = [...lines];
            setLines((prev) =>
                prev.map((line) =>
                    line.itemId === itemId ? { ...line, qty: quantity } : line
                )
            );

            try {
                if (user) {
                    await cartAPI.updateQuantity(itemId, quantity);
                } else {
                    await sessionCartAPI.updateQty(itemId, quantity);
                }
                notifyCartChanged();
            } catch (error) {
                setLines(previousLines);
                console.error('Failed to update quantity:', error);
                message.error('Không thể cập nhật số lượng!');
            }
        },
        [user, lines, loadCart]
    );

    const removeItem = useCallback(
        async (itemId: number) => {
            try {
                if (user) {
                    await cartAPI.removeItem(itemId);
                } else {
                    await sessionCartAPI.removeItem(itemId);
                }
                await loadCart();
                notifyCartChanged();
                message.success('Đã xóa sản phẩm khỏi giỏ hàng!');
            } catch (error) {
                console.error('Failed to remove item:', error);
                message.error('Không thể xóa sản phẩm!');
            }
        },
        [user, loadCart]
    );

    const clearCart = useCallback(async () => {
        try {
            if (user) {
                await cartAPI.clearCart();
            } else {
                await sessionCartAPI.clearCart();
            }
            setLines([]);
            notifyCartChanged();
        } catch (error) {
            console.error('Failed to clear cart:', error);
            message.error('Không thể làm trống giỏ hàng!');
        }
    }, [user]);

    return {
        lines,
        loading,
        total,
        addItem,
        updateQty,
        removeItem,
        clearCart,
        refreshCart: loadCart,
    };
}

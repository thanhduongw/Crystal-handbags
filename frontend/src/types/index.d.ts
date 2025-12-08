export interface Category {
    id: number;
    name: string;
    imageUrl?: string;
    description?: string;
}

export interface ProductItem {
    itemId: number;
    color: string;
    size: string;
    price: number;
    stockQuantity: number;
}

export interface Product {
    productId: number;
    name: string;
    description: string;
    basePrice: number;
    avatar: string;
    images: string[];
    categoryName: string;
    items: ProductItem[];
    showHomepage: boolean;
}

export interface CartLine {
    itemId: number;
    name: string;
    avatar: string;
    price: number;
    qty: number;
}

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface OrderListDto {
    orderId: number;
    orderDate: string;
    status: OrderStatus;
    totalAmount: number;
}

export interface OrderItemDto {
    itemId: number;
    productName: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
}

export interface OrderDetailDto {
    orderId: number;
    orderDate: string;
    status: OrderStatus;
    totalAmount: number;
    shippingFee: number;
    receiver: string;
    address: string;
    items: OrderItemDto[];
    userId: number;
}

export interface UserProfileDto {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    gender: string;
    dob?: string;
    photoUrl?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

export interface AuthUser {
    email: string;
    role: string;
    userId: number;
}
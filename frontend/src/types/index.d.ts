// ==================== ENUMS ====================
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';
export type Role = 'ROLE_CUSTOMER' | 'ROLE_ADMIN';
export type PaymentMethod = 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER';

// ==================== CATEGORY ====================
export interface CategoryDto {
    categoryId: number;
    name: string;
    imageUrl?: string;
    description?: string;
}

// ==================== PRODUCT ====================
export interface ProductItemDto {
    itemId: number;
    color: string;
    size: string;
    price: number;
    stockQuantity: number;
}

export interface ProductListDto {
    productId: number;
    name: string;
    avatar: string;
    basePrice: number;
    categoryName: string;
    showHomepage: boolean;
}

export interface ProductDetailDto {
    productId: number;
    name: string;
    description: string;
    basePrice: number;
    avatar: string;
    images: string[];
    categoryName: string;
    items: ProductItemDto[];
    showHomePage: boolean;
}

// ==================== CART ====================
export interface CartLineDto {
    itemId: number;
    name: string;
    avatar: string;
    price: number;
    qty: number;
}

export interface CartItemDto {
    itemId: number;
    productName: string;
    avatar: string;
    color: string;
    size: string;
    price: number;
    quantity: number;
}

// ==================== ORDER ====================
export interface OrderItemDto {
    itemId: number;
    productName: string;
    color: string;
    size: string;
    quantity: number;
    price: number;
}

export interface OrderListDto {
    orderId: number;
    orderDate: string; // ISO string
    status: OrderStatus;
    totalAmount: number;
}

export interface OrderDetailDto {
    orderId: number;
    orderDate: string; // ISO string
    status: OrderStatus;
    totalAmount: number;
    shippingFee: number;
    receiver: string;
    address: string;
    items: OrderItemDto[];
    userId: number;
}

// ==================== USER ====================
export interface UserProfileDto {
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    gender: Gender;
    dob?: string; // ISO date string
    photoUrl?: string;
}

export interface AuthUser {
    email: string;
    role: Role;
    userId: number;
}

// ==================== ADDRESS ====================
export interface Address {
    addressId: number;
    fullName: string;
    phoneNumber: string;
    street: string;
    ward: string;
    district: string;
    province: string;
    isDefault: boolean;
}

// ==================== AUTH ====================
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

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
}

export interface RegisterResponse {
    email: string;
    message: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface UserCreateRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

export interface UserCreateResponse {
    email: string;
}

// ==================== CHECKOUT ====================
export interface CheckoutRequest {
    addressId: number;
    paymentMethod: PaymentMethod;
    cartItemIds?: number[]; // optional nếu backend không yêu cầu
}

// ==================== TOKEN ====================
export interface TokenPayload {
    token: string;
    jwtId: string;
    expiredTime: string; // ISO date string
}

export interface JwtInfo {
    jwtId: string;
    issueTime: string;
    expiredTime: string;
}
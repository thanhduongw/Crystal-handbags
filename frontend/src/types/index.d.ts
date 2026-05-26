// ==================== ENUMS ====================
export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type PaymentMethod = "CASH" | "VNPAY";
// Role từ JWT token
export type Role = "ROLE_CUSTOMER" | "ROLE_ADMIN";

// ==================== CATEGORY ====================
export interface CategoryDto {
  categoryId: number;
  name: string;
  imageUrl?: string;
  description?: string;
}

// ==================== PRODUCT ====================
export interface ProductItemDto {
  itemId?: number;
  color: string;
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
  productId?: number;
  name: string;
  description: string;
  basePrice: number;
  avatar?: string;
  images?: string[];
  categoryId: number;
  categoryName?: string;
  items?: ProductItemDto[];
  showHomePage?: boolean;
}

// ==================== CART ====================
export interface CartLineDto {
  itemId: number;
  name: string;
  avatar: string;
  price: number;
  qty: number;
  color?: string;
}

export interface CartItemDto {
  itemId: number;
  productName: string;
  avatar: string;
  color: string;
  price: number;
  quantity: number;
}

// ==================== ORDER ====================
export interface OrderItemDto {
  itemId: number;
  productName: string;
  color: string;
  quantity: number;
  price: number;
}

export interface OrderListDto {
  orderId: number;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
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

// ==================== USER ====================
export interface UserProfileDto {
  userId?: number;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  gender: Gender;
  dob?: string;
  photoUrl?: string;
  // Role từ profile API, có thể khác với role từ JWT
  role?: "CUSTOMER" | "ADMIN";
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
  cartItemIds?: number[];
}

// ==================== TOKEN ====================
export interface TokenPayload {
  token: string;
  jwtId: string;
  expiredTime: string;
}

export interface JwtInfo {
  jwtId: string;
  issueTime: string;
  expiredTime: string;
}

//Payment
export interface CheckoutResponse {
  orderId: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  paymentUrl?: string | null;
}

// ==================== AI CHAT ====================
export type AiSender = "USER" | "AI";

export interface AiVariantDto {
  itemId: number;
  color: string;
  price: number;
  stockQuantity: number;
}

export interface AiProductCardDto {
  productId: number;
  name: string;
  avatar: string;
  price: number;
  variants?: AiVariantDto[];
}

export interface AiChatRequest {
  sessionId: string;
  message: string;
}

export interface AiChatResponse {
  sessionId: string;
  response: string;
  products?: AiProductCardDto[];
}

export interface AiMessageResponse {
  role: "USER" | "ASSISTANT";
  content: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: AiSender;
  content: string;
  createdAt: Date;
  products?: AiProductCardDto[];
  suggestions?: AiSuggestion[];
}
export interface AiSuggestion {
  label: string;
  message: string;
}

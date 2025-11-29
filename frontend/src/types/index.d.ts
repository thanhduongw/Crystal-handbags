export interface Category {
    id: number,
    name: string,
    imageUrl?: string,
    description?: string
}

export interface ProductItem {
    itemId: number,
    color: string,
    size: string,
    price: number,
    stockQuantity: number
}

export interface Product {
    productId: number
    name: string
    description: string
    basePrice: number
    avatar: string
    images: string[]
    categoryName: string
    items: ProductItem[]
}

export interface CartLine {
    id: number;
    name: string;
    avatar: string;
    price: number;
    qty: number;
}
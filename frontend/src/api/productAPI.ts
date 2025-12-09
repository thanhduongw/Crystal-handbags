import type { ProductDetailDto, ProductListDto } from "../types";
import instance from "./axiosInstance";

// Public
export const fetchProducts = (): Promise<ProductListDto[]> =>
    instance.get("/products").then(r => r.data);

export const fetchProductDetail = (id: number): Promise<ProductDetailDto> =>
    instance.get(`/products/${id}`).then(r => r.data);

export const searchProducts = (keyword: string): Promise<ProductListDto[]> =>
    instance.get(`/products/search?keyword=${encodeURIComponent(keyword)}`).then(r => r.data);

export const fetchProductsByCat = (catId: number): Promise<ProductListDto[]> =>
    instance.get(`/categories/${catId}/products`).then(r => r.data);

// Admin
export const createProduct = (product: FormData): Promise<ProductDetailDto> =>
    instance.post("/products", product).then(r => r.data);

export const updateProduct = (id: number, product: FormData): Promise<ProductDetailDto> =>
    instance.put(`/products/${id}`, product).then(r => r.data);

export const deleteProduct = (id: number) =>
    instance.delete(`/products/${id}`);

export const uploadProductImage = (id: number, image: FormData) =>
    instance.post(`/products/${id}/images`, image);

export const deleteProductImage = (id: number, imageId: string) =>
    instance.delete(`/products/${id}/images/${imageId}`);
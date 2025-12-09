import type { Product, Category } from "../types";
import instance from "./axiosInstance";

export const fetchProducts = () => {
    return instance.get<Product[]>("/products").then((r) => r.data);
};

export const fetchCategories = () => {
    return instance.get<Category[]>("/categories").then((r) => r.data);
};

export const fetchProductsByCat = (catId: number) => {
    return instance.get<Product[]>(`/categories/${catId}/products`).then(r => r.data);
};

export const fetchProductDetail = (productId: number) => {
    return instance.get<Product>(`/products/${productId}`).then((r) => r.data);
};

export const searchProducts = (keyword: string) => {
    return instance.get<Product[]>(`/products/search?keyword=${encodeURIComponent(keyword)}`).then((r) => r.data);
};

// Admin APIs
export const createProduct = (product: FormData) => {
    return instance.post("/products", product).then((r) => r.data);
};

export const updateProduct = (id: number, product: FormData) => {
    return instance.put(`/products/${id}`, product).then((r) => r.data);
};

export const deleteProduct = (id: number) => {
    return instance.delete(`/products/${id}`);
};

export const uploadProductImage = (id: number, image: FormData) => {
    return instance.post(`/products/${id}/images`, image);
};

export const deleteProductImage = (id: number, imageId: string) => {
    return instance.delete(`/products/${id}/images/${imageId}`);
};
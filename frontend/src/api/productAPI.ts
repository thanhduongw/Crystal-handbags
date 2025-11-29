import type { Product, Category } from "../types";
import instance from "./axiosInstance"

export const fetchProducts = () => {
    return instance.get<Product[]>("/products").then((r) => r.data)
}

export const fetchCategories = () => {
    return instance.get<Category[]>("/categories").then((r) => r.data);
}

export const fetchProductsByCat = (catId: number) => {
    return instance.get<Product[]>(
        `/categories/${catId}/products`
    ).then((r) => r.data);
}

export const fetchProductDetail = (productId: number) => {
    return instance.get<Product>(`/products/${productId}`).then((r) => r.data);
}
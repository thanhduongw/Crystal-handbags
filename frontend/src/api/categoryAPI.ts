import type { Category } from "../types";
import instance from "./axiosInstance";

export const fetchCategories = () => {
    return instance.get<Category[]>("/categories").then((r) => r.data);
};

export const createCategory = (category: Omit<Category, "id">) => {
    return instance.post("/categories", category).then((r) => r.data);
};

export const updateCategory = (id: number, category: Omit<Category, "id">) => {
    return instance.put(`/categories/${id}`, category).then((r) => r.data);
};

export const deleteCategory = (id: number) => {
    return instance.delete(`/categories/${id}`);
};
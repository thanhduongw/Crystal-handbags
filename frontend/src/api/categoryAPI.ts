import type { CategoryDto } from "../types";
import instance from "./axiosInstance";

// Public
export const fetchCategories = (): Promise<CategoryDto[]> =>
    instance.get("/categories").then(r => r.data);

export const fetchCategory = (id: number): Promise<CategoryDto> =>
    instance.get(`/categories/${id}`).then(r => r.data);

// Admin
export const createCategory = (category: Omit<CategoryDto, "categoryId">): Promise<CategoryDto> =>
    instance.post("/categories", category).then(r => r.data);

export const updateCategory = (id: number, category: Omit<CategoryDto, "categoryId">): Promise<CategoryDto> =>
    instance.put(`/categories/${id}`, category).then(r => r.data);

export const deleteCategory = (id: number) =>
    instance.delete(`/categories/${id}`);
export const uploadCategoryImage = (id: number, file: File): Promise<CategoryDto> => {
    const formData = new FormData();
    formData.append('image', file);

    return instance.post(`/categories/${id}/image`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }).then(r => r.data);
};

export const deleteCategoryImage = (id: number): Promise<void> =>
    instance.delete(`/categories/${id}/image`).then(() => undefined);
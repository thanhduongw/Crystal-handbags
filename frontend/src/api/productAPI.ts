import type { ProductDetailDto, ProductListDto } from '../types';
import instance from './axiosInstance';

// ===== PUBLIC =====
export const fetchProducts = (): Promise<ProductListDto[]> =>
    instance.get('/products').then(r => r.data);

export const fetchProductDetail = (id: number): Promise<ProductDetailDto> =>
    instance.get(`/products/${id}`).then(r => r.data);

export const searchProducts = (keyword: string): Promise<ProductListDto[]> =>
    instance.get('/products/search', {
        params: { keyword }
    }).then(r => r.data);

export const fetchProductsByCat = (catId: number): Promise<ProductListDto[]> =>
    instance.get(`/categories/${catId}/products`).then(r => r.data);

// ===== ADMIN =====
export const createProduct = (product: ProductDetailDto): Promise<ProductDetailDto> =>
    instance.post('/products', product).then(r => r.data);

export const updateProduct = (id: number, product: ProductDetailDto): Promise<ProductDetailDto> =>
    instance.put(`/products/${id}`, product).then(r => r.data);

export const deleteProduct = async (id: number): Promise<void> => {
    await instance.delete(`/products/${id}`);
};

export const uploadProductImage = (id: number, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    return instance.post(
        `/products/${id}/images`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    ).then(r => r.data);
};

export const deleteProductImage = async (
    id: number,
    imageUrl: string
): Promise<void> => {
    await instance.delete(`/products/${id}/images`, {
        params: { imageUrl }
    });
};

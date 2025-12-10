import instance from './axiosInstance';
import type { LoginRequest, RegisterRequest } from '../types';

export const login = async (data: LoginRequest) => {
    const response = await instance.post('/auth/login', data);
    return response.data;
};

export const register = async (data: RegisterRequest) => {
    const response = await instance.post('/auth/register', data);
    return response.data;
};

export const logout = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
        await instance.post('/auth/logout', {}, {
            headers: { Authorization: `Bearer ${token}` }
        });
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
};

export const refreshToken = async (refreshToken: string) => {
    const response = await instance.post('/auth/refresh-token', { refreshToken });
    return response.data;
};

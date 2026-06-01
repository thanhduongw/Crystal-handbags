import axios from 'axios';
import { isJwtExpired } from '../utils/authToken';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const instance = axios.create({
    baseURL: apiBaseUrl,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

const refreshInstance = axios.create({
    baseURL: apiBaseUrl,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

let refreshPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

const shouldSendCredentials = (url = '') => url.startsWith('/session-cart');

const shouldSendBearerToken = (url = '', method = 'get') => {
    const normalizedMethod = method.toLowerCase();
    const isPublicRead = normalizedMethod === 'get';

    if (url.startsWith('/auth/')) return false;
    if (url.startsWith('/session-cart/merge')) return true;
    if (url.startsWith('/session-cart')) return false;
    if (url.startsWith('/contact')) return false;
    if (isPublicRead && url.startsWith('/products')) return false;
    if (isPublicRead && url.startsWith('/categories')) return false;
    return true;
};

const clearAuthAndRedirect = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.dispatchEvent(new Event('auth:logged-out'));

    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
};

instance.interceptors.request.use(
    (config) => {
        const requestUrl = config.url ?? '';
        config.withCredentials = shouldSendCredentials(requestUrl);

        const token = localStorage.getItem('accessToken');
        if (token && shouldSendBearerToken(requestUrl, config.method) && !isJwtExpired(token, 0)) {
            config.headers.Authorization = `Bearer ${token}`;
        } else if (config.headers.Authorization) {
            delete config.headers.Authorization;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (!originalRequest) {
            return Promise.reject(error);
        }

        const requestUrl = originalRequest.url ?? '';
        if (error.response?.status === 401 && requestUrl.startsWith('/auth/')) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                if (!refreshPromise) {
                    const refreshToken = localStorage.getItem('refreshToken');
                    if (!refreshToken) throw new Error('No refresh token');

                    refreshPromise = refreshInstance
                        .post('/auth/refresh-token', { refreshToken })
                        .then((res) => {
                            const tokens = res.data;
                            localStorage.setItem('accessToken', tokens.accessToken);
                            localStorage.setItem('refreshToken', tokens.refreshToken);
                            window.dispatchEvent(
                                new CustomEvent('auth:tokens-refreshed', { detail: tokens })
                            );
                            return tokens;
                        })
                        .finally(() => {
                            refreshPromise = null;
                        });
                }

                const { accessToken } = await refreshPromise;
                originalRequest.headers = originalRequest.headers ?? {};
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return instance(originalRequest);
            } catch (e) {
                clearAuthAndRedirect();
                return Promise.reject(e);
            }
        }

        return Promise.reject(error);
    }
);

export default instance;

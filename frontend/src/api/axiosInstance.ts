import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { isJwtExpired } from '../utils/authToken';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
const CLIENT_RATE_LIMIT = {
    maxRequests: 10,
    windowMs: 1000,
};
const RETRY_CONFIG = {
    maxAttempts: 2,
    delayMs: 4000,
};

type RetryableAxiosConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
    retryCount?: number;
};

const requestTimestamps: number[] = [];

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

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const waitForClientRateLimit = async () => {
    const now = Date.now();
    const oldestAllowed = now - CLIENT_RATE_LIMIT.windowMs;

    while (requestTimestamps.length > 0 && requestTimestamps[0] <= oldestAllowed) {
        requestTimestamps.shift();
    }

    if (requestTimestamps.length >= CLIENT_RATE_LIMIT.maxRequests) {
        const waitMs = CLIENT_RATE_LIMIT.windowMs - (now - requestTimestamps[0]);
        await sleep(waitMs);
        return waitForClientRateLimit();
    }

    requestTimestamps.push(Date.now());
};

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

const isRetryableRequest = (config: RetryableAxiosConfig) => {
    const method = (config.method ?? 'get').toLowerCase();
    return ['get', 'head', 'options'].includes(method);
};

const isTemporaryFailure = (error: AxiosError) => {
    const status = error.response?.status;
    return !error.response || status === 408 || status === 429 || (status !== undefined && status >= 500);
};

instance.interceptors.request.use(
    async (config) => {
        await waitForClientRateLimit();

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
        const originalRequest = error.config as RetryableAxiosConfig | undefined;

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

        if (
            isRetryableRequest(originalRequest)
            && isTemporaryFailure(error)
            && (originalRequest.retryCount ?? 0) < RETRY_CONFIG.maxAttempts
        ) {
            originalRequest.retryCount = (originalRequest.retryCount ?? 0) + 1;
            await sleep(RETRY_CONFIG.delayMs);
            return instance(originalRequest);
        }

        return Promise.reject(error);
    }
);

export default instance;

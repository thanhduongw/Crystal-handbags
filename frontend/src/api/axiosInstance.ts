import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

const refreshInstance = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) throw new Error('No refresh token');

                const res = await refreshInstance.post(
                    '/auth/refresh-token',
                    { refreshToken }
                );

                const { accessToken, refreshToken: newRefresh } = res.data;

                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', newRefresh);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return instance(originalRequest);
            } catch (e) {
                localStorage.clear();
                window.location.href = '/login';
                return Promise.reject(e);
            }
        }

        return Promise.reject(error);
    }
);

export default instance;

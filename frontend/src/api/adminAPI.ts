import instance from './axiosInstance';

export const fetchAdminStatistics = () =>
    instance.get('/admin/statistics/overview').then((r) => r.data);

export const fetchAdminRevenue = (year: number, month: number) =>
    instance.get('/admin/statistics/revenue', { params: { year, month } }).then((r) => r.data);

export const fetchAdminTopProducts = (limit = 10) =>
    instance.get('/admin/statistics/top-products', { params: { limit } }).then((r) => r.data);
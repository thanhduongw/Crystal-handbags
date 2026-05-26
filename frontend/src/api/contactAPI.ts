import type { ContactRequest } from '../types';
import instance from './axiosInstance';

export const sendContactMessage = (payload: ContactRequest): Promise<{ message: string }> =>
    instance.post('/contact', payload).then(r => r.data);

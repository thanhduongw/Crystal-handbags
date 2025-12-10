import type { UserProfileDto } from '../types';
import instance from './axiosInstance';

// User profile APIs
export const getProfile = (): Promise<UserProfileDto> =>
  instance.get('/users/profile').then(r => r.data);

export const updateProfile = (profile: UserProfileDto): Promise<UserProfileDto> =>
  instance.put('/users/profile', profile).then(r => r.data);

// Admin user management APIs
export const getAllUsers = (): Promise<UserProfileDto[]> =>
  instance.get('/admin/users').then(r => r.data);

export const getUserById = (id: number) =>
  instance.get(`/users/${id}`).then(r => r.data);

export const createUser = (user: any): Promise<any> =>
  instance.post('/admin/users', user).then(r => r.data);

export const updateUser = (id: number, user: any): Promise<any> =>
  instance.put(`/admin/users/${id}`, user).then(r => r.data);

export const deleteUser = (id: number): Promise<void> =>
  instance.delete(`/admin/users/${id}`);
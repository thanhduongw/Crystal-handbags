import type { UserCreateRequest, UserCreateResponse, UserProfileDto, UserUpdateRequest } from '../types';
import instance from './axiosInstance';

// User profile APIs
export const getProfile = (): Promise<UserProfileDto> =>
  instance.get('/users/profile').then(r => r.data);

export const updateProfile = (profile: UserProfileDto): Promise<UserProfileDto> =>
  instance.put('/users/profile', profile).then(r => r.data);

// Admin user management APIs (admin endpoints under /admin/users)
export const getAllUsers = (): Promise<UserProfileDto[]> =>
  instance.get('/admin/users').then(r => r.data);

export const getUserById = (id: number): Promise<UserProfileDto> =>
  instance.get(`/admin/users/${id}`).then(r => r.data);

export const createUser = (user: UserCreateRequest): Promise<UserCreateResponse> =>
  instance.post('/admin/users', user).then(r => r.data);

export const updateUser = (id: number, user: UserUpdateRequest): Promise<UserProfileDto> =>
  instance.put(`/admin/users/${id}`, user).then(r => r.data);

export const deleteUser = (id: number): Promise<void> =>
  instance.delete(`/admin/users/${id}`).then(r => r.data);

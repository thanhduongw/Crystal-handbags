import type { UserProfileDto } from '../types';
import instance from './axiosInstance';

export const getProfile = () =>
    instance.get<UserProfileDto>('/users/profile').then(r => r.data);

export const updateProfile = (profile: UserProfileDto) =>
    instance.put<UserProfileDto>('/users/profile', profile).then(r => r.data);
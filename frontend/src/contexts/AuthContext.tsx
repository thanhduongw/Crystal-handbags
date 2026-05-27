import { useState, useEffect, type ReactNode } from 'react';
import * as authAPI from '../api/authAPI';
import { AuthContext } from './authContextCore';
import type { AuthUser } from '../types';
import { getUserFromToken, isAdminUser, isJwtExpired } from '../utils/authToken';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const loadUser = async () => {
            const token = localStorage.getItem('accessToken');
            const refreshToken = localStorage.getItem('refreshToken');

            try {
                if (token && !isJwtExpired(token)) {
                    if (mounted) setUser(getUserFromToken(token));
                    return;
                }

                if (refreshToken && !isJwtExpired(refreshToken, 0)) {
                    const response = await authAPI.refreshToken(refreshToken);
                    localStorage.setItem('accessToken', response.accessToken);
                    localStorage.setItem('refreshToken', response.refreshToken);
                    if (mounted) setUser(getUserFromToken(response.accessToken));
                    return;
                }

                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                if (mounted) setUser(null);
            } catch {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                if (mounted) setUser(null);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        void loadUser();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const syncUserFromToken = (event: Event) => {
            const token = (event as CustomEvent<{ accessToken?: string }>).detail?.accessToken
                ?? localStorage.getItem('accessToken');
            setUser(token ? getUserFromToken(token) : null);
        };

        const clearUser = () => setUser(null);

        window.addEventListener('auth:tokens-refreshed', syncUserFromToken);
        window.addEventListener('auth:logged-out', clearUser);

        return () => {
            window.removeEventListener('auth:tokens-refreshed', syncUserFromToken);
            window.removeEventListener('auth:logged-out', clearUser);
        };
    }, []);

    const login = (token: string, refreshToken: string, user: AuthUser) => {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(user);
    };

    const logout = async () => {
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout API error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
            window.location.href = '/login';
        }
    };

    const isAdmin = isAdminUser(user);

    return (
        <AuthContext.Provider value={{ user, login, logout, isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

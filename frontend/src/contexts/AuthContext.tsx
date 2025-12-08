import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { AuthUser } from '../types';

interface AuthContextType {
    user: AuthUser | null;
    login: (token: string, refreshToken: string, user: AuthUser) => void;
    logout: () => void;
    isAdmin: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setUser({
                    email: payload.sub,
                    role: payload.scope,
                    userId: payload.userId,
                });
            } catch (error) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
        }
        setLoading(false);
    }, []);

    const login = (token: string, refreshToken: string, user: AuthUser) => {
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
        window.location.href = '/login';
    };

    const isAdmin = user?.role === 'ROLE_ADMIN';

    return (
        <AuthContext.Provider value={{ user, login, logout, isAdmin, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
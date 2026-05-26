import { createContext } from 'react';
import type { AuthUser } from '../types';

export interface AuthContextType {
    user: AuthUser | null;
    login: (token: string, refreshToken: string, user: AuthUser) => void;
    logout: () => Promise<void>;
    isAdmin: boolean;
    loading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

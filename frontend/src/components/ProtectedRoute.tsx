import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Spin } from 'antd';
import type { JSX } from 'react';

interface ProtectedRouteProps {
    children: JSX.Element;
    requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return <Spin style={{ display: 'block', margin: '100px auto' }} />;
    }

    if (!user) return <Navigate to="/login" replace />;
    if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;

    return children;
}

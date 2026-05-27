import type { AuthUser, Role } from '../types';

type JwtPayload = {
    sub?: string;
    exp?: number;
    userId?: number | string;
    scope?: string | string[];
};

const normalizeRoles = (scope: JwtPayload['scope']): Role[] => {
    const values = Array.isArray(scope)
        ? scope
        : typeof scope === 'string'
            ? scope.split(/\s+/)
            : [];

    return values
        .filter((role): role is Role => role === 'ROLE_ADMIN' || role === 'ROLE_CUSTOMER');
};

export const decodeJwtPayload = (token: string): JwtPayload | null => {
    try {
        const payload = token.split('.')[1];
        if (!payload) return null;

        const normalizedPayload = payload
            .replace(/-/g, '+')
            .replace(/_/g, '/')
            .padEnd(Math.ceil(payload.length / 4) * 4, '=');

        return JSON.parse(atob(normalizedPayload));
    } catch {
        return null;
    }
};

export const isJwtExpired = (token: string, skewSeconds = 30) => {
    const payload = decodeJwtPayload(token);
    if (!payload?.exp) return true;

    return payload.exp * 1000 <= Date.now() + skewSeconds * 1000;
};

export const getUserFromToken = (token: string): AuthUser | null => {
    const payload = decodeJwtPayload(token);
    if (!payload?.sub || payload.userId == null) return null;

    const roles = normalizeRoles(payload.scope);
    const role = roles.includes('ROLE_ADMIN') ? 'ROLE_ADMIN' : roles[0];

    if (!role) return null;

    return {
        email: payload.sub,
        role,
        roles,
        userId: Number(payload.userId),
    };
};

export const isAdminUser = (user: AuthUser | null) =>
    Boolean(user?.roles?.includes('ROLE_ADMIN') || user?.role === 'ROLE_ADMIN');



import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, PropsWithChildren } from 'react';
import { User } from '../types';
import { API_BASE_URL } from '../apiConfig';
import { getStoredAuthData, setStoredAuthData, clearStoredAuthData } from '../utils/authStorage';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// FIX: Use React.PropsWithChildren to correctly type the component with children.
export const AuthProvider = ({ children }: PropsWithChildren<{}>) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const { token: storedToken, user: storedUser } = getStoredAuthData();
        if (storedToken && storedUser) {
            setToken(storedToken);
            setUser(storedUser);
        }
        setIsLoading(false);
    }, []);

    const login = useCallback(async (email: string, password?: string) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Invalid credentials or inactive account' }));
            throw new Error(errorData.message || 'Login failed');
        }

        const data = await response.json();
        
        let authToken = data.token;
        if (!authToken) {
            const authHeader = response.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                authToken = authHeader.substring(7);
            }
        }

        if (!data.user || !authToken) {
            console.error('API Response missing user or token', { data, headers: response.headers });
            throw new Error('Invalid API response from login: user data or token is missing.');
        }
        
        const userData: User = {
            ...data.user,
            avatarUrl: `https://picsum.photos/seed/${data.user.id}/100`
        };

        setToken(authToken);
        setUser(userData);
        setStoredAuthData(authToken, userData);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        clearStoredAuthData();
    }, []);

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
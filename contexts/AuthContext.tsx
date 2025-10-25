import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User } from '../types';
import { API_BASE_URL } from '../apiConfig';

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password?: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const storedToken = localStorage.getItem('authToken');
            const storedUser = localStorage.getItem('authUser');

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("Failed to parse auth data from localStorage", error);
        } finally {
            setIsLoading(false);
        }
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
        
        // Robust token handling: check body first, then fallback to Authorization header.
        let authToken = data.token;
        if (!authToken) {
            const authHeader = response.headers.get('Authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                authToken = authHeader.substring(7);
            }
        }

        if (!data.userDto || !authToken) {
            console.error('API Response missing user or token', { data, headers: response.headers });
            throw new Error('Invalid API response from login: user data or token is missing.');
        }
        
        const userData: User = {
            ...data.userDto,
            // The backend doesn't provide an avatar, so we use a placeholder
            avatarUrl: `https://picsum.photos/seed/${data.userDto.id}/100`
        };

        setToken(authToken);
        setUser(userData);
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('authUser', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        // We should also clear the selected farm to avoid stale data
        // This is handled by FarmContext reacting to user logout
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
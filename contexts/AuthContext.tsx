import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User } from '../types';

const API_BASE_URL = '/api/v1'; // Using a proxy path

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
        
        const userData: User = {
            ...data.userDto,
            // The backend doesn't provide an avatar, so we use a placeholder
            avatarUrl: `https://picsum.photos/seed/${data.userDto.id}/100`
        };

        setToken(data.token);
        setUser(userData);
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('authUser', JSON.stringify(userData));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
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

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

        // FIX: The API returns a 'user' object, not 'userDto'.
        // Also, add checks to ensure data is what we expect.
        if (!data.user || !data.token) {
            throw new Error('Invalid API response from login');
        }
        
        const userData: User = {
            ...data.user,
            // The backend doesn't provide an avatar, so we use a placeholder
            avatarUrl: `https://picsum.photos/seed/${data.user.id}/100`
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

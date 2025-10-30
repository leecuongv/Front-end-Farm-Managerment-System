import { User } from '../types';

export function getStoredAuthData(): { token: string | null; user: User | null } {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('authUser');
    let user: User | null = null;

    if (userStr) {
        try {
            user = JSON.parse(userStr);
        } catch (e) {
            console.error("Failed to parse authUser from localStorage, clearing data.", e);
            // If data is corrupt, clear it to prevent repeated crashes.
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
            return { token: null, user: null };
        }
    }

    // If there's no user data, the token is also invalid.
    if (!user || !token) {
        return { token: null, user: null };
    }

    return { token, user };
}

export function setStoredAuthData(token: string, user: User): void {
    localStorage.setItem('authToken', token);
    localStorage.setItem('authUser', JSON.stringify(user));
}

export function clearStoredAuthData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
}

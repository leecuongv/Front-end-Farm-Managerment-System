import { API_BASE_URL } from './apiConfig';
import { getStoredAuthData } from './utils/authStorage';
import { User } from './types';


interface ApiClientOptions extends RequestInit {
    // We can add custom options here if needed later
}

async function apiClient<T>(
    endpoint: string,
    options: ApiClientOptions = {}
): Promise<T> {
    const { token, user } = getStoredAuthData();
    
    const headers = new Headers(options.headers || {});
    if (!options.body || options.body instanceof FormData === false) {
        headers.set('Content-Type', 'application/json');
    }

    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    // Add user-id for state-changing operations
    if (user && options.method && options.method.toUpperCase() !== 'GET') {
         headers.set('user-id', user.id);
    }
    
    const config: RequestInit = {
        ...options,
        headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        // Try to parse error message from backend
        try {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Có lỗi xảy ra từ máy chủ.');
        } catch (e) {
            throw new Error(`Lỗi mạng: ${response.statusText}`);
        }
    }

    // For requests with no body (like DELETE or some PUT/POST), response.json() will fail.
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return {} as T;
    }
    
    return response.json() as Promise<T>;
}

export default apiClient;
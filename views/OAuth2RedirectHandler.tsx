
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const OAuth2RedirectHandler: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { loginWithToken } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        const handleLogin = async (authToken: string) => {
            try {
                if (!loginWithToken) {
                    throw new Error("Chức năng xác thực không khả dụng.");
                }
                await loginWithToken(authToken);
                navigate('/dashboard', { replace: true });
            } catch (err: any) {
                const errorMessage = err.message || 'Lỗi khi lấy thông tin người dùng.';
                navigate(`/login?error=${encodeURIComponent(errorMessage)}`, { replace: true });
            }
        };

        if (token) {
            handleLogin(token);
        } else if (error) {
            navigate(`/login?error=${encodeURIComponent(error)}`, { replace: true });
        } else {
            navigate('/login?error=Lỗi không xác định trong quá trình xác thực.', { replace: true });
        }
    // Effect này chỉ nên chạy một lần khi component được mount và searchParams có sẵn.
    // Các hàm navigate và loginWithToken là ổn định và không cần nằm trong mảng phụ thuộc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    return (
        <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-300">Đang xử lý đăng nhập...</p>
            </div>
        </div>
    );
};

export default OAuth2RedirectHandler;

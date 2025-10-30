


import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Role, Farm } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { useNotification } from '../contexts/NotificationContext';
import { EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, XIcon } from '../constants';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import apiClient from '../apiClient';
import ToggleSwitch from '../components/ToggleSwitch';
import { useAuth } from '../contexts/AuthContext';
import { roleMap, translate } from '../utils/translations';

const initialUserState: Omit<User, 'id' | 'avatarUrl'> = {
    username: '',
    fullName: '',
    email: '',
    role: Role.STAFF,
    farmIds: [],
    isActive: true,
};

const initialFilters = {
    search: '',
    role: '',
    isActive: '',
    sortBy: 'fullName',
    sortDirection: 'asc',
};

const buildQueryString = (params: Record<string, string>) => {
    const query = new URLSearchParams();
    for (const key in params) {
        if (params[key]) {
            query.set(key, params[key]);
        }
    }
    return query.toString();
};

const UserManagementView: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | (Omit<User, 'id' | 'avatarUrl'> & { password?: string }) | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [filters, setFilters] = useState(initialFilters);
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
    
    const { farms } = useFarm();
    const { addNotification } = useNotification();

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 500);
        return () => clearTimeout(handler);
    }, [filters.search]);

    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const queryParams = buildQueryString({
                search: debouncedSearch,
                role: filters.role,
                isActive: filters.isActive,
                sortBy: filters.sortBy,
                sortDirection: filters.sortDirection,
            });
            const data = await apiClient<User[]>(`/users?${queryParams}`);
            setUsers(data.map(u => ({...u, avatarUrl: `https://picsum.photos/seed/${u.id}/100`})));
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [addNotification, debouncedSearch, filters.role, filters.isActive, filters.sortBy, filters.sortDirection]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters(initialFilters);
    };

    const handleOpenModal = (user: User | null = null) => {
        setEditingUser(user || initialUserState);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(null);
    };

    const handleSaveUser = async (userData: User | (Omit<User, 'id' | 'avatarUrl'> & { password?: string })) => {
        const isEditing = 'id' in userData;
        const endpoint = isEditing ? `/users/${userData.id}` : '/users';
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            await apiClient(endpoint, {
                method,
                body: JSON.stringify(userData),
            });
            addNotification(`Người dùng đã được ${isEditing ? 'cập nhật' : 'tạo'} thành công.`, 'success');
            handleCloseModal();
            fetchUsers();
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };
    
    const handleDeleteUser = async () => {
        if (!userToDelete) return;

        try {
            await apiClient(`/users/${userToDelete.id}`, { method: 'DELETE' });
            addNotification(`Người dùng ${userToDelete.fullName} đã được xóa.`, 'success');
            fetchUsers();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setUserToDelete(null);
        }
    };

    const handleToggleActivation = async (user: User) => {
        try {
            await apiClient(`/users/${user.id}/activate`, {
                method: 'POST',
                body: JSON.stringify({ isActive: !user.isActive }),
            });
            addNotification(`Trạng thái của người dùng ${user.fullName} đã được cập nhật.`, 'success');
            fetchUsers();
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };

    const isFiltered = useMemo(() => JSON.stringify(filters) !== JSON.stringify(initialFilters), [filters]);


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Quản lý người dùng</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                    Thêm người dùng
                </button>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex flex-wrap gap-4 items-center">
                <div className="flex-grow min-w-[200px]">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm tên, email..." 
                        className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm"
                        value={filters.search}
                        onChange={e => handleFilterChange('search', e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Vai trò:</label>
                    <select value={filters.role} onChange={e => handleFilterChange('role', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        <option value="">Tất cả</option>
                        {Object.entries(roleMap).map(([key, value]) => <option key={key} value={key as Role}>{value}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Trạng thái:</label>
                    <select value={filters.isActive} onChange={e => handleFilterChange('isActive', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        <option value="">Tất cả</option>
                        <option value="true">Hoạt động</option>
                        <option value="false">Không hoạt động</option>
                    </select>
                </div>
                 <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Sắp xếp:</label>
                    <select value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        <option value="fullName">Tên</option>
                        <option value="email">Email</option>
                        <option value="role">Vai trò</option>
                    </select>
                </div>
                <button onClick={() => handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')} className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                    {filters.sortDirection === 'asc' ? <ArrowUpIcon className="w-5 h-5"/> : <ArrowDownIcon className="w-5 h-5"/>}
                </button>
                {isFiltered && (
                    <button onClick={resetFilters} className="p-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                        <XIcon className="w-4 h-4" /> Xóa bộ lọc
                    </button>
                )}
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-full">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên người dùng</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vai trò</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trang trại</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trạng thái</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {users.length > 0 ? users.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                            <div className="flex items-center">
                                                <img className="h-10 w-10 rounded-full" src={user.avatarUrl} alt="" />
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{translate(roleMap, user.role)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {user.farmIds.map(id => farms.find(f => f.id === id)?.name).join(', ') || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <ToggleSwitch 
                                                checked={user.isActive} 
                                                onChange={() => handleToggleActivation(user)}
                                                disabled={user.id === currentUser?.id}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                            <button onClick={() => handleOpenModal(user)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200">
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button 
                                                onClick={() => setUserToDelete(user)} 
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                                disabled={user.id === currentUser?.id}
                                            >
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                            {isFiltered ? 'Không tìm thấy người dùng nào khớp với bộ lọc.' : 'Không tìm thấy người dùng nào.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {isModalOpen && editingUser && (
                <Modal 
                    title={ 'id' in editingUser ? 'Sửa thông tin người dùng' : 'Thêm người dùng mới'} 
                    onClose={handleCloseModal}
                >
                    <UserForm 
                        user={editingUser} 
                        allFarms={farms}
                        onSave={handleSaveUser} 
                        onCancel={handleCloseModal} 
                    />
                </Modal>
            )}

            {userToDelete && (
                <ConfirmationModal
                    title="Xóa Người dùng"
                    message={`Bạn có chắc chắn muốn xóa người dùng ${userToDelete.fullName}?`}
                    onConfirm={handleDeleteUser}
                    onCancel={() => setUserToDelete(null)}
                />
            )}
        </div>
    );
};

interface UserFormProps {
    user: User | (Omit<User, 'id' | 'avatarUrl'> & { password?: string });
    allFarms: Farm[];
    onSave: (user: User | (Omit<User, 'id' | 'avatarUrl'> & { password?: string })) => void;
    onCancel: () => void;
}

const UserForm: React.FC<UserFormProps> = ({ user, allFarms, onSave, onCancel }) => {
    const [formData, setFormData] = useState(user);
    const isEditing = 'id' in user;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        // FIX: Rewrite to ensure correct type inference for `option`.
        // Using the spread operator on `e.target.selectedOptions` correctly converts
        // the HTMLCollection to an array of HTMLOptionElement, resolving the type issue.
        const selectedIds = [...e.target.selectedOptions].map(option => option.value);
        setFormData(prev => ({...prev, farmIds: selectedIds }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Họ và Tên</label>
                    <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên đăng nhập</label>
                    <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                 <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input type="email" name="email" id="email" value={formData.email} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                {!isEditing && (
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mật khẩu</label>
                        <input type="password" name="password" id="password" value={(formData as any).password || ''} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                    </div>
                )}
                 <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vai trò</label>
                    <select name="role" id="role" value={formData.role} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        {Object.entries(roleMap).map(([key, value]) => <option key={key} value={key as Role}>{value}</option>)}
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="farmIds" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trang trại được gán</label>
                    <select 
                        name="farmIds" 
                        id="farmIds" 
                        multiple 
                        value={formData.farmIds} 
                        onChange={handleFarmChange} 
                        className="mt-1 block w-full h-32 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700"
                    >
                        {allFarms.map(farm => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
            </div>
        </form>
    );
};

export default UserManagementView;
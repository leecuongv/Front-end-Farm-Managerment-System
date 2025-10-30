import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Task, User, Role } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, XIcon } from '../constants';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import apiClient from '../apiClient';
import Calendar from '../components/Calendar';

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'DONE'];

const initialTaskState: Omit<Task, 'id' | 'createdAt' | 'createdBy'> = {
    farmId: '',
    title: '',
    description: '',
    assignedTo: '',
    status: 'TODO',
    dueDate: new Date().toISOString().split('T')[0],
};

const initialFilters = {
    status: '',
    sortBy: 'dueDate',
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


const TasksView: React.FC = () => {
    const { user } = useAuth();
    const { selectedFarm } = useFarm();
    const { addNotification } = useNotification();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | Omit<Task, 'id' | 'createdAt' | 'createdBy'> | null>(null);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
    const [filters, setFilters] = useState(initialFilters);

    const fetchData = useCallback(async () => {
        if (!selectedFarm) {
            setTasks([]);
            setUsers([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const queryParams = buildQueryString({
                farmId: selectedFarm.id,
                ...filters,
            });
            const [tasksData, usersData] = await Promise.all([
                apiClient<Task[]>(`/tasks?${queryParams}`),
                apiClient<User[]>('/users')
            ]);
            setTasks(tasksData);
            setUsers(usersData);
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm, addNotification, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters(initialFilters);
    };
    
    const isFiltered = useMemo(() => JSON.stringify(filters) !== JSON.stringify(initialFilters), [filters]);

    const handleOpenModal = (task: Task | null = null) => {
        setEditingTask(task || { ...initialTaskState, farmId: selectedFarm?.id || '' });
        setIsModalOpen(true);
    };
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveTask = async (taskData: Task | Omit<Task, 'id' | 'createdAt' | 'createdBy'>) => {
        const isEditing = 'id' in taskData;
        const endpoint = isEditing ? `/tasks/${taskData.id}` : '/tasks';
        const method = isEditing ? 'PUT' : 'POST';
        try {
            await apiClient(endpoint, { method, body: JSON.stringify(taskData) });
            addNotification(`Công việc đã được ${isEditing ? 'cập nhật' : 'tạo'} thành công.`, 'success');
            handleCloseModal();
            fetchData();
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };
    
    const handleDeleteTask = async () => {
        if (!taskToDelete) return;
        try {
            await apiClient(`/tasks/${taskToDelete.id}`, { method: 'DELETE' });
            addNotification(`Công việc "${taskToDelete.title}" đã được xóa.`, 'success');
            fetchData();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setTaskToDelete(null);
        }
    };

    const canManage = user?.role === Role.ADMIN || user?.role === Role.MANAGER;

    if (isLoading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div></div>;
    if (!selectedFarm) return <div className="p-4 text-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">Vui lòng chọn một trang trại để xem công việc.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Quản lý Công việc</h2>
                <div className="flex items-center space-x-4">
                    <div className="bg-gray-200 dark:bg-gray-700 p-1 rounded-lg">
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'list' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Danh sách</button>
                        <button onClick={() => setViewMode('calendar')} className={`px-3 py-1 text-sm rounded-md ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-900 shadow' : ''}`}>Lịch</button>
                    </div>
                    {canManage && (
                        <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Tạo công việc</button>
                    )}
                </div>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Trạng thái:</label>
                    <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        <option value="">Tất cả</option>
                        {TASK_STATUSES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Sắp xếp:</label>
                    <select value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        <option value="dueDate">Ngày hết hạn</option>
                        <option value="title">Tiêu đề</option>
                        <option value="status">Trạng thái</option>
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

            {viewMode === 'list' ? (
                <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                   <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                           <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tiêu đề</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Giao cho</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ngày hết hạn</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Trạng thái</th>
                                    {canManage && <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {tasks.map(task => (
                                    <tr key={task.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{task.title}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{users.find(u => u.id === task.assignedTo)?.fullName || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(task.dueDate).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${task.status === 'DONE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{task.status}</span></td>
                                        {canManage && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                                <button onClick={() => handleOpenModal(task)} className="text-primary-600 hover:text-primary-900"><EditIcon className="w-5 h-5" /></button>
                                                <button onClick={() => setTaskToDelete(task)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <Calendar tasks={tasks} users={users} onTaskClick={handleOpenModal} />
            )}

            {isModalOpen && editingTask && (
                <Modal title={'id' in editingTask ? 'Sửa công việc' : 'Tạo công việc mới'} onClose={handleCloseModal}>
                    <TaskForm task={editingTask} users={users} onSave={handleSaveTask} onCancel={handleCloseModal} />
                </Modal>
            )}

            {taskToDelete && (
                <ConfirmationModal
                    title="Xóa Công việc"
                    message={`Bạn có chắc chắn muốn xóa công việc "${taskToDelete.title}"?`}
                    onConfirm={handleDeleteTask}
                    onCancel={() => setTaskToDelete(null)}
                />
            )}
        </div>
    );
};

const TaskForm: React.FC<{ task: any, users: User[], onSave: (data: any) => void, onCancel: () => void }> = ({ task, users, onSave, onCancel }) => {
    const [formData, setFormData] = useState(task);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="title" value={formData.title} onChange={handleChange} placeholder="Tiêu đề" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
            <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả" rows={4} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label>Giao cho</label>
                    <select name="assignedTo" value={formData.assignedTo} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                        <option value="">Chọn người dùng</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                    </select>
                </div>
                <div>
                    <label>Ngày hết hạn</label>
                    <input type="date" name="dueDate" value={formData.dueDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2" />
                </div>
            </div>
             <div>
                <label>Trạng thái</label>
                <select name="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                    {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
            </div>
        </form>
    );
};

export default TasksView;
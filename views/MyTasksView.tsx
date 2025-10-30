import React, { useState, useEffect, useCallback } from 'react';
import { Task } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { useAuth } from '../contexts/AuthContext';
import apiClient from '../apiClient';
import { taskStatusMap, translate } from '../utils/translations';

const TASK_STATUS_CLASSES = {
    'TODO': 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    'IN_PROGRESS': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'DONE': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const MyTasksView: React.FC = () => {
    const { user } = useAuth();
    const { selectedFarm } = useFarm();
    const [myTasks, setMyTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchMyTasks = useCallback(async () => {
        if (!selectedFarm || !user) {
            setMyTasks([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const allTasks = await apiClient<Task[]>(`/tasks?farmId=${selectedFarm.id}`);
            const userTasks = allTasks.filter(task => task.assignedTo === user.id);
            setMyTasks(userTasks);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm, user]);

    useEffect(() => {
        fetchMyTasks();
    }, [fetchMyTasks]);
    
    const handleStatusChange = async (task: Task, newStatus: Task['status']) => {
        const originalTasks = [...myTasks];
        // Optimistically update UI
        setMyTasks(myTasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

        try {
            await apiClient(`/tasks/${task.id}`, {
                method: 'PUT',
                body: JSON.stringify({ ...task, status: newStatus }),
            });
            // No need to refetch, optimistic update is now confirmed
        } catch (err: any) {
            setError('Failed to update task status. Reverting changes.');
            // Revert on error
            setMyTasks(originalTasks);
        }
    };


    if (isLoading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div></div>;
    if (!selectedFarm) return <div className="p-4 text-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">Vui lòng chọn một trang trại để xem công việc.</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Công việc của tôi</h2>
            {error && <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg">{error}</div>}
            
            <div className="space-y-4">
                {myTasks.length > 0 ? myTasks.map(task => (
                    <div key={task.id} className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="flex-1 mb-4 md:mb-0">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{task.title}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                            <p className="text-xs text-gray-500 mt-1">Hạn chót: {new Date(task.dueDate).toLocaleDateString('vi-VN')}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                           <span className={`px-3 py-1 text-sm font-semibold rounded-full ${TASK_STATUS_CLASSES[task.status]}`}>
                                {translate(taskStatusMap, task.status)}
                            </span>
                            <select 
                                value={task.status} 
                                onChange={(e) => handleStatusChange(task, e.target.value as Task['status'])}
                                className="rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700 p-2"
                            >
                                {Object.entries(taskStatusMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                            </select>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 rounded-lg">
                        Bạn không có công việc nào được giao.
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyTasksView;
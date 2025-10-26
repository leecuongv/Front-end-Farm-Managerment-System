import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useFarm } from '../contexts/FarmContext';
import apiClient from '../apiClient';
import { User, Task } from '../types';
import { useTheme } from '../contexts/ThemeContext';

const ReportsView: React.FC = () => {
    const { selectedFarm } = useFarm();
    const { theme } = useTheme();
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedFarm) {
                setIsLoading(false);
                return;
            };
            setIsLoading(true);
            try {
                const [usersData, tasksData] = await Promise.all([
                    apiClient<User[]>('/users'),
                    apiClient<Task[]>(`/tasks?farmId=${selectedFarm.id}`)
                ]);
                setUsers(usersData.filter(u => u.farmIds.includes(selectedFarm.id)));
                setTasks(tasksData);
            } catch (error) {
                console.error("Failed to fetch report data:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [selectedFarm]);

    const performanceData = useMemo(() => {
        return users.map(user => {
            const userTasks = tasks.filter(task => task.assignedTo === user.id);
            const completed = userTasks.filter(t => t.status === 'DONE').length;
            const inProgress = userTasks.filter(t => t.status === 'IN_PROGRESS').length;
            const todo = userTasks.filter(t => t.status === 'TODO').length;
            return {
                name: user.fullName,
                completed,
                inProgress,
                todo,
                total: userTasks.length
            };
        });
    }, [users, tasks]);

    const chartColors = theme === 'dark' ? { bar: '#60a5fa', tick: '#9ca3af' } : { bar: '#2563eb', tick: '#6b7280' };

    if (isLoading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div></div>;
    if (!selectedFarm) return <div className="p-4 text-center text-gray-500 bg-white dark:bg-gray-900 rounded-lg shadow-md">Vui lòng chọn trang trại để xem báo cáo.</div>;
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Báo cáo Hiệu suất Nhân viên</h2>
            
            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Hoàn thành công việc</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="name" stroke={chartColors.tick} />
                        <YAxis stroke={chartColors.tick} />
                        <Tooltip
                            contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
                            cursor={{ fill: theme === 'dark' ? 'rgba(156, 163, 175, 0.1)' : 'rgba(229, 231, 235, 0.5)' }}
                        />
                        <Legend />
                        <Bar dataKey="completed" fill={chartColors.bar} name="Hoàn thành" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Nhân viên</th>
                                <th className="px-6 py-3 text-center text-xs font-medium uppercase">Hoàn thành</th>
                                <th className="px-6 py-3 text-center text-xs font-medium uppercase">Đang làm</th>
                                <th className="px-6 py-3 text-center text-xs font-medium uppercase">Cần làm</th>
                                <th className="px-6 py-3 text-center text-xs font-medium uppercase">Tổng cộng</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {performanceData.map(user => (
                                <tr key={user.name}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-green-600 font-semibold">{user.completed}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-yellow-600">{user.inProgress}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-red-600">{user.todo}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center font-bold">{user.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ReportsView;
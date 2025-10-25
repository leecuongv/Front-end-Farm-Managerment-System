

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

const kpiData = [
    { title: 'Total Livestock', value: '1,250', change: '+5%', changeType: 'increase' },
    { title: 'Healthy Animals', value: '1,205', change: '96.4%', changeType: 'neutral' },
    { title: 'Tasks Due Today', value: '8', change: '+2', changeType: 'increase' },
    { title: 'Low Stock Items', value: '3', change: '-1', changeType: 'decrease' },
// FIX: Added 'as const' to ensure TypeScript infers the literal types for 'changeType'
] as const;

const financialData = [
    { name: 'Jan', Revenue: 4000, Expense: 2400 },
    { name: 'Feb', Revenue: 3000, Expense: 1398 },
    { name: 'Mar', Revenue: 5000, Expense: 3800 },
    { name: 'Apr', Revenue: 4780, Expense: 3908 },
    { name: 'May', Revenue: 5890, Expense: 4800 },
    { name: 'Jun', Revenue: 4390, Expense: 3800 },
];

const taskStatusData = [
    { name: 'Done', value: 400 },
    { name: 'In Progress', value: 150 },
    { name: 'To Do', value: 80 },
    { name: 'Overdue', value: 20 },
];

const COLORS = {
    light: ['#1d4ed8', '#60a5fa', '#f59e0b', '#ef4444'],
    dark: ['#60a5fa', '#93c5fd', '#facc15', '#f87171'],
};

const KPICard: React.FC<{ title: string; value: string; change: string; changeType: 'increase' | 'decrease' | 'neutral' }> = ({ title, value, change, changeType }) => {
    const changeColor = {
        increase: 'text-green-500',
        decrease: 'text-red-500',
        neutral: 'text-gray-500 dark:text-gray-400'
    };
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <p className="text-3xl font-bold mt-1">{value}</p>
            <p className={`text-sm mt-2 ${changeColor[changeType]}`}>{change}</p>
        </div>
    );
};

const DashboardView: React.FC = () => {
    const { theme } = useTheme();
    const chartColors = COLORS[theme];
    const tickColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {kpiData.map(kpi => <KPICard key={kpi.title} {...kpi} />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4">Financial Overview</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={financialData}>
                            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                            <XAxis dataKey="name" stroke={tickColor} />
                            <YAxis stroke={tickColor} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                                }}
                            />
                            <Legend />
                            <Bar dataKey="Revenue" fill={chartColors[0]} radius={[4, 4, 0, 0]} />
                            <Bar dataKey="Expense" fill={chartColors[1]} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4">Task Status</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={taskStatusData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {taskStatusData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{
                                    backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
                                    borderColor: theme === 'dark' ? '#374151' : '#e5e7eb',
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
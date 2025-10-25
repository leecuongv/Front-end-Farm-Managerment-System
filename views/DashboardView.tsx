import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';

const kpiData = [
    { title: 'Tổng số vật nuôi', value: '1,250', change: '+5%', changeType: 'increase' },
    { title: 'Vật nuôi khỏe mạnh', value: '1,205', change: '96.4%', changeType: 'neutral' },
    { title: 'Việc cần làm hôm nay', value: '8', change: '+2', changeType: 'increase' },
    { title: 'Vật tư sắp hết', value: '3', change: '-1', changeType: 'decrease' },
] as const;

const financialData = [
    { name: 'Thg 1', Revenue: 4000, Expense: 2400 },
    { name: 'Thg 2', Revenue: 3000, Expense: 1398 },
    { name: 'Thg 3', Revenue: 5000, Expense: 3800 },
    { name: 'Thg 4', Revenue: 4780, Expense: 3908 },
    { name: 'Thg 5', Revenue: 5890, Expense: 4800 },
    { name: 'Thg 6', Revenue: 4390, Expense: 3800 },
];

const taskStatusData = [
    { name: 'Hoàn thành', value: 400 },
    { name: 'Đang làm', value: 150 },
    { name: 'Cần làm', value: 80 },
    { name: 'Quá hạn', value: 20 },
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
                    <h3 className="font-semibold text-lg mb-4">Tổng quan tài chính</h3>
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
                                labelStyle={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
                            />
                            <Legend />
                            <Bar dataKey="Revenue" fill={chartColors[0]} radius={[4, 4, 0, 0]} name="Doanh thu" />
                            <Bar dataKey="Expense" fill={chartColors[1]} radius={[4, 4, 0, 0]} name="Chi phí" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4">Trạng thái công việc</h3>
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
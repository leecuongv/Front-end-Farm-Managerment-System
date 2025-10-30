
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useTheme } from '../contexts/ThemeContext';
import { useFarm } from '../contexts/FarmContext';
import apiClient from '../apiClient';
import { Animal, Task, InventoryItem, FinancialTransaction } from '../types';
import { translate, taskStatusMap, animalTypeMap } from '../utils/translations';

const COLORS = {
    light: ['#1d4ed8', '#60a5fa', '#f59e0b', '#ef4444', '#10b981', '#f97316' ],
    dark: ['#60a5fa', '#93c5fd', '#facc15', '#f87171', '#34d399', '#fb923c'],
};

const KPICard: React.FC<{ title: string; value: string | number; subtext?: string; }> = ({ title, value, subtext }) => {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtext && <p className={`text-sm mt-2 text-gray-500 dark:text-gray-400`}>{subtext}</p>}
        </div>
    );
};

const ChartPlaceholder: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
        {message}
    </div>
);


const DashboardView: React.FC = () => {
    const { theme } = useTheme();
    const { selectedFarm } = useFarm();

    const [kpiData, setKpiData] = useState({ totalAnimals: 0, healthyAnimals: 0, tasksTodo: 0, lowStockItems: 0 });
    const [financialData, setFinancialData] = useState<any[]>([]);
    const [taskStatusData, setTaskStatusData] = useState<any[]>([]);
    const [animalTypeData, setAnimalTypeData] = useState<any[]>([]);
    const [inventoryCategoryData, setInventoryCategoryData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (!selectedFarm) {
                 setIsLoading(false);
                 return;
            };
            setIsLoading(true);

            try {
                const [animals, tasks, inventory, finances] = await Promise.all([
                    apiClient<Animal[]>(`/animals?farmId=${selectedFarm.id}`),
                    apiClient<Task[]>(`/tasks?farmId=${selectedFarm.id}`),
                    apiClient<InventoryItem[]>(`/inventory-items?farmId=${selectedFarm.id}`),
                    apiClient<FinancialTransaction[]>(`/financial-transactions?farmId=${selectedFarm.id}`)
                ]);

                // Process KPI data
                const healthy = animals.filter(a => a.status === 'HEALTHY').length;
                const todo = tasks.filter(t => t.status === 'TODO').length;
                const lowStock = inventory.filter(i => i.quantity <= i.lowStockThreshold).length;
                setKpiData({ totalAnimals: animals.length, healthyAnimals: healthy, tasksTodo: todo, lowStockItems: lowStock });

                // Process financial chart data (monthly summary)
                const monthlyFinances: { [key: string]: { 'Doanh thu': number, 'Chi phí': number } } = {};
                finances.forEach(t => {
                    const month = new Date(t.date).toLocaleString('default', { month: 'short', year: 'numeric' });
                    if (!monthlyFinances[month]) {
                        monthlyFinances[month] = { 'Doanh thu': 0, 'Chi phí': 0 };
                    }
                    if (t.type === 'REVENUE') monthlyFinances[month]['Doanh thu'] += t.amount;
                    else monthlyFinances[month]['Chi phí'] += t.amount;
                });
                const financialChart = Object.entries(monthlyFinances).map(([name, values]) => ({ name, ...values })).slice(-6); // Last 6 months
                setFinancialData(financialChart);
                
                // Process task status chart data
                const taskStatus = tasks.reduce((acc, task) => {
                    acc[task.status] = (acc[task.status] || 0) + 1;
                    return acc;
                }, {} as Record<Task['status'], number>);
                setTaskStatusData(Object.entries(taskStatus).map(([name, value]) => ({ name: translate(taskStatusMap, name), value })));

                // Process animal type data
                const animalTypes = animals.reduce((acc, animal) => {
                    acc[animal.animalType] = (acc[animal.animalType] || 0) + 1;
                    return acc;
                }, {} as Record<Animal['animalType'], number>);
                setAnimalTypeData(Object.entries(animalTypes).map(([name, value]) => ({ name: translate(animalTypeMap, name), value })));

                // Process inventory category data
                const inventoryCategories = inventory.reduce((acc, item) => {
                    acc[item.category] = (acc[item.category] || 0) + item.quantity;
                    return acc;
                }, {} as Record<string, number>);
                setInventoryCategoryData(Object.entries(inventoryCategories).map(([name, value]) => ({name, value})));

            } catch (error) {
                console.error("Failed to fetch dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [selectedFarm]);

    const chartColors = COLORS[theme];
    const tickColor = theme === 'dark' ? '#9ca3af' : '#6b7280';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div>
            </div>
        );
    }
     if (!selectedFarm) {
         return (
             <div className="p-4 text-center text-gray-500 bg-white dark:bg-gray-900 rounded-lg shadow-md">
                Vui lòng chọn một trang trại để xem bảng điều khiển.
            </div>
         );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <KPICard title="Tổng số vật nuôi" value={kpiData.totalAnimals} />
                <KPICard title="Vật nuôi khỏe mạnh" value={kpiData.healthyAnimals} subtext={`${kpiData.totalAnimals > 0 ? ((kpiData.healthyAnimals/kpiData.totalAnimals)*100).toFixed(1) : 0}%`} />
                <KPICard title="Công việc cần làm" value={kpiData.tasksTodo} />
                <KPICard title="Vật tư sắp hết" value={kpiData.lowStockItems} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4">Tổng quan tài chính (6 tháng gần nhất)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        {financialData.length > 0 ? (
                            <BarChart data={financialData}>
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                <XAxis dataKey="name" stroke={tickColor} />
                                <YAxis stroke={tickColor} tickFormatter={(value) => new Intl.NumberFormat('vi-VN').format(value as number)}/>
                                <Tooltip
                                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
                                    labelStyle={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
                                    formatter={(value) => new Intl.NumberFormat('vi-VN').format(value as number)}
                                />
                                <Legend />
                                <Bar dataKey="Doanh thu" fill={chartColors[4]} radius={[4, 4, 0, 0]} name="Doanh thu" />
                                <Bar dataKey="Chi phí" fill={chartColors[3]} radius={[4, 4, 0, 0]} name="Chi phí" />
                            </BarChart>
                        ) : <ChartPlaceholder message="Chưa có dữ liệu tài chính." />}
                    </ResponsiveContainer>
                </div>
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4">Trạng thái công việc</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        {taskStatusData.length > 0 ? (
                            <PieChart>
                                <Pie data={taskStatusData} cx="50%" cy="50%" labelLine={false} outerRadius={100} dataKey="value" nameKey="name">
                                    {taskStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}/>
                                <Legend />
                            </PieChart>
                        ) : <ChartPlaceholder message="Chưa có công việc nào." />}
                    </ResponsiveContainer>
                </div>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4">Phân bổ vật nuôi</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        {animalTypeData.length > 0 ? (
                            <PieChart>
                                <Pie data={animalTypeData} cx="50%" cy="50%" labelLine={false} outerRadius={100} dataKey="value" nameKey="name" >
                                    {animalTypeData.map((entry, index) => <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}/>
                                <Legend />
                            </PieChart>
                        ) : <ChartPlaceholder message="Chưa có vật nuôi nào." />}
                    </ResponsiveContainer>
                </div>
                <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
                    <h3 className="font-semibold text-lg mb-4">Hàng tồn kho theo loại</h3>
                     <ResponsiveContainer width="100%" height={300}>
                        {inventoryCategoryData.length > 0 ? (
                            <BarChart data={inventoryCategoryData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                                <XAxis type="number" stroke={tickColor} />
                                <YAxis type="category" dataKey="name" stroke={tickColor} width={80} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff', borderColor: theme === 'dark' ? '#374151' : '#e5e7eb' }}
                                    labelStyle={{ color: theme === 'dark' ? '#d1d5db' : '#374151' }}
                                />
                                <Bar dataKey="value" fill={chartColors[5]} radius={[0, 4, 4, 0]} name="Số lượng" />
                            </BarChart>
                        ) : <ChartPlaceholder message="Chưa có hàng tồn kho." />}
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardView;
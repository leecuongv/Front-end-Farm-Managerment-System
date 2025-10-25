import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import DashboardView from '../views/DashboardView';
import { ViewType, NAV_LINKS } from '../constants';
import LivestockView from '../views/LivestockView';

const PlaceholderView: React.FC<{ viewName: string }> = ({ viewName }) => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">{viewName}</h2>
        <p className="text-gray-600 dark:text-gray-400">
            Phần này đang được xây dựng. Chức năng cho {viewName.toLowerCase()} sẽ được triển khai tại đây.
        </p>
        <div className="mt-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg h-96 flex items-center justify-center">
            <p className="text-gray-400 dark:text-gray-500">Bảng dữ liệu {viewName.toLowerCase()} sắp ra mắt</p>
        </div>
    </div>
);

const InventoryView = () => <PlaceholderView viewName="Quản lý Kho" />;
const TasksView = () => <PlaceholderView viewName="Quản lý Công việc" />;
const FinanceView = () => <PlaceholderView viewName="Quản lý Tài chính" />;
const UserManagementView = () => <PlaceholderView viewName="Quản lý Người dùng" />;
const FarmManagementView = () => <PlaceholderView viewName="Quản lý Trang trại" />;

const MainLayout: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView />;
            case 'livestock':
                return <LivestockView />;
            case 'inventory':
                return <InventoryView />;
            case 'tasks':
                return <TasksView />;
            case 'finance':
                return <FinanceView />;
            case 'users':
                return <UserManagementView />;
            case 'farms':
                return <FarmManagementView />;
            default:
                return <DashboardView />;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
            <Sidebar 
                currentView={currentView} 
                setCurrentView={setCurrentView} 
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header currentView={currentView} setSidebarOpen={setSidebarOpen} />
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-gray-800 p-4 sm:p-6 lg:p-8">
                    {renderView()}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;
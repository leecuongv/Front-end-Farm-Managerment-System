
import React, { useState } from 'react';
import Header from './Header';
import DashboardView from '../views/DashboardView';
import { ViewType } from '../constants';
import LivestockView from '../views/LivestockView';
import UserManagementView from '../views/UserManagementView';
import FarmManagementView from '../views/FarmManagementView';
import CropsView from '../views/CropsView';
import EnclosuresView from '../views/EnclosuresView';
import FeedPlansView from '../views/FeedPlansView';
import InventoryView from '../views/InventoryView';
import TasksView from '../views/TasksView';
import MyTasksView from '../views/MyTasksView';
import FinanceView from '../views/FinanceView';
import BatchesView from '../views/BatchesView';
import PlotsView from '../views/PlotsView';
import SeasonsView from '../views/SeasonsView';
import ReportsView from '../views/ReportsView';
import NotificationContainer from './NotificationContainer';
import MobileSidebar from './MobileSidebar';


const MainLayout: React.FC = () => {
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const renderView = () => {
        switch (currentView) {
            case 'dashboard':
                return <DashboardView />;
            case 'livestock':
                return <LivestockView />;
            case 'plots':
                return <PlotsView />;
            case 'seasons':
                return <SeasonsView />;
            case 'crops':
                return <CropsView />;
            case 'enclosures':
                return <EnclosuresView />;
            case 'feed_plans':
                return <FeedPlansView />;
            case 'inventory':
                return <InventoryView />;
            case 'batches':
                return <BatchesView />;
            case 'tasks':
                return <TasksView />;
            case 'my_tasks':
                return <MyTasksView />;
            case 'finance':
                return <FinanceView />;
            case 'reports':
                return <ReportsView />;
            case 'users':
                return <UserManagementView />;
            case 'farms':
                return <FarmManagementView />;
            default:
                return <DashboardView />;
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
            <Header 
                currentView={currentView}
                setCurrentView={setCurrentView}
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />
            <MobileSidebar 
                isOpen={mobileMenuOpen} 
                onClose={() => setMobileMenuOpen(false)}
                currentView={currentView}
                setCurrentView={setCurrentView}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {renderView()}
            </main>
            <NotificationContainer />
        </div>
    );
};

export default MainLayout;

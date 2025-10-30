
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FarmProvider } from './contexts/FarmContext';
import { NotificationProvider } from './contexts/NotificationContext';
import MainLayout from './components/MainLayout';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import LivestockView from './views/LivestockView';
import UserManagementView from './views/UserManagementView';
import FarmManagementView from './views/FarmManagementView';
import CropsView from './views/CropsView';
import EnclosuresView from './views/EnclosuresView';
import FeedPlansView from './views/FeedPlansView';
import InventoryView from './views/InventoryView';
import TasksView from './views/TasksView';
import MyTasksView from './views/MyTasksView';
import FinanceView from './views/FinanceView';
import BatchesView from './views/BatchesView';
import PlotsView from './views/PlotsView';
import SeasonsView from './views/SeasonsView';
import ReportsView from './views/ReportsView';
import OAuth2RedirectHandler from './views/OAuth2RedirectHandler';

const AppContent = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div>
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={!user ? <LoginView /> : <Navigate to="/dashboard" replace />} />
            <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />
            
            <Route path="/" element={user ? <FarmProvider><MainLayout /></FarmProvider> : <Navigate to="/login" replace />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardView />} />
                <Route path="livestock" element={<LivestockView />} />
                <Route path="plots" element={<PlotsView />} />
                <Route path="seasons" element={<SeasonsView />} />
                <Route path="crops" element={<CropsView />} />
                <Route path="enclosures" element={<EnclosuresView />} />
                <Route path="feed_plans" element={<FeedPlansView />} />
                <Route path="inventory" element={<InventoryView />} />
                <Route path="batches" element={<BatchesView />} />
                <Route path="tasks" element={<TasksView />} />
                <Route path="my_tasks" element={<MyTasksView />} />
                <Route path="finance" element={<FinanceView />} />
                <Route path="reports" element={<ReportsView />} />
                <Route path="users" element={<UserManagementView />} />
                <Route path="farms" element={<FarmManagementView />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
        </Routes>
    );
};

const App = () => {
  return (
    <ThemeProvider>
        <AuthProvider>
            <NotificationProvider>
                <BrowserRouter>
                    <AppContent />
                </BrowserRouter>
            </NotificationProvider>
        </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
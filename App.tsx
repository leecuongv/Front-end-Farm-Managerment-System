
import React from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { FarmProvider } from './contexts/FarmContext';
import { NotificationProvider } from './contexts/NotificationContext';
import MainLayout from './components/MainLayout';
import LoginView from './views/LoginView';

const AppContent = () => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div>
            </div>
        );
    }

    if (!user) {
        return <LoginView />;
    }

    return (
        <FarmProvider>
            <MainLayout />
        </FarmProvider>
    );
};

const App = () => {
  return (
    <ThemeProvider>
        <AuthProvider>
            <NotificationProvider>
                <AppContent />
            </NotificationProvider>
        </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
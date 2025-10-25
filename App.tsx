
import React from 'react';
// Fix: Removed useTheme as it was unused.
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import MainLayout from './components/MainLayout';
import LoginView from './views/LoginView';

// Fix: Removed React.FC type to avoid potential issues with children prop typing.
const AppContent = () => {
    const { user } = useAuth();

    if (!user) {
        return <LoginView />;
    }

    return <MainLayout />;
};


// Fix: Removed React.FC type to avoid potential issues with children prop typing.
const App = () => {
  return (
    <ThemeProvider>
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

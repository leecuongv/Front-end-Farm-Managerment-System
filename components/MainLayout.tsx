
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import NotificationContainer from './NotificationContainer';
import MobileSidebar from './MobileSidebar';


const MainLayout: React.FC = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <div className="flex flex-col h-screen bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
            <Header 
                mobileMenuOpen={mobileMenuOpen}
                setMobileMenuOpen={setMobileMenuOpen}
            />
            <MobileSidebar 
                isOpen={mobileMenuOpen} 
                onClose={() => setMobileMenuOpen(false)}
            />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                <Outlet />
            </main>
            <NotificationContainer />
        </div>
    );
};

export default MainLayout;

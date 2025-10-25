
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NAV_LINKS, ViewType } from '../constants';
import { Role } from '../types';

interface SidebarProps {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, sidebarOpen, setSidebarOpen }) => {
    const { user } = useAuth();
    
    const handleNavigation = (view: ViewType) => {
        setCurrentView(view);
        setSidebarOpen(false);
    }

    const filteredNavLinks = NAV_LINKS.filter(link => 
        user && (user.role === Role.ADMIN || link.roles.includes(user.role))
    );

    return (
        <>
            <div className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                 onClick={() => setSidebarOpen(false)}>
            </div>
            <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-950 border-r border-gray-200 dark:border-gray-800 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:flex-shrink-0`}>
                <div className="flex items-center justify-center h-20 border-b border-gray-200 dark:border-gray-800">
                    <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">FarmSys</h1>
                </div>
                <nav className="mt-6">
                    {filteredNavLinks.map(link => (
                        <a
                            key={link.name}
                            href="#"
                            onClick={(e) => { e.preventDefault(); handleNavigation(link.href as ViewType); }}
                            className={`flex items-center px-6 py-3 text-base font-medium transition-colors duration-150 ${
                                currentView === link.href
                                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-gray-900 border-l-4 border-primary-500'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        >
                            <link.icon className="w-6 h-6 mr-4" />
                            <span>{link.name}</span>
                        </a>
                    ))}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;

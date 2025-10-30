
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { SunIcon, MoonIcon, LogoutIcon, FarmIcon } from '../constants';
import { useFarm } from '../contexts/FarmContext';
import NavLinks from './NavLinks';


interface HeaderProps {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ mobileMenuOpen, setMobileMenuOpen }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { userFarms, selectedFarm, selectFarm, isLoading: isFarmsLoading } = useFarm();

    const [profileOpen, setProfileOpen] = useState(false);
    const [farmMenuOpen, setFarmMenuOpen] = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);
    const farmRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileOpen(false);
            }
            if (farmRef.current && !farmRef.current.contains(event.target as Node)) {
                setFarmMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <header className="relative bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 flex-shrink-0 z-20">
            <div className="flex items-center justify-between h-20 px-4 sm:px-6">
                <div className="flex items-center">
                    <button
                        className="text-gray-500 dark:text-gray-400 focus:outline-none lg:hidden mr-4"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4 6H20M4 12H20M4 18H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold text-primary-600 dark:text-primary-400">FarmSys</h1>
                     {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center ml-10 overflow-x-auto">
                        <NavLinks className="flex items-center space-x-1"/>
                    </div>
                </div>

                <div className="flex items-center space-x-3 sm:space-x-5">
                    {user && userFarms.length > 0 && (
                        <div className="relative" ref={farmRef}>
                            <button onClick={() => setFarmMenuOpen(!farmMenuOpen)} className="flex items-center p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                                <FarmIcon className="w-5 h-5 text-primary-500 mr-2" />
                                <span className="text-sm font-medium hidden md:block">
                                    {isFarmsLoading ? 'Đang tải...' : (selectedFarm?.name || 'Chọn trang trại')}
                                </span>
                                <svg className="w-4 h-4 ml-1 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </button>
                            {farmMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20">
                                    {userFarms.map(farm => (
                                        <a href="#" key={farm.id} onClick={(e) => { e.preventDefault(); selectFarm(farm.id); setFarmMenuOpen(false); }} className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                            {farm.name}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none">
                        {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
                    </button>
                    <div className="relative" ref={profileRef}>
                        <button onClick={() => setProfileOpen(!profileOpen)} className="focus:outline-none">
                            <img className="h-10 w-10 rounded-full object-cover" src={user?.avatarUrl} alt="User avatar" />
                        </button>
                        {profileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20">
                                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{user?.fullName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                                </div>
                                <a href="#" onClick={(e) => { e.preventDefault(); logout(); }} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                    <LogoutIcon className="w-5 h-5 mr-2" />
                                    Đăng xuất
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

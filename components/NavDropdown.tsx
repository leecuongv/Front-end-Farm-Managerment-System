
import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavLink, NavGroup } from '../types';
import { ChevronDownIcon } from '../constants';

interface NavDropdownProps {
    item: NavGroup;
    childLinks: NavLink[];
    onLinkClick?: () => void;
}

const NavDropdown: React.FC<NavDropdownProps> = ({ item, childLinks, onLinkClick }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    const isActive = childLinks.some(child => location.pathname === child.href);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDropdownToggle = () => setIsOpen(prev => !prev);
    const handleLinkClick = () => {
        setIsOpen(false);
        if (onLinkClick) onLinkClick();
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleDropdownToggle}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive
                    ? 'bg-primary-50 text-primary-600 dark:bg-gray-800 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                    }`}
            >
                <span>{item.name}</span>
                <ChevronDownIcon className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-30">
                    {childLinks.map(child => (
                        <Link
                            key={child.name}
                            to={child.href}
                            onClick={handleLinkClick}
                            className={`flex items-center w-full px-4 py-2 text-sm ${location.pathname === child.href ? 'text-primary-600 dark:text-primary-400' : 'text-gray-700 dark:text-gray-200'} hover:bg-gray-100 dark:hover:bg-gray-700`}
                        >
                            <child.icon className="w-5 h-5 mr-3" />
                            {child.name}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NavDropdown;
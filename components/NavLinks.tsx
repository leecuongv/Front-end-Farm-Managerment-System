
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NAV_LINKS, ViewType } from '../constants';
import { Role } from '../types';

interface NavLinksProps {
    currentView: ViewType;
    onLinkClick: (view: ViewType) => void;
    className?: string;
}

const NavLinks: React.FC<NavLinksProps> = ({ currentView, onLinkClick, className }) => {
    const { user } = useAuth();
    const filteredNavLinks = NAV_LINKS.filter(link =>
        user && (user.role === Role.ADMIN || link.roles.includes(user.role))
    );

    return (
        <nav className={className}>
            {filteredNavLinks.map(link => (
                <a
                    key={link.name}
                    href="#"
                    onClick={(e) => { e.preventDefault(); onLinkClick(link.href as ViewType); }}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${currentView === link.href
                        ? 'bg-primary-50 text-primary-600 dark:bg-gray-800 dark:text-primary-400'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                        }`}
                >
                    <link.icon className="w-5 h-5 mr-3" />
                    <span>{link.name}</span>
                </a>
            ))}
        </nav>
    );
};

export default NavLinks;

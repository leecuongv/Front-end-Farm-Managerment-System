
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NAV_LINKS } from '../constants';
import { Role } from '../types';

interface NavLinksProps {
    className?: string;
    onLinkClick?: () => void;
}

const NavLinks: React.FC<NavLinksProps> = ({ className, onLinkClick }) => {
    const { user } = useAuth();
    const location = useLocation();

    const filteredNavLinks = NAV_LINKS.filter(link =>
        user && (user.role === Role.ADMIN || link.roles.includes(user.role))
    );

    return (
        <nav className={className}>
            {filteredNavLinks.map(link => {
                const to = `/${link.href}`;
                const isActive = location.pathname === to;
                return (
                    <Link
                        key={link.name}
                        to={to}
                        onClick={onLinkClick}
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive
                            ? 'bg-primary-50 text-primary-600 dark:bg-gray-800 dark:text-primary-400'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                            }`}
                    >
                        <link.icon className="w-5 h-5 mr-3" />
                        <span>{link.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default NavLinks;

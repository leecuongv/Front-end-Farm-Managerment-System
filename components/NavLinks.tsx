import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { NAV_MENU } from '../constants';
import { Role } from '../types';
import NavDropdown from './NavDropdown';

interface NavLinksProps {
    className?: string;
    onLinkClick?: () => void;
    isMobile?: boolean;
}

const NavLinks: React.FC<NavLinksProps> = ({ className, onLinkClick, isMobile = false }) => {
    const { user } = useAuth();
    const location = useLocation();

    const hasAccess = (roles: Role[]) => user && (user.role === Role.ADMIN || roles.includes(user.role));

    if (!user) return null;

    const filteredNavMenu = NAV_MENU.filter(item => hasAccess(item.roles));

    if (isMobile) {
        return (
             <nav className={className}>
                {filteredNavMenu.map((item, index) => (
                    <div key={item.name + index}>
                        {'children' in item ? (
                            <div className="pt-4 pb-2 px-2">
                                <h3 className="text-xs font-semibold uppercase text-gray-400 tracking-wider">{item.name}</h3>
                            </div>
                        ) : (
                             <Link
                                to={item.href}
                                onClick={onLinkClick}
                                className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-150 ${location.pathname === item.href
                                    ? 'bg-primary-50 text-primary-600 dark:bg-gray-800 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <item.icon className="w-6 h-6 mr-3" />
                                <span>{item.name}</span>
                            </Link>
                        )}
                        {'children' in item && item.children.filter(child => hasAccess(child.roles)).map(child => (
                             <Link
                                key={child.name}
                                to={child.href}
                                onClick={onLinkClick}
                                className={`flex items-center py-2 pl-8 pr-3 rounded-md text-base font-medium transition-colors duration-150 ${location.pathname === child.href
                                    ? 'text-primary-600 dark:text-primary-400'
                                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <child.icon className="w-5 h-5 mr-3" />
                                <span>{child.name}</span>
                            </Link>
                        ))}
                    </div>
                ))}
            </nav>
        )
    }

    return (
        <nav className={className}>
            {filteredNavMenu.map(item => {
                if ('children' in item) {
                    const childLinks = item.children.filter(child => hasAccess(child.roles));
                    if (childLinks.length === 0) return null;
                    return <NavDropdown key={item.name} item={item} childLinks={childLinks} onLinkClick={onLinkClick} />
                }
                
                const isActive = location.pathname === item.href;
                return (
                    <Link
                        key={item.name}
                        to={item.href}
                        onClick={onLinkClick}
                        className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${isActive
                            ? 'bg-primary-50 text-primary-600 dark:bg-gray-800 dark:text-primary-400'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-gray-100'
                            }`}
                    >
                        <item.icon className="w-5 h-5 mr-2" />
                        <span>{item.name}</span>
                    </Link>
                );
            })}
        </nav>
    );
};

export default NavLinks;
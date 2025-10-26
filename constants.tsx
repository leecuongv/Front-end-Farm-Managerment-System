import React from 'react';
import { Role } from './types';

export const SunIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
    </svg>
);

export const MoonIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
);

export const DashboardIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
);

export const LivestockIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 16.427A5.002 5.002 0 0 0 12.002 12m-4 4.427A5.002 5.002 0 0 1 11.998 12"/>
      <path d="M12 2c-3.5 0-6.2 3.8-6.2 6.5 0 2.2 1.3 3.8 2.2 4.8a.7.7 0 0 0 1.1 0c.9-1 2.2-2.6 2.2-4.8C11.3 5.8 9 2 5.5 2"/>
      <path d="M12 2c3.5 0 6.2 3.8 6.2 6.5 0 2.2-1.3 3.8-2.2 4.8a.7.7 0 0 1-1.1 0c-.9-1-2.2-2.6-2.2-4.8C12.7 5.8 15 2 18.5 2"/>
      <path d="M6 18c-1.5 0-2.8.9-3.2 2"/>
      <path d="M18 18c1.5 0 2.8.9 3.2 2"/>
      <path d="M12 12v2.5"/>
      <path d="M11.2 18.2c-.4.8-.4 1.8 0 2.6"/>
      <path d="M12.8 18.2c.4.8.4 1.8 0 2.6"/>
    </svg>
);

export const InventoryIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" />
    </svg>
);

export const TasksIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="m10.5 16.5 2 2 4-4" /><path d="m10.5 10.5 2 2 4-4" />
    </svg>
);

export const FinanceIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" /><path d="M8 12h8" /><path d="M12 16V8" />
    </svg>
);

export const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export const LogoutIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" />
    </svg>
);

export const FarmIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M11 20H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14v2"/>
      <path d="M11 20v-8h4v8"/>
      <path d="M11 12V4"/>
      <path d="M15 12V4"/>
      <path d="M20 15c-1.5 0-2.7 1.2-3 2.5a2.5 2.5 0 0 0 5 1.5c0-1.4-1.1-2.5-2.5-2.5z"/>
    </svg>
);

export const CropsIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M7 20-4-4c0-4 4-8 8-8s8 4 8 8c0 4-4 8-8 8H7Z"/>
        <path d="M14 14c0 2 2 4 4 4s4-2 4-4-2-4-4-4-4 2-4 4Z"/>
    </svg>
);

export const EnclosuresIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2 6h20" />
        <path d="M2 12h20" />
        <path d="M2 18h20" />
        <path d="M6 2v20" />
        <path d="M12 2v20" />
        <path d="M18 2v20" />
    </svg>
);

export const FeedPlansIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
        <path d="m9 12 2 2 4-4"/>
    </svg>
);

export const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
    </svg>
);

export const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>
    </svg>
);


export const NAV_LINKS = [
    { name: 'Bảng điều khiển', href: 'dashboard', icon: DashboardIcon, roles: [Role.ADMIN, Role.MANAGER, Role.STAFF] },
    { name: 'Vật nuôi', href: 'livestock', icon: LivestockIcon, roles: [Role.MANAGER, Role.STAFF] },
    { name: 'Sự kiện Mùa vụ', href: 'crops', icon: CropsIcon, roles: [Role.MANAGER, Role.STAFF] },
    { name: 'Chuồng trại', href: 'enclosures', icon: EnclosuresIcon, roles: [Role.MANAGER, Role.STAFF] },
    { name: 'Kế hoạch ăn', href: 'feed_plans', icon: FeedPlansIcon, roles: [Role.MANAGER, Role.STAFF] },
    { name: 'Kho', href: 'inventory', icon: InventoryIcon, roles: [Role.MANAGER, Role.STAFF] },
    { name: 'Công việc', href: 'tasks', icon: TasksIcon, roles: [Role.MANAGER, Role.STAFF] },
    { name: 'Tài chính', href: 'finance', icon: FinanceIcon, roles: [Role.ADMIN, Role.MANAGER] },
    { name: 'Quản lý người dùng', href: 'users', icon: UsersIcon, roles: [Role.ADMIN] },
    { name: 'Quản lý trang trại', href: 'farms', icon: FarmIcon, roles: [Role.ADMIN] },
];

export type ViewType = 'dashboard' | 'livestock' | 'crops' | 'enclosures' | 'feed_plans' | 'inventory' | 'tasks' | 'finance' | 'users' | 'farms';
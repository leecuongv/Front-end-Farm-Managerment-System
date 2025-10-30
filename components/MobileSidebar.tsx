
import React from 'react';
import NavLinks from './NavLinks';

interface MobileSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
    return (
        <>
            {/* Overlay */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-60 z-30 transition-opacity duration-300 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar */}
            <aside
                className={`fixed top-0 right-0 h-full w-4/5 max-w-xs bg-white dark:bg-gray-950 shadow-xl z-40 transform transition-transform duration-300 ease-in-out lg:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
                        <h2 className="text-xl font-bold text-primary-600 dark:text-primary-400">FarmSys</h2>
                        <button onClick={onClose} className="p-2 text-gray-500 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800">
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        <NavLinks
                            onLinkClick={onClose}
                            className="flex flex-col p-2 space-y-1"
                        />
                    </div>
                </div>
            </aside>
        </>
    );
};

export default MobileSidebar;

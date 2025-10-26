
import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import Notification from './Notification';

const NotificationContainer: React.FC = () => {
    const { notifications } = useNotification();

    return (
        <div
            aria-live="assertive"
            className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50"
        >
            <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
                {notifications.map(notification => (
                    <Notification key={notification.id} notification={notification} />
                ))}
            </div>
        </div>
    );
};

export default NotificationContainer;

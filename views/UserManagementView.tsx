import React from 'react';

const UserManagementView: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Quản lý Người dùng</h2>
            <p className="text-gray-600 dark:text-gray-400">
                Chức năng quản lý người dùng đang được phát triển và sẽ sớm có mặt tại đây.
            </p>
            <div className="mt-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg h-96 flex items-center justify-center">
                <p className="text-gray-400 dark:text-gray-500">Bảng dữ liệu người dùng</p>
            </div>
        </div>
    );
};

export default UserManagementView;

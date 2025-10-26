
import React from 'react';
import Modal from './Modal';

interface ConfirmationModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ title, message, onConfirm, onCancel }) => {
    return (
        <Modal title={title} onClose={onCancel}>
            <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">{message}</p>
                <div className="flex justify-end space-x-3 pt-4">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:outline-none"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none"
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmationModal;

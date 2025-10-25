import React, { useState, useEffect, useCallback } from 'react';
import { Farm } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { EditIcon, TrashIcon } from '../constants';
import Modal from '../components/Modal';
import apiClient from '../apiClient';

const initialFarmState: Omit<Farm, 'id'> = {
    name: '',
    location: '',
};

const FarmManagementView: React.FC = () => {
    const { farms, isLoading: isLoadingFarms, refetchFarms } = useFarm();
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFarm, setEditingFarm] = useState<Farm | Omit<Farm, 'id'> | null>(null);
    
    const handleOpenModal = (farm: Farm | null = null) => {
        setEditingFarm(farm || initialFarmState);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFarm(null);
    };

    const handleSaveFarm = async (farmData: Farm | Omit<Farm, 'id'>) => {
        const isEditing = 'id' in farmData;
        const endpoint = isEditing ? `/farms/${farmData.id}` : `/farms`;
        const method = isEditing ? 'PUT' : 'POST';

        try {
            await apiClient(endpoint, {
                method,
                body: JSON.stringify(farmData),
            });
            handleCloseModal();
            refetchFarms();
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleDeleteFarm = async (farmId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa trang trại này không? Việc này có thể ảnh hưởng đến dữ liệu liên quan.')) {
            try {
                await apiClient(`/farms/${farmId}`, { method: 'DELETE' });
                refetchFarms();
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    if (isLoadingFarms) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Quản lý Trang trại</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                    Thêm trang trại
                </button>
            </div>
            
             {error && <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg">{error}</div>}

            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên trang trại</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vị trí</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {farms.length > 0 ? farms.map((farm) => (
                                <tr key={farm.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{farm.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{farm.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleOpenModal(farm)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteFarm(farm.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        Không tìm thấy trang trại nào.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && editingFarm && (
                <Modal 
                    title={'id' in editingFarm ? 'Sửa thông tin trang trại' : 'Thêm trang trại mới'} 
                    onClose={handleCloseModal}
                >
                    <FarmForm 
                        farm={editingFarm} 
                        onSave={handleSaveFarm} 
                        onCancel={handleCloseModal} 
                    />
                </Modal>
            )}
        </div>
    );
};


interface FarmFormProps {
    farm: Farm | Omit<Farm, 'id'>;
    onSave: (farm: Farm | Omit<Farm, 'id'>) => void;
    onCancel: () => void;
}

const FarmForm: React.FC<FarmFormProps> = ({ farm, onSave, onCancel }) => {
    const [formData, setFormData] = useState(farm);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên trang trại</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
            </div>
            <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vị trí</label>
                <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
            </div>
        </form>
    );
};

export default FarmManagementView;
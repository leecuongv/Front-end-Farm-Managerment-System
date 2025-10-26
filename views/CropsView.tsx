import React, { useState, useEffect, useCallback } from 'react';
import { Crop } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { EditIcon, TrashIcon } from '../constants';
import Modal from '../components/Modal';
import apiClient from '../apiClient';

const CROP_STATUSES = ['PLANTED', 'GROWING', 'HARVESTED', 'FAILED'];

const initialCropState: Omit<Crop, 'id'> = {
    farmId: '',
    name: '',
    plantingDate: new Date().toISOString().split('T')[0],
    expectedHarvestDate: new Date().toISOString().split('T')[0],
    status: 'PLANTED',
    area: 0,
};

const CropsView: React.FC = () => {
    const [crops, setCrops] = useState<Crop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCrop, setEditingCrop] = useState<Crop | Omit<Crop, 'id'> | null>(null);
    
    const { selectedFarm } = useFarm();

    const fetchCrops = useCallback(async () => {
        if (!selectedFarm) {
            setCrops([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient<Crop[]>(`/crops?farmId=${selectedFarm.id}`);
            setCrops(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm]);

    useEffect(() => {
        fetchCrops();
    }, [fetchCrops]);

    const handleOpenModal = (crop: Crop | null = null) => {
        if (crop) {
            setEditingCrop({ 
                ...crop, 
                plantingDate: new Date(crop.plantingDate).toISOString().split('T')[0],
                expectedHarvestDate: new Date(crop.expectedHarvestDate).toISOString().split('T')[0],
            });
        } else {
            setEditingCrop({ ...initialCropState, farmId: selectedFarm?.id || '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCrop(null);
    };

    const handleSaveCrop = async (cropData: Crop | Omit<Crop, 'id'>) => {
        const isEditing = 'id' in cropData;
        const endpoint = isEditing ? `/crops/${cropData.id}` : `/crops`;
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            await apiClient(endpoint, {
                method,
                body: JSON.stringify(cropData),
            });
            handleCloseModal();
            fetchCrops();
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleDeleteCrop = async (cropId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa mùa vụ này không?')) {
            try {
                await apiClient(`/crops/${cropId}`, { method: 'DELETE' });
                fetchCrops();
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div>
            </div>
        );
    }
    
    if (!selectedFarm) {
         return (
             <div className="p-4 text-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">
                Vui lòng chọn một trang trại để xem mùa vụ.
            </div>
         );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Quản lý Mùa vụ</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                    Thêm mùa vụ
                </button>
            </div>
            
             {error && <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg">{error}</div>}

            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên mùa vụ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trạng thái</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngày trồng</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngày thu hoạch dự kiến</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Diện tích (m²)</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {crops.length > 0 ? crops.map((crop) => (
                                <tr key={crop.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{crop.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">{crop.status}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(crop.plantingDate).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(crop.expectedHarvestDate).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{crop.area}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleOpenModal(crop)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteCrop(crop.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        Không tìm thấy mùa vụ nào cho trang trại này.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && editingCrop && (
                <Modal 
                    title={ 'id' in editingCrop ? 'Sửa thông tin mùa vụ' : 'Thêm mùa vụ mới'} 
                    onClose={handleCloseModal}
                >
                    <CropForm 
                        crop={editingCrop} 
                        onSave={handleSaveCrop} 
                        onCancel={handleCloseModal} 
                    />
                </Modal>
            )}
        </div>
    );
};

interface CropFormProps {
    crop: Crop | Omit<Crop, 'id'>;
    onSave: (crop: Crop | Omit<Crop, 'id'>) => void;
    onCancel: () => void;
}

const CropForm: React.FC<CropFormProps> = ({ crop, onSave, onCancel }) => {
    const [formData, setFormData] = useState(crop);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseFloat(value) : value 
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên mùa vụ</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái</label>
                    <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        {CROP_STATUSES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="plantingDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày trồng</label>
                    <input type="date" name="plantingDate" id="plantingDate" value={formData.plantingDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                 <div>
                    <label htmlFor="expectedHarvestDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày thu hoạch dự kiến</label>
                    <input type="date" name="expectedHarvestDate" id="expectedHarvestDate" value={formData.expectedHarvestDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="area" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Diện tích (m²)</label>
                    <input type="number" name="area" id="area" value={formData.area} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
            </div>
        </form>
    );
};

export default CropsView;

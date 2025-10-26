import React, { useState, useEffect, useCallback } from 'react';
import { Enclosure } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { EditIcon, TrashIcon } from '../constants';
import Modal from '../components/Modal';
import apiClient from '../apiClient';

const ENCLOSURE_TYPES = ['BREEDING_PEN', 'DEVELOPMENT_PEN', 'FATTENING_PEN', 'YOUNG_PEN'];

const initialEnclosureState: Omit<Enclosure, 'id' | 'currentOccupancy'> = {
    farmId: '',
    name: '',
    type: 'YOUNG_PEN',
    capacity: 0,
};

const EnclosuresView: React.FC = () => {
    const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEnclosure, setEditingEnclosure] = useState<Enclosure | Omit<Enclosure, 'id' | 'currentOccupancy'> | null>(null);
    
    const { selectedFarm } = useFarm();

    const fetchEnclosures = useCallback(async () => {
        if (!selectedFarm) {
            setEnclosures([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient<Enclosure[]>(`/enclosures?farmId=${selectedFarm.id}`);
            setEnclosures(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm]);

    useEffect(() => {
        fetchEnclosures();
    }, [fetchEnclosures]);

    const handleOpenModal = (enclosure: Enclosure | null = null) => {
        setEditingEnclosure(enclosure || { ...initialEnclosureState, farmId: selectedFarm?.id || ''});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEnclosure(null);
    };

    const handleSaveEnclosure = async (enclosureData: Enclosure | Omit<Enclosure, 'id' | 'currentOccupancy'>) => {
        const isEditing = 'id' in enclosureData;
        const endpoint = isEditing ? `/enclosures/${enclosureData.id}` : `/enclosures`;
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            await apiClient(endpoint, {
                method,
                body: JSON.stringify(enclosureData),
            });
            handleCloseModal();
            fetchEnclosures();
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleDeleteEnclosure = async (enclosureId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa chuồng trại này không?')) {
            try {
                await apiClient(`/enclosures/${enclosureId}`, { method: 'DELETE' });
                fetchEnclosures();
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
                Vui lòng chọn một trang trại để xem chuồng trại.
            </div>
         );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Quản lý Chuồng trại</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                    Thêm chuồng trại
                </button>
            </div>
            
             {error && <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg">{error}</div>}

            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên chuồng</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Loại</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Số lượng / Sức chứa</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {enclosures.length > 0 ? enclosures.map((enclosure) => (
                                <tr key={enclosure.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{enclosure.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{enclosure.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{enclosure.currentOccupancy} / {enclosure.capacity}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleOpenModal(enclosure)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteEnclosure(enclosure.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        Không tìm thấy chuồng trại nào cho trang trại này.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && editingEnclosure && (
                <Modal 
                    title={ 'id' in editingEnclosure ? 'Sửa thông tin chuồng trại' : 'Thêm chuồng trại mới'} 
                    onClose={handleCloseModal}
                >
                    <EnclosureForm 
                        enclosure={editingEnclosure} 
                        onSave={handleSaveEnclosure} 
                        onCancel={handleCloseModal} 
                    />
                </Modal>
            )}
        </div>
    );
};

interface EnclosureFormProps {
    enclosure: Enclosure | Omit<Enclosure, 'id' | 'currentOccupancy'>;
    onSave: (enclosure: Enclosure | Omit<Enclosure, 'id' | 'currentOccupancy'>) => void;
    onCancel: () => void;
}

const EnclosureForm: React.FC<EnclosureFormProps> = ({ enclosure, onSave, onCancel }) => {
    const [formData, setFormData] = useState(enclosure);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? parseInt(value, 10) : value 
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
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên chuồng</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                 <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sức chứa</label>
                    <input type="number" name="capacity" id="capacity" value={formData.capacity} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loại chuồng</label>
                    <select name="type" id="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        {ENCLOSURE_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
            </div>
        </form>
    );
};

export default EnclosuresView;

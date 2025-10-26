import React, { useState, useEffect, useCallback } from 'react';
import { Crop, CropEvent } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { EditIcon, TrashIcon } from '../constants';
import Modal from '../components/Modal';
import apiClient from '../apiClient';

const CROP_EVENT_TYPES = ['PLANTING', 'FERTILIZING', 'PEST_CONTROL', 'HARVESTING', 'OTHER'];

const initialCropEventState: Omit<CropEvent, 'id'> = {
    farmId: '',
    name: '',
    eventType: 'PLANTING',
    eventDate: new Date().toISOString().split('T')[0],
    description: '',
    area: 0,
    relatedCropId: '',
};

const CropsView: React.FC = () => {
    const [cropEvents, setCropEvents] = useState<CropEvent[]>([]);
    const [crops, setCrops] = useState<Crop[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCropEvent, setEditingCropEvent] = useState<CropEvent | Omit<CropEvent, 'id'> | null>(null);
    
    const { selectedFarm } = useFarm();

    const fetchCropEventsAndCrops = useCallback(async () => {
        if (!selectedFarm) {
            setCropEvents([]);
            setCrops([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [eventsData, cropsData] = await Promise.all([
                apiClient<CropEvent[]>(`/crop-events?farmId=${selectedFarm.id}`),
                apiClient<Crop[]>(`/crops?farmId=${selectedFarm.id}`)
            ]);
            setCropEvents(eventsData);
            setCrops(cropsData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm]);

    useEffect(() => {
        fetchCropEventsAndCrops();
    }, [fetchCropEventsAndCrops]);

    const handleOpenModal = (event: CropEvent | null = null) => {
        if (event) {
            setEditingCropEvent({ 
                ...event, 
                eventDate: new Date(event.eventDate).toISOString().split('T')[0],
            });
        } else {
            setEditingCropEvent({ 
                ...initialCropEventState, 
                farmId: selectedFarm?.id || '', 
                relatedCropId: crops.length > 0 ? crops[0].id : '' 
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCropEvent(null);
    };

    const handleSaveCropEvent = async (eventData: CropEvent | Omit<CropEvent, 'id'>) => {
        const isEditing = 'id' in eventData;
        const endpoint = isEditing ? `/crop-events/${eventData.id}` : `/crop-events`;
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            await apiClient(endpoint, {
                method,
                body: JSON.stringify(eventData),
            });
            handleCloseModal();
            fetchCropEventsAndCrops();
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleDeleteCropEvent = async (eventId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa sự kiện mùa vụ này không?')) {
            try {
                await apiClient(`/crop-events/${eventId}`, { method: 'DELETE' });
                fetchCropEventsAndCrops();
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    const getCropNameById = (cropId: string) => {
        return crops.find(c => c.id === cropId)?.name || 'N/A';
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
                Vui lòng chọn một trang trại để xem sự kiện mùa vụ.
            </div>
         );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Quản lý Sự kiện Mùa vụ</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                    Thêm sự kiện
                </button>
            </div>
            
             {error && <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg">{error}</div>}

            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên sự kiện</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Loại</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngày diễn ra</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mùa vụ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Diện tích (m²)</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {cropEvents.length > 0 ? cropEvents.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{event.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{event.eventType}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(event.eventDate).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getCropNameById(event.relatedCropId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{event.area}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleOpenModal(event)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteCropEvent(event.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        Không tìm thấy sự kiện nào cho trang trại này.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && editingCropEvent && (
                <Modal 
                    title={ 'id' in editingCropEvent ? 'Sửa thông tin sự kiện' : 'Thêm sự kiện mới'} 
                    onClose={handleCloseModal}
                >
                    <CropEventForm 
                        event={editingCropEvent}
                        crops={crops}
                        onSave={handleSaveCropEvent} 
                        onCancel={handleCloseModal} 
                    />
                </Modal>
            )}
        </div>
    );
};

interface CropEventFormProps {
    event: CropEvent | Omit<CropEvent, 'id'>;
    crops: Crop[];
    onSave: (event: CropEvent | Omit<CropEvent, 'id'>) => void;
    onCancel: () => void;
}

const CropEventForm: React.FC<CropEventFormProps> = ({ event, crops, onSave, onCancel }) => {
    const [formData, setFormData] = useState(event);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const isNumber = type === 'number';
        setFormData(prev => ({ 
            ...prev, 
            [name]: isNumber ? parseFloat(value) : value 
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
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên sự kiện</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                 <div>
                    <label htmlFor="relatedCropId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mùa vụ liên quan</label>
                    <select name="relatedCropId" id="relatedCropId" value={formData.relatedCropId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        {crops.length > 0 ? crops.map(c => <option key={c.id} value={c.id}>{c.name}</option>) : <option disabled>Không có mùa vụ nào</option>}
                    </select>
                </div>
                <div>
                    <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loại sự kiện</label>
                    <select name="eventType" id="eventType" value={formData.eventType} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        {CROP_EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="eventDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày diễn ra</label>
                    <input type="date" name="eventDate" id="eventDate" value={formData.eventDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="area" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Diện tích (m²)</label>
                    <input type="number" name="area" id="area" value={formData.area} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
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
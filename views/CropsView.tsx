
import React, { useState, useEffect, useCallback } from 'react';
import { CropEvent, Plot, Season } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { useNotification } from '../contexts/NotificationContext';
import { EditIcon, TrashIcon } from '../constants';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import apiClient from '../apiClient';

const initialCropEventState: Omit<CropEvent, 'id' | 'recordedBy'> = {
    farmId: '',
    plotId: '',
    seasonId: '',
    eventType: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
};

const CropsView: React.FC = () => {
    const [cropEvents, setCropEvents] = useState<CropEvent[]>([]);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCropEvent, setEditingCropEvent] = useState<CropEvent | Omit<CropEvent, 'id' | 'recordedBy'> | null>(null);
    const [eventToDelete, setEventToDelete] = useState<CropEvent | null>(null);

    const { selectedFarm } = useFarm();
    const { addNotification } = useNotification();

    const fetchData = useCallback(async () => {
        if (!selectedFarm) {
            setCropEvents([]);
            setPlots([]);
            setSeasons([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [eventsData, plotsData, seasonsData] = await Promise.all([
                apiClient<CropEvent[]>(`/crop-events?farmId=${selectedFarm.id}`),
                apiClient<Plot[]>(`/plots?farmId=${selectedFarm.id}`),
                apiClient<Season[]>(`/seasons?farmId=${selectedFarm.id}`)
            ]);
            setCropEvents(eventsData);
            setPlots(plotsData);
            setSeasons(seasonsData);
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm, addNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleOpenModal = (event: CropEvent | null = null) => {
        if (event) {
            setEditingCropEvent({ 
                ...event, 
                date: new Date(event.date).toISOString().split('T')[0],
            });
        } else {
            setEditingCropEvent({ 
                ...initialCropEventState, 
                farmId: selectedFarm?.id || '', 
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCropEvent(null);
    };

    const handleSaveCropEvent = async (eventData: CropEvent | Omit<CropEvent, 'id' | 'recordedBy'>) => {
        const isEditing = 'id' in eventData;
        const endpoint = isEditing ? `/crop-events/${eventData.id}` : `/crop-events`;
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            await apiClient(endpoint, {
                method,
                body: JSON.stringify(eventData),
            });
            addNotification(`Sự kiện mùa vụ đã được ${isEditing ? 'cập nhật' : 'tạo'} thành công.`, 'success');
            handleCloseModal();
            fetchData();
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };
    
    const handleDeleteCropEvent = async () => {
        if (!eventToDelete) return;
        try {
            await apiClient(`/crop-events/${eventToDelete.id}`, { method: 'DELETE' });
            addNotification(`Sự kiện đã được xóa.`, 'success');
            fetchData();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setEventToDelete(null);
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
                Vui lòng chọn một trang trại để xem sự kiện mùa vụ.
            </div>
         );
    }

    const getPlotName = (plotId: string) => plots.find(p => p.id === plotId)?.name || plotId;
    const getSeasonName = (seasonId: string) => seasons.find(s => s.id === seasonId)?.name || seasonId;

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

            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Lô đất</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mùa vụ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Loại sự kiện</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngày</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ghi chú</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {cropEvents.length > 0 ? cropEvents.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{getPlotName(event.plotId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{getSeasonName(event.seasonId)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">{event.eventType}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(event.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{event.notes}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleOpenModal(event)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setEventToDelete(event)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">
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
                        plots={plots}
                        seasons={seasons}
                        onSave={handleSaveCropEvent} 
                        onCancel={handleCloseModal} 
                    />
                </Modal>
            )}
            
            {eventToDelete && (
                <ConfirmationModal
                    title="Xóa Sự kiện"
                    message={`Bạn có chắc chắn muốn xóa sự kiện ${eventToDelete.eventType} vào ngày ${new Date(eventToDelete.date).toLocaleDateString('vi-VN')}?`}
                    onConfirm={handleDeleteCropEvent}
                    onCancel={() => setEventToDelete(null)}
                />
            )}
        </div>
    );
};

interface CropEventFormProps {
    event: CropEvent | Omit<CropEvent, 'id' | 'recordedBy'>;
    plots: Plot[];
    seasons: Season[];
    onSave: (event: CropEvent | Omit<CropEvent, 'id' | 'recordedBy'>) => void;
    onCancel: () => void;
}

const CropEventForm: React.FC<CropEventFormProps> = ({ event, plots, seasons, onSave, onCancel }) => {
    const [formData, setFormData] = useState(event);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: value
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
                    <label htmlFor="plotId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lô đất</label>
                    <select name="plotId" id="plotId" value={formData.plotId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        <option value="">Chọn lô đất</option>
                        {plots.map(plot => <option key={plot.id} value={plot.id}>{plot.name}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="seasonId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mùa vụ</label>
                    <select name="seasonId" id="seasonId" value={formData.seasonId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        <option value="">Chọn mùa vụ</option>
                        {seasons.map(season => <option key={season.id} value={season.id}>{season.name}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="eventType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loại sự kiện</label>
                    <input type="text" name="eventType" id="eventType" value={formData.eventType} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày</label>
                    <input type="date" name="date" id="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                 <div className="md:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ghi chú</label>
                    <textarea name="notes" id="notes" value={formData.notes} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
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
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Animal, Batch, AnimalEvent } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { useNotification } from '../contexts/NotificationContext';
import { EditIcon, TrashIcon, ActivityIcon, ArrowUpIcon, ArrowDownIcon, XIcon } from '../constants';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import apiClient from '../apiClient';

const ANIMAL_TYPES = ['BREEDING_FEMALE', 'DEVELOPMENT', 'FATTENING', 'YOUNG'];
const STATUS_TYPES = ['HEALTHY', 'SICK', 'SOLD', 'DEAD'];
const EVENT_TYPES = ['VACCINATION', 'TREATMENT', 'HEALTH_CHECK', 'WEIGHING', 'BIRTH'];

const initialFilters = {
    species: '',
    status: '',
    sortBy: 'tagId',
    sortDirection: 'asc',
};

const initialAnimalState: Omit<Animal, 'id' | 'enclosureId'> = {
    farmId: '',
    tagId: '',
    species: '',
    animalType: 'YOUNG',
    status: 'HEALTHY',
    birthDate: new Date().toISOString().split('T')[0],
};

const buildQueryString = (params: Record<string, string>) => {
    const query = new URLSearchParams();
    for (const key in params) {
        if (params[key]) {
            query.set(key, params[key]);
        }
    }
    return query.toString();
};

const LivestockView: React.FC = () => {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState<Animal | Omit<Animal, 'id' | 'enclosureId'> | null>(null);
    const [isEventsModalOpen, setIsEventsModalOpen] = useState(false);
    const [selectedAnimalForEvents, setSelectedAnimalForEvents] = useState<Animal | null>(null);
    const [animalToDelete, setAnimalToDelete] = useState<Animal | null>(null);
    const [filters, setFilters] = useState(initialFilters);
    const [debouncedSpecies, setDebouncedSpecies] = useState(filters.species);

    const { selectedFarm } = useFarm();
    const { addNotification } = useNotification();

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSpecies(filters.species);
        }, 500);
        return () => clearTimeout(handler);
    }, [filters.species]);

    const fetchData = useCallback(async () => {
        if (!selectedFarm) {
            setAnimals([]);
            setBatches([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const queryParams = buildQueryString({
                farmId: selectedFarm.id,
                species: debouncedSpecies,
                status: filters.status,
                sortBy: filters.sortBy,
                sortDirection: filters.sortDirection,
            });

            const [animalsData, batchesData] = await Promise.all([
                apiClient<Animal[]>(`/animals?${queryParams}`),
                apiClient<Batch[]>(`/batches?farmId=${selectedFarm.id}`)
            ]);
            setAnimals(animalsData);
            setBatches(batchesData);
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm, addNotification, debouncedSpecies, filters.status, filters.sortBy, filters.sortDirection]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    
    const resetFilters = () => {
        setFilters(initialFilters);
    };

    const handleOpenModal = (animal: Animal | null = null) => {
        if (animal) {
            setEditingAnimal({ ...animal, birthDate: new Date(animal.birthDate).toISOString().split('T')[0] });
        } else {
            setEditingAnimal({ ...initialAnimalState, farmId: selectedFarm?.id || '' });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingAnimal(null);
    };

    const handleOpenEventsModal = (animal: Animal) => {
        setSelectedAnimalForEvents(animal);
        setIsEventsModalOpen(true);
    };

    const handleCloseEventsModal = () => {
        setIsEventsModalOpen(false);
        setSelectedAnimalForEvents(null);
    };

    const handleSaveAnimal = async (animalData: Animal | Omit<Animal, 'id' | 'enclosureId'>) => {
        const isEditing = 'id' in animalData;
        const endpoint = isEditing ? `/animals/${animalData.id}` : `/animals`;
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            await apiClient(endpoint, {
                method,
                body: JSON.stringify(animalData),
            });
            addNotification(`Vật nuôi đã được ${isEditing ? 'cập nhật' : 'tạo'} thành công.`, 'success');
            handleCloseModal();
            fetchData(); // Refresh data
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };
    
    const handleDeleteAnimal = async () => {
        if (!animalToDelete) return;

        try {
            await apiClient(`/animals/${animalToDelete.id}`, { method: 'DELETE' });
            addNotification(`Vật nuôi ${animalToDelete.tagId} đã được xóa.`, 'success');
            fetchData(); // Refresh data
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setAnimalToDelete(null);
        }
    };

    const isFiltered = useMemo(() => JSON.stringify(filters) !== JSON.stringify(initialFilters), [filters]);

    if (!selectedFarm && !isLoading) {
         return (
             <div className="p-4 text-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">
                Vui lòng chọn một trang trại để xem vật nuôi.
            </div>
         );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Quản lý vật nuôi</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                    Thêm vật nuôi
                </button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex flex-wrap gap-4 items-center">
                <div className="flex-grow min-w-[200px]">
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm theo loài..." 
                        className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm"
                        value={filters.species}
                        onChange={e => handleFilterChange('species', e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="status" className="text-sm font-medium">Trạng thái:</label>
                    <select id="status" value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        <option value="">Tất cả</option>
                        {STATUS_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="sortBy" className="text-sm font-medium">Sắp xếp:</label>
                    <select id="sortBy" value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        <option value="tagId">Mã thẻ</option>
                        <option value="species">Loài</option>
                        <option value="birthDate">Ngày sinh</option>
                        <option value="status">Trạng thái</option>
                    </select>
                </div>
                <button onClick={() => handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')} className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                    {filters.sortDirection === 'asc' ? <ArrowUpIcon className="w-5 h-5"/> : <ArrowDownIcon className="w-5 h-5"/>}
                </button>
                {isFiltered && (
                    <button onClick={resetFilters} className="p-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                        <XIcon className="w-4 h-4" /> Xóa bộ lọc
                    </button>
                )}
            </div>

             {isLoading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mã thẻ</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Loài</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mã Lô</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Trạng thái</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngày sinh</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {animals.length > 0 ? animals.map((animal) => (
                                    <tr key={animal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{animal.tagId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{animal.species}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{batches.find(b => b.id === animal.batchId)?.batchCode || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                animal.status === 'HEALTHY' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                                animal.status === 'SICK' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                                {animal.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(animal.birthDate).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                            <button onClick={() => handleOpenEventsModal(animal)} className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200" title="Sự kiện">
                                                <ActivityIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleOpenModal(animal)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200" title="Sửa">
                                                <EditIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => setAnimalToDelete(animal)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200" title="Xóa">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                            {isFiltered ? 'Không tìm thấy vật nuôi nào khớp với bộ lọc.' : 'Không tìm thấy vật nuôi nào cho trang trại này.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {isModalOpen && editingAnimal && (
                <Modal 
                    title={ 'id' in editingAnimal ? 'Sửa thông tin vật nuôi' : 'Thêm vật nuôi mới'} 
                    onClose={handleCloseModal}
                >
                    <AnimalForm 
                        animal={editingAnimal} 
                        batches={batches}
                        onSave={handleSaveAnimal} 
                        onCancel={handleCloseModal} 
                    />
                </Modal>
            )}

            {isEventsModalOpen && selectedAnimalForEvents && (
                <Modal 
                    title={`Sự kiện cho vật nuôi: ${selectedAnimalForEvents.tagId}`} 
                    onClose={handleCloseEventsModal}
                >
                    <AnimalEvents animal={selectedAnimalForEvents} />
                </Modal>
            )}

            {animalToDelete && (
                <ConfirmationModal
                    title="Xóa Vật nuôi"
                    message={`Bạn có chắc chắn muốn xóa vật nuôi có mã thẻ ${animalToDelete.tagId}? Hành động này không thể hoàn tác.`}
                    onConfirm={handleDeleteAnimal}
                    onCancel={() => setAnimalToDelete(null)}
                />
            )}
        </div>
    );
};

interface AnimalFormProps {
    animal: Animal | Omit<Animal, 'id' | 'enclosureId'>;
    batches: Batch[];
    onSave: (animal: Animal | Omit<Animal, 'id' | 'enclosureId'>) => void;
    onCancel: () => void;
}

const AnimalForm: React.FC<AnimalFormProps> = ({ animal, batches, onSave, onCancel }) => {
    const [formData, setFormData] = useState(animal);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const dataToSave = { ...formData };
        if (dataToSave.batchId === '') {
            delete dataToSave.batchId;
        }
        onSave(dataToSave);
    };

    const animalBatches = batches.filter(b => b.type === 'ANIMAL');

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="tagId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mã thẻ</label>
                    <input type="text" name="tagId" id="tagId" value={formData.tagId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="species" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loài</label>
                    <input type="text" name="species" id="species" value={formData.species} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                 <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ngày sinh</label>
                    <input type="date" name="birthDate" id="birthDate" value={formData.birthDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                 <div>
                    <label htmlFor="batchId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Lô</label>
                    <select name="batchId" id="batchId" value={formData.batchId || ''} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        <option value="">Không có</option>
                        {animalBatches.map(batch => <option key={batch.id} value={batch.id}>{batch.batchCode}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="animalType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Loại vật nuôi</label>
                    <select name="animalType" id="animalType" value={formData.animalType} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        {ANIMAL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Trạng thái</label>
                    <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        {STATUS_TYPES.map(status => <option key={status} value={status}>{status}</option>)}
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

const AnimalEvents: React.FC<{ animal: Animal }> = ({ animal }) => {
    const [events, setEvents] = useState<AnimalEvent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newEvent, setNewEvent] = useState({ type: EVENT_TYPES[0], date: new Date().toISOString().split('T')[0], notes: '' });
    const { addNotification } = useNotification();

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await apiClient<AnimalEvent[]>(`/animal-events?animalId=${animal.id}`);
            setEvents(data);
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [animal.id, addNotification]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setNewEvent({ ...newEvent, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await apiClient('/animal-events', {
                method: 'POST',
                body: JSON.stringify({ ...newEvent, animalId: animal.id }),
            });
            addNotification('Sự kiện đã được thêm thành công.', 'success');
            setNewEvent({ type: EVENT_TYPES[0], date: new Date().toISOString().split('T')[0], notes: '' });
            fetchEvents(); // Refresh list
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto border dark:border-gray-700 rounded-lg p-2 space-y-2">
                {isLoading && <p>Đang tải sự kiện...</p>}
                {!isLoading && events.length === 0 && <p className="text-center text-gray-500">Chưa có sự kiện nào.</p>}
                {events.map(event => (
                    <div key={event.id} className="p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-semibold text-primary-600 dark:text-primary-400">{event.type}</span>
                            <span>{new Date(event.date).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{event.notes}</p>
                    </div>
                ))}
            </div>
            <div>
                <h4 className="font-semibold mb-2">Thêm sự kiện mới</h4>
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <select name="type" value={newEvent.type} onChange={handleChange} className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                            {EVENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                        <input type="date" name="date" value={newEvent.date} onChange={handleChange} className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                    </div>
                    <textarea name="notes" value={newEvent.notes} onChange={handleChange} placeholder="Ghi chú" rows={2} className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"></textarea>
                    <div className="text-right">
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu sự kiện</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LivestockView;
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Season, Plot } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { useNotification } from '../contexts/NotificationContext';
import { EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, XIcon } from '../constants';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import apiClient from '../apiClient';
import { seasonStatusMap, translate } from '../utils/translations';

const initialSeasonState: Omit<Season, 'id'> = {
    farmId: '',
    name: '',
    cropType: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    plotIds: [],
    notes: '',
};

const initialFilters = {
    status: '',
    sortBy: 'startDate',
    sortDirection: 'desc',
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

const SeasonsView: React.FC = () => {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [plots, setPlots] = useState<Plot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSeason, setEditingSeason] = useState<Season | Omit<Season, 'id'> | null>(null);
    const [seasonToDelete, setSeasonToDelete] = useState<Season | null>(null);
    const [filters, setFilters] = useState(initialFilters);

    const { selectedFarm } = useFarm();
    const { addNotification } = useNotification();

    const fetchData = useCallback(async () => {
        if (!selectedFarm) {
            setSeasons([]);
            setPlots([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const queryParams = buildQueryString({
                farmId: selectedFarm.id,
                ...filters
            });
            const [seasonsData, plotsData] = await Promise.all([
                apiClient<Season[]>(`/seasons?${queryParams}`),
                apiClient<Plot[]>(`/plots?farmId=${selectedFarm.id}`)
            ]);
            setSeasons(seasonsData);
            setPlots(plotsData);
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm, addNotification, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const resetFilters = () => setFilters(initialFilters);
    const isFiltered = useMemo(() => JSON.stringify(filters) !== JSON.stringify(initialFilters), [filters]);

    const handleOpenModal = (season: Season | null = null) => {
        setEditingSeason(season || { ...initialSeasonState, farmId: selectedFarm?.id || '' });
        setIsModalOpen(true);
    };
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveSeason = async (seasonData: Season | Omit<Season, 'id'>) => {
        const isEditing = 'id' in seasonData;
        const endpoint = isEditing ? `/seasons/${seasonData.id}` : `/seasons`;
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            await apiClient(endpoint, { method, body: JSON.stringify(seasonData) });
            addNotification(`Mùa vụ đã được ${isEditing ? 'cập nhật' : 'tạo'} thành công.`, 'success');
            handleCloseModal();
            fetchData();
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };
    
    const handleDeleteSeason = async () => {
        if (!seasonToDelete) return;

        try {
            await apiClient(`/seasons/${seasonToDelete.id}`, { method: 'DELETE' });
            addNotification(`Mùa vụ ${seasonToDelete.name} đã được xóa.`, 'success');
            fetchData();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setSeasonToDelete(null);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div></div>;
    if (!selectedFarm) return <div className="p-4 text-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">Vui lòng chọn một trang trại để xem mùa vụ.</div>;

    const getPlotNames = (plotIds: string[]) => plotIds.map(id => plots.find(p => p.id === id)?.name).filter(Boolean).join(', ') || 'N/A';

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Quản lý Mùa vụ</h2>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Thêm Mùa vụ</button>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Trạng thái:</label>
                    <select value={filters.status} onChange={e => handleFilterChange('status', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        <option value="">Tất cả</option>
                        {Object.entries(seasonStatusMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                    </select>
                </div>
                 <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Sắp xếp theo ngày bắt đầu:</label>
                     <button onClick={() => handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')} className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        {filters.sortDirection === 'asc' ? <ArrowUpIcon className="w-5 h-5"/> : <ArrowDownIcon className="w-5 h-5"/>}
                    </button>
                </div>
                {isFiltered && (
                    <button onClick={resetFilters} className="p-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                        <XIcon className="w-4 h-4" /> Xóa bộ lọc
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Tên Mùa vụ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Loại cây trồng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Thời gian</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Lô đất</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {seasons.map(s => (
                                <tr key={s.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{s.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{s.cropType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(s.startDate).toLocaleDateString('vi-VN')} - {new Date(s.endDate).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{getPlotNames(s.plotIds)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-4">
                                        <button onClick={() => handleOpenModal(s)} className="text-primary-600 hover:text-primary-900"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => setSeasonToDelete(s)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && editingSeason && <Modal title={'id' in editingSeason ? 'Sửa Mùa vụ' : 'Thêm Mùa vụ'} onClose={handleCloseModal}><SeasonForm season={editingSeason} plots={plots} onSave={handleSaveSeason} onCancel={handleCloseModal} /></Modal>}
            {seasonToDelete && <ConfirmationModal title="Xóa Mùa vụ" message={`Bạn có chắc chắn muốn xóa mùa vụ ${seasonToDelete.name}?`} onConfirm={handleDeleteSeason} onCancel={() => setSeasonToDelete(null)} />}
        </div>
    );
};

const SeasonForm: React.FC<{ season: any, plots: Plot[], onSave: (data: any) => void, onCancel: () => void }> = ({ season, plots, onSave, onCancel }) => {
    const [formData, setFormData] = useState(season);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
    };
    const handlePlotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedIds = [...e.target.selectedOptions].map(option => option.value);
        setFormData((prev: any) => ({ ...prev, plotIds: selectedIds }));
    };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
    return <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Tên Mùa vụ" required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
            <input name="cropType" value={formData.cropType} onChange={handleChange} placeholder="Loại cây trồng" required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
            <div><label>Ngày bắt đầu</label><input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/></div>
            <div><label>Ngày kết thúc</label><input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/></div>
        </div>
        <div><label>Lô đất</label><select name="plotIds" multiple value={formData.plotIds} onChange={handlePlotChange} className="w-full h-32 p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">{plots.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Ghi chú" rows={3} className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
        <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">Hủy</button><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button></div>
    </form>;
};

export default SeasonsView;
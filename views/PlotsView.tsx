import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Plot } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { useNotification } from '../contexts/NotificationContext';
import { EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, XIcon } from '../constants';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import apiClient from '../apiClient';

const initialPlotState: Omit<Plot, 'id'> = {
    farmId: '',
    name: '',
    area: 0,
    location: '',
};

const initialFilters = {
    sortBy: 'name',
    sortDirection: 'asc',
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

const PlotsView: React.FC = () => {
    const [plots, setPlots] = useState<Plot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlot, setEditingPlot] = useState<Plot | Omit<Plot, 'id'> | null>(null);
    const [plotToDelete, setPlotToDelete] = useState<Plot | null>(null);
    const [filters, setFilters] = useState(initialFilters);
    
    const { selectedFarm } = useFarm();
    const { addNotification } = useNotification();

    const fetchPlots = useCallback(async () => {
        if (!selectedFarm) {
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
            const data = await apiClient<Plot[]>(`/plots?${queryParams}`);
            setPlots(data);
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm, addNotification, filters]);

    useEffect(() => {
        fetchPlots();
    }, [fetchPlots]);
    
    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const resetFilters = () => setFilters(initialFilters);
    const isFiltered = useMemo(() => JSON.stringify(filters) !== JSON.stringify(initialFilters), [filters]);

    const handleOpenModal = (plot: Plot | null = null) => {
        setEditingPlot(plot || { ...initialPlotState, farmId: selectedFarm?.id || '' });
        setIsModalOpen(true);
    };
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSavePlot = async (plotData: Plot | Omit<Plot, 'id'>) => {
        const isEditing = 'id' in plotData;
        const endpoint = isEditing ? `/plots/${plotData.id}` : `/plots`;
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            await apiClient(endpoint, { method, body: JSON.stringify(plotData) });
            addNotification(`Lô đất đã được ${isEditing ? 'cập nhật' : 'tạo'} thành công.`, 'success');
            handleCloseModal();
            fetchPlots();
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };
    
    const handleDeletePlot = async () => {
        if (!plotToDelete) return;
        try {
            await apiClient(`/plots/${plotToDelete.id}`, { method: 'DELETE' });
            addNotification(`Lô đất ${plotToDelete.name} đã được xóa.`, 'success');
            fetchPlots();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setPlotToDelete(null);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div></div>;
    if (!selectedFarm) return <div className="p-4 text-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">Vui lòng chọn một trang trại để xem lô đất.</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Quản lý Lô đất</h2>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Thêm Lô đất</button>
            </div>

             <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Sắp xếp:</label>
                    <select value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        <option value="name">Tên</option>
                        <option value="area">Diện tích</option>
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

            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Tên Lô</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Diện tích (ha)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Vị trí</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {plots.map(plot => (
                                <tr key={plot.id}>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium">{plot.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{plot.area}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">{plot.location}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-4">
                                        <button onClick={() => handleOpenModal(plot)} className="text-primary-600 hover:text-primary-900"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => setPlotToDelete(plot)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && editingPlot && <Modal title={'id' in editingPlot ? 'Sửa Lô đất' : 'Thêm Lô đất'} onClose={handleCloseModal}><PlotForm plot={editingPlot} onSave={handleSavePlot} onCancel={handleCloseModal} /></Modal>}
            {plotToDelete && <ConfirmationModal title="Xóa Lô đất" message={`Bạn có chắc muốn xóa lô đất ${plotToDelete.name}?`} onConfirm={handleDeletePlot} onCancel={() => setPlotToDelete(null)} />}
        </div>
    );
};

const PlotForm: React.FC<{ plot: any, onSave: (data: any) => void, onCancel: () => void }> = ({ plot, onSave, onCancel }) => {
    const [formData, setFormData] = useState(plot);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Tên Lô đất" required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
            <input type="number" step="any" name="area" value={formData.area} onChange={handleChange} placeholder="Diện tích (ha)" required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
            <input name="location" value={formData.location} onChange={handleChange} placeholder="Vị trí" required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
            <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">Hủy</button><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button></div>
        </form>
    );
};

export default PlotsView;
import React, { useState, useEffect, useCallback } from 'react';
import { Plot } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { EditIcon, TrashIcon } from '../constants';
import Modal from '../components/Modal';
import apiClient from '../apiClient';

const initialPlotState: Omit<Plot, 'id'> = {
    farmId: '',
    name: '',
    area: 0,
    location: '',
};

const PlotsView: React.FC = () => {
    const [plots, setPlots] = useState<Plot[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlot, setEditingPlot] = useState<Plot | Omit<Plot, 'id'> | null>(null);
    
    const { selectedFarm } = useFarm();

    const fetchPlots = useCallback(async () => {
        if (!selectedFarm) {
            setPlots([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient<Plot[]>(`/plots?farmId=${selectedFarm.id}`);
            setPlots(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm]);

    useEffect(() => {
        fetchPlots();
    }, [fetchPlots]);

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
            handleCloseModal();
            fetchPlots();
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleDeletePlot = async (plotId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa lô đất này không?')) {
            try {
                await apiClient(`/plots/${plotId}`, { method: 'DELETE' });
                fetchPlots();
            } catch (err: any) {
                setError(err.message);
            }
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
            
            {error && <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg">{error}</div>}

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
                                        <button onClick={() => handleDeletePlot(plot.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && editingPlot && <Modal title={'id' in editingPlot ? 'Sửa Lô đất' : 'Thêm Lô đất'} onClose={handleCloseModal}><PlotForm plot={editingPlot} onSave={handleSavePlot} onCancel={handleCloseModal} /></Modal>}
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

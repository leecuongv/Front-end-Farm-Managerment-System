
import React, { useState, useEffect, useCallback } from 'react';
import { Batch } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { useNotification } from '../contexts/NotificationContext';
import { EditIcon, TrashIcon } from '../constants';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import apiClient from '../apiClient';

const BATCH_TYPES = ['ANIMAL', 'CROP', 'INVENTORY'];

const initialBatchState: Omit<Batch, 'id'> = {
    farmId: '',
    batchCode: '',
    type: 'ANIMAL',
    description: '',
    entryDate: new Date().toISOString().split('T')[0],
};

const BatchesView: React.FC = () => {
    const [batches, setBatches] = useState<Batch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBatch, setEditingBatch] = useState<Batch | Omit<Batch, 'id'> | null>(null);
    const [batchToDelete, setBatchToDelete] = useState<Batch | null>(null);
    
    const { selectedFarm } = useFarm();
    const { addNotification } = useNotification();

    const fetchBatches = useCallback(async () => {
        if (!selectedFarm) {
            setBatches([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const data = await apiClient<Batch[]>(`/batches?farmId=${selectedFarm.id}`);
            setBatches(data);
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm, addNotification]);

    useEffect(() => {
        fetchBatches();
    }, [fetchBatches]);

    const handleOpenModal = (batch: Batch | null = null) => {
        setEditingBatch(batch || { ...initialBatchState, farmId: selectedFarm?.id || ''});
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBatch(null);
    };

    const handleSaveBatch = async (batchData: Batch | Omit<Batch, 'id'>) => {
        const isEditing = 'id' in batchData;
        const endpoint = isEditing ? `/batches/${batchData.id}` : `/batches`;
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            await apiClient(endpoint, {
                method,
                body: JSON.stringify(batchData),
            });
            addNotification(`Lô đã được ${isEditing ? 'cập nhật' : 'tạo'} thành công.`, 'success');
            handleCloseModal();
            fetchBatches();
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };
    
    const handleDeleteBatch = async () => {
        if (!batchToDelete) return;
        try {
            await apiClient(`/batches/${batchToDelete.id}`, { method: 'DELETE' });
            addNotification(`Lô ${batchToDelete.batchCode} đã được xóa.`, 'success');
            fetchBatches();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setBatchToDelete(null);
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div></div>;
    }
    
    if (!selectedFarm) {
         return <div className="p-4 text-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">Vui lòng chọn một trang trại để xem các lô.</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Quản lý Lô</h2>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Thêm Lô</button>
            </div>

            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Mã Lô</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Loại</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Mô tả</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Ngày nhập</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {batches.map((batch) => (
                                <tr key={batch.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{batch.batchCode}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{batch.type}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{batch.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(batch.entryDate).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-4">
                                        <button onClick={() => handleOpenModal(batch)} className="text-primary-600 hover:text-primary-900"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => setBatchToDelete(batch)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && editingBatch && (
                <Modal title={'id' in editingBatch ? 'Sửa thông tin lô' : 'Thêm lô mới'} onClose={handleCloseModal}>
                    <BatchForm batch={editingBatch} onSave={handleSaveBatch} onCancel={handleCloseModal} />
                </Modal>
            )}

            {batchToDelete && (
                <ConfirmationModal
                    title="Xóa Lô"
                    message={`Bạn có chắc chắn muốn xóa lô ${batchToDelete.batchCode}?`}
                    onConfirm={handleDeleteBatch}
                    onCancel={() => setBatchToDelete(null)}
                />
            )}
        </div>
    );
};

interface BatchFormProps {
    batch: Batch | Omit<Batch, 'id'>;
    onSave: (batch: Batch | Omit<Batch, 'id'>) => void;
    onCancel: () => void;
}

const BatchForm: React.FC<BatchFormProps> = ({ batch, onSave, onCancel }) => {
    const [formData, setFormData] = useState(batch);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="batchCode">Mã Lô</label>
                    <input type="text" name="batchCode" id="batchCode" value={formData.batchCode} onChange={handleChange} required className="mt-1 block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="type">Loại Lô</label>
                    <select name="type" id="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                        {BATCH_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="entryDate">Ngày nhập</label>
                    <input type="date" name="entryDate" id="entryDate" value={formData.entryDate} onChange={handleChange} required className="mt-1 block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                </div>
                 <div>
                    <label htmlFor="source">Nguồn (Tùy chọn)</label>
                    <input type="text" name="source" id="source" value={formData.source || ''} onChange={handleChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="description">Mô tả</label>
                    <textarea name="description" id="description" value={formData.description} onChange={handleChange} required rows={3} className="mt-1 block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
            </div>
        </form>
    );
};

export default BatchesView;
import React, { useState, useEffect, useCallback } from 'react';
import { InventoryItem, InventoryLog, Enclosure, Animal } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { EditIcon, TrashIcon } from '../constants';
import Modal from '../components/Modal';
import apiClient from '../apiClient';

const initialItemState: Omit<InventoryItem, 'id'> = {
    farmId: '',
    name: '',
    category: '',
    quantity: 0,
    unit: '',
    lowStockThreshold: 0,
};

const initialLogState: Omit<InventoryLog, 'id' | 'recordedBy'> = {
    farmId: '',
    itemId: '',
    type: 'OUT',
    quantity: 0,
    notes: '',
    date: new Date().toISOString().split('T')[0],
};

const InventoryView: React.FC = () => {
    const { selectedFarm } = useFarm();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | Omit<InventoryItem, 'id'> | null>(null);

    const fetchData = useCallback(async () => {
        if (!selectedFarm) {
            setItems([]);
            setLogs([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const [itemsData, logsData] = await Promise.all([
                apiClient<InventoryItem[]>(`/inventory-items?farmId=${selectedFarm.id}`),
                apiClient<InventoryLog[]>(`/inventory-logs?farmId=${selectedFarm.id}`)
            ]);
            setItems(itemsData);
            setLogs(logsData);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Item modal handlers
    const handleOpenItemModal = (item: InventoryItem | null = null) => {
        setEditingItem(item || { ...initialItemState, farmId: selectedFarm?.id || '' });
        setIsItemModalOpen(true);
    };
    const handleCloseItemModal = () => {
        setIsItemModalOpen(false);
        setEditingItem(null);
    };
    const handleSaveItem = async (itemData: InventoryItem | Omit<InventoryItem, 'id'>) => {
        const isEditing = 'id' in itemData;
        const endpoint = isEditing ? `/inventory-items/${itemData.id}` : `/inventory-items`;
        const method = isEditing ? 'PUT' : 'POST';
        try {
            await apiClient(endpoint, { method, body: JSON.stringify(itemData) });
            handleCloseItemModal();
            fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };
    const handleDeleteItem = async (itemId: string) => {
        if (window.confirm('Bạn có chắc muốn xóa vật phẩm này?')) {
            try {
                await apiClient(`/inventory-items/${itemId}`, { method: 'DELETE' });
                fetchData();
            } catch (err: any) {
                setError(err.message);
            }
        }
    };

    // Log modal handlers
    const handleOpenLogModal = () => setIsLogModalOpen(true);
    const handleCloseLogModal = () => setIsLogModalOpen(false);
    const handleSaveLog = async (logData: Omit<InventoryLog, 'id' | 'recordedBy'>) => {
        try {
            await apiClient(`/inventory-logs`, { method: 'POST', body: JSON.stringify(logData) });
            handleCloseLogModal();
            fetchData();
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div></div>;
    if (!selectedFarm) return <div className="p-4 text-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">Vui lòng chọn một trang trại để xem kho.</div>;

    return (
        <div className="space-y-8">
            {error && <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg">{error}</div>}
            
            {/* Inventory Items Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Vật phẩm trong kho</h2>
                    <div className="space-x-2">
                        <button onClick={handleOpenLogModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Ghi chép Kho</button>
                        <button onClick={() => handleOpenItemModal()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Thêm vật phẩm</button>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                           <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên vật phẩm</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Loại</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Số lượng</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngưỡng báo hết</th>
                                    <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {items.map(item => (
                                    <tr key={item.id} className={item.quantity <= item.lowStockThreshold ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.category}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.quantity} {item.unit}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{item.lowStockThreshold} {item.unit}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                            <button onClick={() => handleOpenItemModal(item)} className="text-primary-600 hover:text-primary-900"><EditIcon className="w-5 h-5" /></button>
                                            <button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Inventory Logs Section */}
            <div>
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Lịch sử Kho</h2>
                 <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ngày</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Vật phẩm</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Loại GD</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Số lượng</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(log.date).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{items.find(i => i.id === log.itemId)?.name || log.itemId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${log.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{log.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
            </div>

            {isItemModalOpen && editingItem && <Modal title={'id' in editingItem ? 'Sửa vật phẩm' : 'Thêm vật phẩm'} onClose={handleCloseItemModal}><ItemForm item={editingItem} onSave={handleSaveItem} onCancel={handleCloseItemModal} /></Modal>}
            {isLogModalOpen && <Modal title="Ghi chép Kho" onClose={handleCloseLogModal}><LogForm items={items} farmId={selectedFarm.id} onSave={handleSaveLog} onCancel={handleCloseLogModal} /></Modal>}
        </div>
    );
};

// ItemForm Component
const ItemForm: React.FC<{ item: InventoryItem | Omit<InventoryItem, 'id'>, onSave: (data: any) => void, onCancel: () => void }> = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields for name, category, quantity, unit, lowStockThreshold */}
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Tên vật phẩm" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2"/>
            <input name="category" value={formData.category} onChange={handleChange} placeholder="Loại" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2"/>
            <div className="flex gap-4">
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Số lượng" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2"/>
                <input name="unit" value={formData.unit} onChange={handleChange} placeholder="Đơn vị (kg, l)" required className="mt-1 block w-1/3 rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2"/>
            </div>
            <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} placeholder="Ngưỡng báo hết" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2"/>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
            </div>
        </form>
    );
};

// LogForm Component
const LogForm: React.FC<{ items: InventoryItem[], farmId: string, onSave: (data: any) => void, onCancel: () => void }> = ({ items, farmId, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ ...initialLogState, farmId });
    const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
    const [animals, setAnimals] = useState<Animal[]>([]);

    useEffect(() => {
        if (formData.type === 'OUT') {
            apiClient<Enclosure[]>(`/enclosures?farmId=${farmId}`).then(setEnclosures);
            apiClient<Animal[]>(`/animals?farmId=${farmId}`).then(setAnimals);
        }
    }, [formData.type, farmId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'quantity' ? parseFloat(value) : value }));
    };

    const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, usageTarget: { ...prev.usageTarget, [name]: value } as any }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <select name="itemId" value={formData.itemId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                <option value="">Chọn vật phẩm</option>
                {items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
             <div className="flex gap-4">
                <select name="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-1/3 rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                    <option value="OUT">Xuất</option>
                    <option value="IN">Nhập</option>
                </select>
                <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Số lượng" required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2"/>
             </div>
             {formData.type === 'OUT' && (
                <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-3">
                    <h3 className="text-sm font-medium">Mục tiêu sử dụng</h3>
                     <select name="type" value={formData.usageTarget?.type || ''} onChange={handleTargetChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                        <option value="">Chọn loại mục tiêu</option>
                        <option value="ENCLOSURE">Chuồng trại</option>
                        <option value="ANIMAL">Vật nuôi</option>
                    </select>
                    {formData.usageTarget?.type === 'ENCLOSURE' && (
                        <select name="id" value={formData.usageTarget?.id || ''} onChange={handleTargetChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                            <option value="">Chọn chuồng</option>
                            {enclosures.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                        </select>
                    )}
                    {formData.usageTarget?.type === 'ANIMAL' && (
                         <select name="id" value={formData.usageTarget?.id || ''} onChange={handleTargetChange} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2">
                            <option value="">Chọn vật nuôi</option>
                            {animals.map(a => <option key={a.id} value={a.id}>{a.tagId} - {a.species}</option>)}
                        </select>
                    )}
                </div>
             )}
            <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Ghi chú" rows={3} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2"/>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700 p-2"/>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
            </div>
        </form>
    );
};

export default InventoryView;

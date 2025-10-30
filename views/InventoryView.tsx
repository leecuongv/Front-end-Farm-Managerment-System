import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { InventoryItem, InventoryLog, Enclosure, Animal, Batch, InventoryAudit, AuditItem } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { useNotification } from '../contexts/NotificationContext';
import { EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, XIcon } from '../constants';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
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

const buildQueryString = (params: Record<string, string>) => {
    const query = new URLSearchParams();
    for (const key in params) {
        if (params[key]) {
            query.set(key, params[key]);
        }
    }
    return query.toString();
};

const initialItemFilters = {
    category: '',
    sortBy: 'name',
    sortDirection: 'asc',
};
const initialLogFilters = {
    type: '',
    sortBy: 'date',
    sortDirection: 'desc',
};


const InventoryView: React.FC = () => {
    const { selectedFarm } = useFarm();
    const { addNotification } = useNotification();
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [logs, setLogs] = useState<InventoryLog[]>([]);
    const [audits, setAudits] = useState<InventoryAudit[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isLogModalOpen, setIsLogModalOpen] = useState(false);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | Omit<InventoryItem, 'id'> | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);

    const [itemFilters, setItemFilters] = useState(initialItemFilters);
    const [logFilters, setLogFilters] = useState(initialLogFilters);
    const [debouncedCategory, setDebouncedCategory] = useState('');

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedCategory(itemFilters.category);
        }, 500);
        return () => clearTimeout(handler);
    }, [itemFilters.category]);

    const fetchData = useCallback(async () => {
        if (!selectedFarm) {
            setItems([]); setLogs([]); setBatches([]); setAudits([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const itemParams = buildQueryString({
                farmId: selectedFarm.id,
                category: debouncedCategory,
                sortBy: itemFilters.sortBy,
                sortDirection: itemFilters.sortDirection,
            });
            const logParams = buildQueryString({
                farmId: selectedFarm.id,
                type: logFilters.type,
                sortBy: logFilters.sortBy,
                sortDirection: logFilters.sortDirection,
            });

            const [itemsData, logsData, batchesData, auditsData] = await Promise.all([
                apiClient<InventoryItem[]>(`/inventory-items?${itemParams}`),
                apiClient<InventoryLog[]>(`/inventory-logs?${logParams}`),
                apiClient<Batch[]>(`/batches?farmId=${selectedFarm.id}`),
                apiClient<InventoryAudit[]>(`/inventory-audits?farmId=${selectedFarm.id}`)
            ]);
            setItems(itemsData);
            setLogs(logsData);
            setBatches(batchesData);
            setAudits(auditsData);
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm, addNotification, itemFilters, logFilters, debouncedCategory]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleItemFilterChange = (key: keyof typeof itemFilters, value: string) => {
        setItemFilters(prev => ({ ...prev, [key]: value }));
    };
    const resetItemFilters = () => setItemFilters(initialItemFilters);
    const isItemFiltered = useMemo(() => JSON.stringify(itemFilters) !== JSON.stringify(initialItemFilters), [itemFilters]);

    const handleLogFilterChange = (key: keyof typeof logFilters, value: string) => {
        setLogFilters(prev => ({ ...prev, [key]: value }));
    };
    const resetLogFilters = () => setLogFilters(initialLogFilters);
    const isLogFiltered = useMemo(() => JSON.stringify(logFilters) !== JSON.stringify(initialLogFilters), [logFilters]);

    const handleOpenItemModal = (item: InventoryItem | null = null) => {
        setEditingItem(item || { ...initialItemState, farmId: selectedFarm?.id || '' });
        setIsItemModalOpen(true);
    };
    const handleCloseItemModal = () => setIsItemModalOpen(false);
    const handleSaveItem = async (itemData: InventoryItem | Omit<InventoryItem, 'id'>) => {
        const isEditing = 'id' in itemData;
        const endpoint = isEditing ? `/inventory-items/${itemData.id}` : `/inventory-items`;
        const method = isEditing ? 'PUT' : 'POST';
        try {
            await apiClient(endpoint, { method, body: JSON.stringify(itemData) });
            addNotification(`Vật phẩm đã được ${isEditing ? 'cập nhật' : 'tạo'} thành công.`, 'success');
            handleCloseItemModal();
            fetchData();
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };
    const handleDeleteItem = async () => {
        if (!itemToDelete) return;
        try {
            await apiClient(`/inventory-items/${itemToDelete.id}`, { method: 'DELETE' });
            addNotification(`Vật phẩm ${itemToDelete.name} đã được xóa.`, 'success');
            fetchData();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setItemToDelete(null);
        }
    };

    const handleOpenLogModal = () => setIsLogModalOpen(true);
    const handleCloseLogModal = () => setIsLogModalOpen(false);
    const handleSaveLog = async (logData: Omit<InventoryLog, 'id' | 'recordedBy'>) => {
        try {
            const dataToSave = { ...logData };
            if (dataToSave.batchCode === '') delete dataToSave.batchCode;
            if (!dataToSave.usageTarget?.type || !dataToSave.usageTarget?.id) delete dataToSave.usageTarget;
            await apiClient(`/inventory-logs`, { method: 'POST', body: JSON.stringify(dataToSave) });
            addNotification('Ghi chép kho đã được lưu thành công.', 'success');
            handleCloseLogModal();
            fetchData();
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };

    const handleOpenAuditModal = () => setIsAuditModalOpen(true);
    const handleCloseAuditModal = () => setIsAuditModalOpen(false);
    const handleSaveAudit = async (auditData: Omit<InventoryAudit, 'id' | 'recordedBy'>) => {
        try {
            await apiClient('/inventory-audits', { method: 'POST', body: JSON.stringify(auditData) });
            addNotification('Kiểm kê kho đã được lưu thành công.', 'success');
            handleCloseAuditModal();
            fetchData();
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div></div>;
    if (!selectedFarm) return <div className="p-4 text-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">Vui lòng chọn một trang trại để xem kho.</div>;

    return (
        <div className="space-y-8">
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Vật phẩm trong kho</h2>
                    <div className="space-x-2">
                        <button onClick={handleOpenAuditModal} className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600">Tạo Kiểm kê</button>
                        <button onClick={handleOpenLogModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Ghi chép Kho</button>
                        <button onClick={() => handleOpenItemModal()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Thêm vật phẩm</button>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex flex-wrap gap-4 items-center mb-6">
                    <div className="flex-grow min-w-[200px]">
                        <input type="text" placeholder="Lọc theo loại..." value={itemFilters.category} onChange={e => handleItemFilterChange('category', e.target.value)} className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm"/>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Sắp xếp:</label>
                        <select value={itemFilters.sortBy} onChange={e => handleItemFilterChange('sortBy', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                            <option value="name">Tên</option>
                            <option value="quantity">Số lượng</option>
                            <option value="category">Loại</option>
                        </select>
                    </div>
                    <button onClick={() => handleItemFilterChange('sortDirection', itemFilters.sortDirection === 'asc' ? 'desc' : 'asc')} className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        {itemFilters.sortDirection === 'asc' ? <ArrowUpIcon className="w-5 h-5"/> : <ArrowDownIcon className="w-5 h-5"/>}
                    </button>
                    {isItemFiltered && <button onClick={resetItemFilters} className="p-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><XIcon className="w-4 h-4"/> Xóa bộ lọc</button>}
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
                                            <button onClick={() => setItemToDelete(item)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div>
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Lịch sử Kiểm kê</h2>
                 <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                    {audits.map(audit => (
                        <details key={audit.id} className="border-b dark:border-gray-700 last:border-b-0">
                            <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 flex justify-between">
                                <div>Kiểm kê ngày {new Date(audit.date).toLocaleDateString('vi-VN')}</div>
                                <div className="text-xs text-gray-500">Bởi: {audit.recordedBy}</div>
                            </summary>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                                <table className="min-w-full text-sm">
                                    <thead><tr><th className="text-left p-2">Vật phẩm</th><th className="text-right p-2">Dự kiến</th><th className="text-right p-2">Thực tế</th><th className="text-right p-2">Chênh lệch</th></tr></thead>
                                    <tbody>
                                        {audit.items.map(item => (
                                            <tr key={item.itemId}>
                                                <td className="p-2">{item.itemName}</td>
                                                <td className="text-right p-2">{item.expectedQuantity}</td>
                                                <td className="text-right p-2">{item.countedQuantity}</td>
                                                <td className={`text-right p-2 font-bold ${item.discrepancy > 0 ? 'text-green-500' : item.discrepancy < 0 ? 'text-red-500' : ''}`}>{item.discrepancy}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </details>
                    ))}
                    {audits.length === 0 && <p className="text-center p-6 text-gray-500">Chưa có đợt kiểm kê nào.</p>}
                 </div>
            </div>

            <div>
                 <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">Lịch sử Kho</h2>
                 <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex flex-wrap gap-4 items-center mb-6">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium">Loại GD:</label>
                        <select value={logFilters.type} onChange={e => handleLogFilterChange('type', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                            <option value="">Tất cả</option>
                            <option value="IN">Nhập</option>
                            <option value="OUT">Xuất</option>
                        </select>
                    </div>
                    <button onClick={() => handleLogFilterChange('sortDirection', logFilters.sortDirection === 'asc' ? 'desc' : 'asc')} className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        {logFilters.sortDirection === 'asc' ? <ArrowUpIcon className="w-5 h-5"/> : <ArrowDownIcon className="w-5 h-5"/>}
                    </button>
                    {isLogFiltered && <button onClick={resetLogFilters} className="p-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><XIcon className="w-4 h-4"/> Xóa bộ lọc</button>}
                 </div>
                 <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Ngày</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Vật phẩm</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Mã Lô</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Loại GD</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Số lượng</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-6 py-4">{new Date(log.date).toLocaleDateString('vi-VN')}</td>
                                        <td className="px-6 py-4 font-medium">{items.find(i => i.id === log.itemId)?.name || log.itemId}</td>
                                        <td className="px-6 py-4">{log.batchCode || 'N/A'}</td>
                                        <td className="px-6 py-4"><span className={`px-2 inline-flex font-semibold rounded-full text-xs ${log.type === 'IN' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{log.type}</span></td>
                                        <td className="px-6 py-4">{log.quantity}</td>
                                        <td className="px-6 py-4">{log.notes}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                 </div>
            </div>

            {isItemModalOpen && editingItem && <Modal title={'id' in editingItem ? 'Sửa vật phẩm' : 'Thêm vật phẩm'} onClose={handleCloseItemModal}><ItemForm item={editingItem} onSave={handleSaveItem} onCancel={handleCloseItemModal} /></Modal>}
            {isLogModalOpen && <Modal title="Ghi chép Kho" onClose={handleCloseLogModal}><LogForm items={items} batches={batches} farmId={selectedFarm.id} onSave={handleSaveLog} onCancel={handleCloseLogModal} /></Modal>}
            {isAuditModalOpen && <Modal title="Tạo Kiểm kê kho" onClose={handleCloseAuditModal}><AuditForm items={items} farmId={selectedFarm.id} onSave={handleSaveAudit} onCancel={handleCloseAuditModal} /></Modal>}
            {itemToDelete && <ConfirmationModal title="Xóa Vật phẩm" message={`Bạn có chắc chắn muốn xóa ${itemToDelete.name}?`} onConfirm={handleDeleteItem} onCancel={() => setItemToDelete(null)} />}
        </div>
    );
};

const ItemForm: React.FC<{ item: any, onSave: (data: any) => void, onCancel: () => void }> = ({ item, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev:any) => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
    return <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Tên vật phẩm" required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
        <input name="category" value={formData.category} onChange={handleChange} placeholder="Loại" required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
        <div className="flex gap-4">
            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Số lượng" required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
            <input name="unit" value={formData.unit} onChange={handleChange} placeholder="Đơn vị (kg, l)" required className="w-1/3 p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
        </div>
        <input type="number" name="lowStockThreshold" value={formData.lowStockThreshold} onChange={handleChange} placeholder="Ngưỡng báo hết" required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
        <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">Hủy</button><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button></div>
    </form>;
};

const LogForm: React.FC<{ items: InventoryItem[], batches: Batch[], farmId: string, onSave: (data: any) => void, onCancel: () => void }> = ({ items, batches, farmId, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ ...initialLogState, farmId });
    const [enclosures, setEnclosures] = useState<Enclosure[]>([]);
    const [animals, setAnimals] = useState<Animal[]>([]);
    useEffect(() => { if (formData.type === 'OUT') { apiClient<Enclosure[]>(`/enclosures?farmId=${farmId}`).then(setEnclosures); apiClient<Animal[]>(`/animals?farmId=${farmId}`).then(setAnimals); } }, [formData.type, farmId]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.name === 'quantity' ? parseFloat(e.target.value) : e.target.value })); };
    const handleTargetChange = (e: React.ChangeEvent<HTMLSelectElement>) => { setFormData(prev => ({ ...prev, usageTarget: { ...prev.usageTarget, [e.target.name]: e.target.value } as any })); };
    const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };
    return <form onSubmit={handleSubmit} className="space-y-4">
        <select name="itemId" value={formData.itemId} onChange={handleChange} required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"><option value="">Chọn vật phẩm</option>{items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>
        <div className="flex gap-4">
            <select name="type" value={formData.type} onChange={handleChange} required className="w-1/3 p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"><option value="OUT">Xuất</option><option value="IN">Nhập</option></select>
            <input type="number" step="any" name="quantity" value={formData.quantity} onChange={handleChange} placeholder="Số lượng" required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
        </div>
        <select name="batchCode" value={formData.batchCode || ''} onChange={handleChange} className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"><option value="">Lô (Tùy chọn)</option>{batches.filter(b => b.type === 'INVENTORY').map(b => <option key={b.id} value={b.batchCode}>{b.batchCode}</option>)}</select>
        {formData.type === 'OUT' && <div className="p-4 border rounded-lg space-y-3 dark:border-gray-700">
            <h3 className="text-sm font-medium">Mục tiêu sử dụng (Tùy chọn)</h3>
            <select name="type" value={formData.usageTarget?.type || ''} onChange={handleTargetChange} className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"><option value="">Chọn loại mục tiêu</option><option value="ENCLOSURE">Chuồng trại</option><option value="ANIMAL">Vật nuôi</option></select>
            {formData.usageTarget?.type === 'ENCLOSURE' && <select name="id" value={formData.usageTarget?.id || ''} onChange={handleTargetChange} className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"><option value="">Chọn chuồng</option>{enclosures.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select>}
            {formData.usageTarget?.type === 'ANIMAL' && <select name="id" value={formData.usageTarget?.id || ''} onChange={handleTargetChange} className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"><option value="">Chọn vật nuôi</option>{animals.map(a => <option key={a.id} value={a.id}>{a.tagId} - {a.species}</option>)}</select>}
        </div>}
        <textarea name="notes" value={formData.notes} onChange={handleChange} placeholder="Ghi chú" rows={3} className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
        <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"/>
        <div className="flex justify-end space-x-3 pt-4"><button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">Hủy</button><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button></div>
    </form>;
};

const AuditForm: React.FC<{ items: InventoryItem[], farmId: string, onSave: (data: any) => void, onCancel: () => void }> = ({ items, farmId, onSave, onCancel }) => {
    const [auditItems, setAuditItems] = useState<AuditItem[]>(items.map(item => ({ itemId: item.id, itemName: item.name, expectedQuantity: item.quantity, countedQuantity: item.quantity, discrepancy: 0 })));
    const handleCountChange = (itemId: string, counted: number) => {
        setAuditItems(currentItems => currentItems.map(item => item.itemId === itemId ? { ...item, countedQuantity: counted, discrepancy: counted - item.expectedQuantity } : item));
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ farmId, date: new Date().toISOString().split('T')[0], items: auditItems });
    };
    return <form onSubmit={handleSubmit}>
        <div className="max-h-96 overflow-y-auto space-y-2 p-1">
            {auditItems.map(item => (
                <div key={item.itemId} className="grid grid-cols-3 gap-2 items-center">
                    <label className="truncate">{item.itemName}</label>
                    <span className="text-center p-2 rounded-md bg-gray-100 dark:bg-gray-700">{item.expectedQuantity}</span>
                    <input type="number" value={item.countedQuantity} onChange={e => handleCountChange(item.itemId, parseInt(e.target.value) || 0)} className="w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                </div>
            ))}
        </div>
        <div className="flex justify-end space-x-3 pt-4 mt-4 border-t dark:border-gray-700"><button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600">Hủy</button><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu Kiểm kê</button></div>
    </form>;
};

export default InventoryView;
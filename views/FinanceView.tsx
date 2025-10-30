import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FinancialTransaction, Batch } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { useNotification } from '../contexts/NotificationContext';
import { EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, XIcon } from '../constants';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import apiClient from '../apiClient';

const initialTransactionState: Omit<FinancialTransaction, 'id' | 'recordedBy'> = {
    farmId: '',
    type: 'EXPENSE',
    amount: 0,
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
};

const initialFilters = {
    type: '',
    startDate: '',
    endDate: '',
    sortBy: 'date',
    sortDirection: 'desc'
};

const buildQueryString = (params: Record<string, string | number>) => {
    const query = new URLSearchParams();
    for (const key in params) {
        if (params[key]) {
            query.set(key, String(params[key]));
        }
    }
    return query.toString();
};

const PnLCard: React.FC<{ title: string; value: string; color: string; }> = ({ title, value, color }) => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-md">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
        <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
);

const FinanceView: React.FC = () => {
    const { selectedFarm } = useFarm();
    const { addNotification } = useNotification();
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | Omit<FinancialTransaction, 'id' | 'recordedBy'> | null>(null);
    const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null);
    const [filters, setFilters] = useState(initialFilters);

    const fetchData = useCallback(async () => {
        if (!selectedFarm) {
            setTransactions([]);
            setBatches([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const queryParams = buildQueryString({
                farmId: selectedFarm.id,
                type: filters.type,
                startDate: filters.startDate ? new Date(filters.startDate).toISOString() : '',
                endDate: filters.endDate ? new Date(new Date(filters.endDate).setHours(23,59,59,999)).toISOString() : '',
                sortBy: filters.sortBy,
                sortDirection: filters.sortDirection,
            });

            const [transData, batchesData] = await Promise.all([
                apiClient<FinancialTransaction[]>(`/financial-transactions?${queryParams}`),
                apiClient<Batch[]>(`/batches?farmId=${selectedFarm.id}`)
            ]);
            setTransactions(transData);
            setBatches(batchesData);
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
    
    const resetFilters = () => {
        setFilters(initialFilters);
    };

    const isFiltered = useMemo(() => JSON.stringify(filters) !== JSON.stringify(initialFilters), [filters]);

    const { totalRevenue, totalExpense, net } = useMemo(() => {
        const revenue = transactions.filter(t => t.type === 'REVENUE').reduce((sum, t) => sum + t.amount, 0);
        const expense = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);
        return {
            totalRevenue: revenue,
            totalExpense: expense,
            net: revenue - expense,
        };
    }, [transactions]);

    const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    const handleOpenModal = (transaction: FinancialTransaction | null = null) => {
        setEditingTransaction(transaction || { ...initialTransactionState, farmId: selectedFarm?.id || '' });
        setIsModalOpen(true);
    };
    const handleCloseModal = () => setIsModalOpen(false);

    const handleSaveTransaction = async (data: FinancialTransaction | Omit<FinancialTransaction, 'id' | 'recordedBy'>) => {
        const isEditing = 'id' in data;
        const endpoint = isEditing ? `/financial-transactions/${data.id}` : '/financial-transactions';
        const method = isEditing ? 'PUT' : 'POST';
        try {
            await apiClient(endpoint, { method, body: JSON.stringify(data) });
            addNotification(`Giao dịch đã được ${isEditing ? 'cập nhật' : 'tạo'} thành công.`, 'success');
            handleCloseModal();
            fetchData();
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };

    const handleDeleteTransaction = async () => {
        if (!transactionToDelete) return;

        try {
            await apiClient(`/financial-transactions/${transactionToDelete.id}`, { method: 'DELETE' });
            addNotification(`Giao dịch đã được xóa.`, 'success');
            fetchData();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setTransactionToDelete(null);
        }
    };

    if (isLoading) return <div className="flex justify-center items-center h-full"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-primary-600"></div></div>;
    if (!selectedFarm) return <div className="p-4 text-center text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-lg">Vui lòng chọn một trang trại để xem tài chính.</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Quản lý Tài chính</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PnLCard title="Tổng doanh thu" value={formatCurrency(totalRevenue)} color="text-green-500" />
                <PnLCard title="Tổng chi phí" value={formatCurrency(totalExpense)} color="text-red-500" />
                <PnLCard title="Lợi nhuận ròng" value={formatCurrency(net)} color={net >= 0 ? 'text-blue-500' : 'text-red-500'} />
            </div>

            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">Lịch sử giao dịch</h3>
                <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Thêm Giao dịch</button>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Loại:</label>
                    <select value={filters.type} onChange={e => handleFilterChange('type', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        <option value="">Tất cả</option>
                        <option value="REVENUE">Doanh thu</option>
                        <option value="EXPENSE">Chi phí</option>
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Từ:</label>
                    <input type="date" value={filters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Đến:</label>
                    <input type="date" value={filters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm" />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Sắp xếp:</label>
                    <select value={filters.sortBy} onChange={e => handleFilterChange('sortBy', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        <option value="date">Ngày</option>
                        <option value="amount">Số tiền</option>
                    </select>
                </div>
                 <button onClick={() => handleFilterChange('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')} className="p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                    {filters.sortDirection === 'asc' ? <ArrowUpIcon className="w-5 h-5"/> : <ArrowDownIcon className="w-5 h-5"/>}
                </button>
                {isFiltered && <button onClick={resetFilters} className="p-2 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"><XIcon className="w-4 h-4"/> Xóa bộ lọc</button>}
            </div>

            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Ngày</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Loại</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Mô tả</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Lô liên quan</th>
                                <th className="px-6 py-3 text-right text-xs font-medium uppercase">Số tiền</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {transactions.map(t => (
                                <tr key={t.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{new Date(t.date).toLocaleDateString('vi-VN')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 inline-flex font-semibold rounded-full text-xs ${t.type === 'REVENUE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{t.type}</span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{t.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{batches.find(b => b.id === t.relatedBatchId)?.batchCode || 'N/A'}</td>
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${t.type === 'REVENUE' ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(t.amount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-4">
                                        <button onClick={() => handleOpenModal(t)} className="text-primary-600 hover:text-primary-900"><EditIcon className="w-5 h-5" /></button>
                                        <button onClick={() => setTransactionToDelete(t)} className="text-red-600 hover:text-red-900"><TrashIcon className="w-5 h-5" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && editingTransaction && (
                <Modal title={'id' in editingTransaction ? 'Sửa giao dịch' : 'Thêm giao dịch'} onClose={handleCloseModal}>
                    <TransactionForm transaction={editingTransaction} batches={batches} onSave={handleSaveTransaction} onCancel={handleCloseModal} />
                </Modal>
            )}

            {transactionToDelete && (
                <ConfirmationModal
                    title="Xóa Giao dịch"
                    message="Bạn có chắc chắn muốn xóa giao dịch này?"
                    onConfirm={handleDeleteTransaction}
                    onCancel={() => setTransactionToDelete(null)}
                />
            )}
        </div>
    );
};

const TransactionForm: React.FC<{ transaction: any, batches: Batch[], onSave: (data: any) => void, onCancel: () => void }> = ({ transaction, batches, onSave, onCancel }) => {
    const [formData, setFormData] = useState(transaction);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev: any) => ({ ...prev, [name]: type === 'number' ? parseFloat(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label>Loại giao dịch</label>
                    <select name="type" value={formData.type} onChange={handleChange} required className="mt-1 block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                        <option value="EXPENSE">Chi phí</option>
                        <option value="REVENUE">Doanh thu</option>
                    </select>
                </div>
                <div>
                    <label>Số tiền</label>
                    <input type="number" step="any" name="amount" value={formData.amount} onChange={handleChange} required className="mt-1 block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
                </div>
            </div>
            <input name="description" value={formData.description} onChange={handleChange} placeholder="Mô tả" required className="block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
            <input name="category" value={formData.category} onChange={handleChange} placeholder="Danh mục" required className="block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
             <div>
                <label>Lô liên quan (Tùy chọn)</label>
                <select name="relatedBatchId" value={formData.relatedBatchId || ''} onChange={handleChange} className="mt-1 block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
                    <option value="">Không có</option>
                    {batches.map(b => <option key={b.id} value={b.id}>{b.batchCode}</option>)}
                </select>
            </div>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required className="block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" />
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
            </div>
        </form>
    );
};

export default FinanceView;
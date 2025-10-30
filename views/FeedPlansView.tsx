import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { FeedPlan, FeedPlanStage, FeedDetail } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { useNotification } from '../contexts/NotificationContext';
import { EditIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, XIcon } from '../constants';
import Modal from '../components/Modal';
import ConfirmationModal from '../components/ConfirmationModal';
import apiClient from '../apiClient';
import { feedPlanStageMap, translate } from '../utils/translations';

const initialFeedPlanState: Omit<FeedPlan, 'id'> = {
    farmId: '',
    name: '',
    stage: FeedPlanStage.STARTER,
    description: '',
    feedDetails: [],
};

const initialFilters = {
    stage: '',
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

const FeedPlansView: React.FC = () => {
    const [feedPlans, setFeedPlans] = useState<FeedPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFeedPlan, setEditingFeedPlan] = useState<FeedPlan | Omit<FeedPlan, 'id'> | null>(null);
    const [planToDelete, setPlanToDelete] = useState<FeedPlan | null>(null);
    const [filters, setFilters] = useState(initialFilters);

    const { selectedFarm } = useFarm();
    const { addNotification } = useNotification();

    const fetchFeedPlans = useCallback(async () => {
        if (!selectedFarm) {
            setFeedPlans([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const queryParams = buildQueryString({
                farmId: selectedFarm.id,
                ...filters,
            });
            const data = await apiClient<FeedPlan[]>(`/feed-plans?${queryParams}`);
            setFeedPlans(data);
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm, addNotification, filters]);

    useEffect(() => {
        fetchFeedPlans();
    }, [fetchFeedPlans]);

    const handleFilterChange = (key: keyof typeof filters, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    const resetFilters = () => setFilters(initialFilters);
    const isFiltered = useMemo(() => JSON.stringify(filters) !== JSON.stringify(initialFilters), [filters]);

    const handleOpenModal = (plan: FeedPlan | null = null) => {
        setEditingFeedPlan(plan || { ...initialFeedPlanState, farmId: selectedFarm?.id || '' });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingFeedPlan(null);
    };

    const handleSaveFeedPlan = async (planData: FeedPlan | Omit<FeedPlan, 'id'>) => {
        const isEditing = 'id' in planData;
        const endpoint = isEditing ? `/feed-plans/${planData.id}` : `/feed-plans`;
        const method = isEditing ? 'PUT' : 'POST';
        
        try {
            await apiClient(endpoint, {
                method,
                body: JSON.stringify(planData),
            });
            addNotification(`Kế hoạch ăn đã được ${isEditing ? 'cập nhật' : 'tạo'} thành công.`, 'success');
            handleCloseModal();
            fetchFeedPlans();
        } catch (err: any) {
            addNotification(err.message, 'error');
        }
    };
    
    const handleDeleteFeedPlan = async () => {
        if (!planToDelete) return;

        try {
            await apiClient(`/feed-plans/${planToDelete.id}`, { method: 'DELETE' });
            addNotification(`Kế hoạch ăn ${planToDelete.name} đã được xóa.`, 'success');
            fetchFeedPlans();
        } catch (err: any) {
            addNotification(err.message, 'error');
        } finally {
            setPlanToDelete(null);
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
                Vui lòng chọn một trang trại để xem kế hoạch ăn.
            </div>
         );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Quản lý Kế hoạch ăn</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                    Thêm Kế hoạch
                </button>
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Giai đoạn:</label>
                    <select value={filters.stage} onChange={e => handleFilterChange('stage', e.target.value)} className="p-2 rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-sm">
                        <option value="">Tất cả</option>
                        {Object.entries(feedPlanStageMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                    </select>
                </div>
                 <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Sắp xếp theo tên:</label>
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên kế hoạch</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Giai đoạn</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mô tả</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {feedPlans.length > 0 ? feedPlans.map((plan) => (
                                <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{plan.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">{translate(feedPlanStageMap, plan.stage)}</span></td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">{plan.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleOpenModal(plan)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => setPlanToDelete(plan)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        Không tìm thấy kế hoạch ăn nào cho trang trại này.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && editingFeedPlan && (
                <Modal 
                    title={ 'id' in editingFeedPlan ? 'Sửa kế hoạch ăn' : 'Thêm kế hoạch ăn mới'} 
                    onClose={handleCloseModal}
                >
                    <FeedPlanForm 
                        plan={editingFeedPlan} 
                        onSave={handleSaveFeedPlan} 
                        onCancel={handleCloseModal} 
                    />
                </Modal>
            )}

            {planToDelete && (
                <ConfirmationModal
                    title="Xóa Kế hoạch ăn"
                    message={`Bạn có chắc chắn muốn xóa kế hoạch ${planToDelete.name}?`}
                    onConfirm={handleDeleteFeedPlan}
                    onCancel={() => setPlanToDelete(null)}
                />
            )}
        </div>
    );
};

interface FeedPlanFormProps {
    plan: FeedPlan | Omit<FeedPlan, 'id'>;
    onSave: (plan: FeedPlan | Omit<FeedPlan, 'id'>) => void;
    onCancel: () => void;
}

const FeedPlanForm: React.FC<FeedPlanFormProps> = ({ plan, onSave, onCancel }) => {
    const [formData, setFormData] = useState(plan);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFeedDetailChange = (index: number, field: keyof FeedDetail, value: string) => {
        const updatedDetails = [...formData.feedDetails];
        const detail = updatedDetails[index];
        if (field === 'amount') {
            detail.amount = parseFloat(value) || 0;
        } else {
            detail.feedId = value;
        }
        setFormData(prev => ({ ...prev, feedDetails: updatedDetails }));
    };

    const handleAddFeedDetail = () => {
        setFormData(prev => ({
            ...prev,
            feedDetails: [...prev.feedDetails, { feedId: '', amount: 0 }]
        }));
    };
    
    const handleRemoveFeedDetail = (index: number) => {
        const updatedDetails = formData.feedDetails.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, feedDetails: updatedDetails }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên kế hoạch</label>
                    <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="stage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Giai đoạn</label>
                    <select name="stage" id="stage" value={formData.stage} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        {Object.entries(feedPlanStageMap).map(([key, value]) => <option key={key} value={key as FeedPlanStage}>{value}</option>)}
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={3} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
            </div>

            <div>
                <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Chi tiết thức ăn</h4>
                <div className="space-y-3">
                    {formData.feedDetails.map((detail, index) => (
                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                            <input
                                type="text"
                                placeholder="ID Thức ăn"
                                value={detail.feedId}
                                onChange={(e) => handleFeedDetailChange(index, 'feedId', e.target.value)}
                                className="block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700"
                            />
                             <input
                                type="number"
                                placeholder="Số lượng"
                                value={detail.amount}
                                onChange={(e) => handleFeedDetailChange(index, 'amount', e.target.value)}
                                className="block w-1/3 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700"
                            />
                            <button type="button" onClick={() => handleRemoveFeedDetail(index)} className="p-2 text-red-500 hover:text-red-700 dark:hover:text-red-400">
                                <TrashIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    ))}
                </div>
                 <button type="button" onClick={handleAddFeedDetail} className="mt-2 px-3 py-1.5 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">
                    + Thêm nguyên liệu
                </button>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
            </div>
        </form>
    );
};

export default FeedPlansView;
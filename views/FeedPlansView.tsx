import React, { useState, useEffect, useCallback } from 'react';
import { FeedPlan } from '../types';
import { useFarm } from '../contexts/FarmContext';
import { EditIcon, TrashIcon } from '../constants';
import Modal from '../components/Modal';
import apiClient from '../apiClient';

const initialFeedPlanState: Omit<FeedPlan, 'id'> = {
    farmId: '',
    name: '',
    description: '',
};

const FeedPlansView: React.FC = () => {
    const [feedPlans, setFeedPlans] = useState<FeedPlan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingFeedPlan, setEditingFeedPlan] = useState<FeedPlan | Omit<FeedPlan, 'id'> | null>(null);
    
    const { selectedFarm } = useFarm();

    const fetchFeedPlans = useCallback(async () => {
        if (!selectedFarm) {
            setFeedPlans([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const data = await apiClient<FeedPlan[]>(`/feed-plans?farmId=${selectedFarm.id}`);
            setFeedPlans(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [selectedFarm]);

    useEffect(() => {
        fetchFeedPlans();
    }, [fetchFeedPlans]);

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
            handleCloseModal();
            fetchFeedPlans();
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleDeleteFeedPlan = async (planId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa kế hoạch ăn này không?')) {
            try {
                await apiClient(`/feed-plans/${planId}`, { method: 'DELETE' });
                fetchFeedPlans();
            } catch (err: any) {
                setError(err.message);
            }
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
            
             {error && <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg">{error}</div>}

            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tên kế hoạch</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Mô tả</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Hành động</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {feedPlans.length > 0 ? feedPlans.map((plan) => (
                                <tr key={plan.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{plan.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">{plan.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleOpenModal(plan)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteFeedPlan(plan.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={3} className="text-center py-10 text-gray-500 dark:text-gray-400">
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
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tên kế hoạch</label>
                <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Mô tả</label>
                <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows={4} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Hủy</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Lưu</button>
            </div>
        </form>
    );
};

export default FeedPlansView;

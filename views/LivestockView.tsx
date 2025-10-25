import React, { useState, useEffect, useCallback } from 'react';
import { Animal } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useFarm } from '../contexts/FarmContext';
import { EditIcon, TrashIcon } from '../constants';
import Modal from '../components/Modal';

const API_BASE_URL = '/api/v1';

const ANIMAL_TYPES = ['BREEDING_FEMALE', 'DEVELOPMENT', 'FATTENING', 'YOUNG'];
const STATUS_TYPES = ['HEALTHY', 'SICK', 'SOLD', 'DEAD'];

const initialAnimalState: Omit<Animal, 'id'> = {
    farmId: '',
    tagId: '',
    species: '',
    animalType: 'YOUNG',
    status: 'HEALTHY',
    enclosureId: '', // Should be a dropdown in a real app
    birthDate: new Date().toISOString().split('T')[0],
};

const LivestockView: React.FC = () => {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAnimal, setEditingAnimal] = useState<Animal | Omit<Animal, 'id'> | null>(null);
    
    const { token, user } = useAuth();
    const { selectedFarm } = useFarm();

    const fetchAnimals = useCallback(async () => {
        if (!token || !selectedFarm) {
            setAnimals([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/animals?farmId=${selectedFarm.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch livestock data.');
            }
            const data = await response.json();
            setAnimals(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    }, [token, selectedFarm]);

    useEffect(() => {
        fetchAnimals();
    }, [fetchAnimals]);

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

    const handleSaveAnimal = async (animalData: Animal | Omit<Animal, 'id'>) => {
        if (!token || !user) return;
        
        const isEditing = 'id' in animalData;
        const url = isEditing ? `${API_BASE_URL}/animals/${animalData.id}` : `${API_BASE_URL}/animals`;
        const method = isEditing ? 'PUT' : 'POST';

        // Add dummy values for fields not in form
        const payload = {
            ...animalData,
            enclosureId: animalData.enclosureId || null,
            feedPlanId: null,
            healthRecords: [],
            growthRecords: [],
            reproductionLogs: [],
        };
        
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'user-id': user.id
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to ${isEditing ? 'update' : 'create'} animal.`);
            }
            handleCloseModal();
            fetchAnimals(); // Refresh data
        } catch (err: any) {
            setError(err.message);
        }
    };
    
    const handleDeleteAnimal = async (animalId: string) => {
        if (!token || !user) return;
        if (window.confirm('Are you sure you want to delete this animal?')) {
            try {
                const response = await fetch(`${API_BASE_URL}/animals/${animalId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'user-id': user.id
                    }
                });
                if (!response.ok) {
                    throw new Error('Failed to delete animal.');
                }
                fetchAnimals(); // Refresh data
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
                Please select a farm to view livestock.
            </div>
         );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Livestock Management</h2>
                <button
                    onClick={() => handleOpenModal()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                >
                    Add Animal
                </button>
            </div>
            
             {error && <div className="p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg">{error}</div>}

            <div className="bg-white dark:bg-gray-900 shadow-md rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Tag ID</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Species</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Birth Date</th>
                                <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {animals.length > 0 ? animals.map((animal) => (
                                <tr key={animal.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{animal.tagId}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{animal.species}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{animal.animalType}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            animal.status === 'HEALTHY' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                                            animal.status === 'SICK' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                        }`}>
                                            {animal.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(animal.birthDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                                        <button onClick={() => handleOpenModal(animal)} className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-200">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteAnimal(animal.id)} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        No livestock found for this farm.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && editingAnimal && (
                <Modal 
                    title={ 'id' in editingAnimal ? 'Edit Animal' : 'Add Animal'} 
                    onClose={handleCloseModal}
                >
                    <AnimalForm 
                        animal={editingAnimal} 
                        onSave={handleSaveAnimal} 
                        onCancel={handleCloseModal} 
                    />
                </Modal>
            )}
        </div>
    );
};

interface AnimalFormProps {
    animal: Animal | Omit<Animal, 'id'>;
    onSave: (animal: Animal | Omit<Animal, 'id'>) => void;
    onCancel: () => void;
}

const AnimalForm: React.FC<AnimalFormProps> = ({ animal, onSave, onCancel }) => {
    const [formData, setFormData] = useState(animal);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
                    <label htmlFor="tagId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tag ID</label>
                    <input type="text" name="tagId" id="tagId" value={formData.tagId} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="species" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Species</label>
                    <input type="text" name="species" id="species" value={formData.species} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
                <div>
                    <label htmlFor="animalType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Animal Type</label>
                    <select name="animalType" id="animalType" value={formData.animalType} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        {ANIMAL_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                    <select name="status" id="status" value={formData.status} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700">
                        {STATUS_TYPES.map(status => <option key={status} value={status}>{status}</option>)}
                    </select>
                </div>
                 <div>
                    <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Birth Date</label>
                    <input type="date" name="birthDate" id="birthDate" value={formData.birthDate} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm bg-white dark:bg-gray-700" />
                </div>
            </div>
            <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">Save</button>
            </div>
        </form>
    );
};

export default LivestockView;

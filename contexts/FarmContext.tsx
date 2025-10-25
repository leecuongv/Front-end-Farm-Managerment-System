
import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Farm, Role } from '../types';

const API_BASE_URL = '/api/v1';

interface FarmContextType {
    farms: Farm[];
    userFarms: Farm[];
    selectedFarm: Farm | null;
    selectFarm: (farmId: string) => void;
    isLoading: boolean;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider = ({ children }: { children: ReactNode }) => {
    const { user, token } = useAuth();
    const [farms, setFarms] = useState<Farm[]>([]);
    const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch all farms (for admins)
    const fetchAllFarms = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/farms`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Failed to fetch farms');
            const data: Farm[] = await response.json();
            setFarms(data);
        } catch (error) {
            console.error(error);
            setFarms([]);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAllFarms();
    }, [fetchAllFarms]);

    const userFarms = user?.role === Role.ADMIN ? farms : farms.filter(farm => user?.farmIds.includes(farm.id));
    
    useEffect(() => {
        // Auto-select first farm on load or when user farms change
        if (userFarms.length > 0 && !selectedFarm) {
            setSelectedFarm(userFarms[0]);
        } else if (userFarms.length === 0) {
            setSelectedFarm(null);
        }
    }, [userFarms, selectedFarm]);

    const selectFarm = (farmId: string) => {
        const farm = farms.find(f => f.id === farmId);
        if (farm) {
            setSelectedFarm(farm);
        }
    };
    
    return (
        <FarmContext.Provider value={{ farms, userFarms, selectedFarm, selectFarm, isLoading }}>
            {children}
        </FarmContext.Provider>
    );
};

export const useFarm = () => {
    const context = useContext(FarmContext);
    if (context === undefined) {
        throw new Error('useFarm must be used within a FarmProvider');
    }
    return context;
};

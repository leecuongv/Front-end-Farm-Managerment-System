import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Farm, Role } from '../types';
import apiClient from '../apiClient';

interface FarmContextType {
    farms: Farm[];
    userFarms: Farm[];
    selectedFarm: Farm | null;
    selectFarm: (farmId: string) => void;
    isLoading: boolean;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [farms, setFarms] = useState<Farm[]>([]);
    const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchAllFarms = useCallback(async () => {
        if (!user) {
            setFarms([]);
            return;
        };
        setIsLoading(true);
        try {
            const data = await apiClient<Farm[]>('/farms');
            setFarms(data);
        } catch (error) {
            console.error(error);
            setFarms([]);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        // Fetch farms when the user logs in
        if (user) {
            fetchAllFarms();
        } else {
            // Clear data on logout
            setFarms([]);
            setSelectedFarm(null);
            setIsLoading(false);
        }
    }, [user, fetchAllFarms]);

    const userFarms = user?.role === Role.ADMIN ? farms : farms.filter(farm => user?.farmIds.includes(farm.id));
    
    useEffect(() => {
        // Auto-select the first farm in the list when the list becomes available,
        // or if the currently selected farm becomes invalid.
        if (userFarms.length > 0) {
            const isSelectedFarmValid = selectedFarm && userFarms.some(f => f.id === selectedFarm.id);
            if (!isSelectedFarmValid) {
                setSelectedFarm(userFarms[0]);
            }
        } else {
            setSelectedFarm(null);
        }
    // This effect should ONLY run when the list of available farms changes.
    }, [userFarms]);

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
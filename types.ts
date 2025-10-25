export enum Role {
    ADMIN = 'ADMIN',
    MANAGER = 'MANAGER',
    STAFF = 'STAFF',
}

export interface User {
    id: string;
    username: string;
    fullName: string;
    email: string;
    role: Role;
    farmIds: string[];
    isActive: boolean;
    avatarUrl: string; // Keep for UI, will be populated with a placeholder
}

export interface Farm {
    id: string;
    name: string;
    location: string;
}

export interface Enclosure {
    id: string;
    farmId: string;
    name: string;
    type: 'BREEDING_PEN' | 'DEVELOPMENT_PEN' | 'FATTENING_PEN' | 'YOUNG_PEN';
    capacity: number;
    currentOccupancy: number;
}

export interface Animal {
    id: string;
    farmId: string;
    tagId: string;
    species: string;
    animalType: 'BREEDING_FEMALE' | 'DEVELOPMENT' | 'FATTENING' | 'YOUNG';
    status: 'HEALTHY' | 'SICK' | 'SOLD' | 'DEAD';
    enclosureId: string;
    birthDate: string;
}

export interface InventoryItem {
    id: string;
    farmId: string;
    name: string;
    category: 'FEED' | 'MEDICINE' | 'FERTILIZER' | 'SEED';
    quantity: number;
    unit: string;
    lowStockThreshold: number;
}

export interface Task {
    id: string;
    farmId: string;
    title: string;
    assignedTo: string; // User ID
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    dueDate: string;
}

export interface FinancialTransaction {
    id: string;
    farmId: string;
    type: 'EXPENSE' | 'REVENUE';
    amount: number;
    description: string;
    category: string;
    date: string;
}
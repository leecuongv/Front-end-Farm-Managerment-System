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
    id:string;
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
    batchId?: string;
    feedPlanId?: string;
}

export interface AnimalEvent {
    id: string;
    animalId: string;
    type: string;
    date: string;
    notes: string;
}

export interface Plot {
    id: string;
    farmId: string;
    name: string;
    area: number;
    location: string;
}

export interface Season {
    id: string;
    farmId: string;
    name: string;
    cropType: string;
    startDate: string;
    endDate: string;
    plotIds: string[];
    notes: string;
}

export interface CropEvent {
    id: string;
    farmId: string;
    plotId: string;
    seasonId: string;
    eventType: string;
    date: string;
    notes: string;
    recordedBy: string;
}

export enum FeedPlanStage {
    STARTER = 'STARTER',
    GROWER = 'GROWER',
    FINISHER = 'FINISHER',
    LACTATION = 'LACTATION',
    GESTATION = 'GESTATION',
}

export interface FeedDetail {
    feedId: string;
    amount: number;
}

export interface FeedPlan {
    id: string;
    farmId: string;
    name: string;
    stage: FeedPlanStage;
    description: string;
    feedDetails: FeedDetail[];
}

export interface InventoryItem {
    id: string;
    farmId: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    lowStockThreshold: number;
}

export interface AuditItem {
    itemId: string;
    itemName: string;
    expectedQuantity: number;
    countedQuantity: number;
    discrepancy: number;
}

export interface InventoryAudit {
    id: string;
    farmId: string;
    date: string;
    recordedBy: string;
    items: AuditItem[];
}


export interface InventoryLog {
    id: string;
    farmId: string;
    itemId: string;
    batchCode?: string;
    type: 'IN' | 'OUT';
    quantity: number;
    notes?: string;
    usageTarget?: {
        type: 'ENCLOSURE' | 'ANIMAL';
        id: string;
    };
    recordedBy: string;
    date: string;
}

export interface Task {
    id: string;
    farmId: string;
    title: string;
    description: string;
    assignedTo: string; // User ID
    status: 'TODO' | 'IN_PROGRESS' | 'DONE';
    dueDate: string;
    createdAt: string;
    createdBy: string;
}

export interface FinancialTransaction {
    id: string;
    farmId: string;
    type: 'EXPENSE' | 'REVENUE';
    amount: number;
    description: string;
    category: string;
    date: string;
    recordedBy: string;
    relatedBatchId?: string;
}

export interface Batch {
    id: string;
    farmId: string;
    batchCode: string;
    type: 'ANIMAL' | 'CROP' | 'INVENTORY';
    description: string;
    source?: string;
    entryDate: string;
    relatedItemIds?: string[];
}
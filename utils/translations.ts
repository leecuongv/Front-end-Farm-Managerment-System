import { Role, FeedPlanStage } from '../types';

export const roleMap: Record<Role, string> = {
    [Role.ADMIN]: 'Quản trị viên',
    [Role.MANAGER]: 'Quản lý',
    [Role.STAFF]: 'Nhân viên',
};

export const animalStatusMap: Record<string, string> = {
    'HEALTHY': 'Khỏe mạnh',
    'SICK': 'Bị bệnh',
    'SOLD': 'Đã bán',
    'DEAD': 'Đã chết',
};

export const animalTypeMap: Record<string, string> = {
    'BREEDING_FEMALE': 'Nái sinh sản',
    'DEVELOPMENT': 'Hậu bị',
    'FATTENING': 'Vỗ béo',
    'YOUNG': 'Con non',
};

export const animalEventMap: Record<string, string> = {
    'VACCINATION': 'Tiêm phòng',
    'TREATMENT': 'Điều trị',
    'HEALTH_CHECK': 'Kiểm tra sức khỏe',
    'WEIGHING': 'Cân',
    'BIRTH': 'Sinh sản',
};

export const enclosureTypeMap: Record<string, string> = {
    'BREEDING_PEN': 'Chuồng nái',
    'DEVELOPMENT_PEN': 'Chuồng hậu bị',
    'FATTENING_PEN': 'Chuồng vỗ béo',
    'YOUNG_PEN': 'Chuồng con',
};

export const feedPlanStageMap: Record<FeedPlanStage, string> = {
    [FeedPlanStage.STARTER]: 'Tập ăn',
    [FeedPlanStage.GROWER]: 'Tăng trưởng',
    [FeedPlanStage.FINISHER]: 'Vỗ béo',
    [FeedPlanStage.LACTATION]: 'Cho con bú',
    [FeedPlanStage.GESTATION]: 'Mang thai',
};

export const inventoryLogTypeMap: Record<string, string> = {
    'IN': 'Nhập kho',
    'OUT': 'Xuất kho',
};

export const taskStatusMap: Record<string, string> = {
    'TODO': 'Cần làm',
    'IN_PROGRESS': 'Đang làm',
    'DONE': 'Hoàn thành',
};

export const transactionTypeMap: Record<string, string> = {
    'EXPENSE': 'Chi phí',
    'REVENUE': 'Doanh thu',
};

export const batchTypeMap: Record<string, string> = {
    'ANIMAL': 'Vật nuôi',
    'CROP': 'Cây trồng',
    'INVENTORY': 'Kho',
};

export const seasonStatusMap: Record<string, string> = {
    'PLANNED': 'Dự kiến',
    'ACTIVE': 'Đang diễn ra',
    'COMPLETED': 'Hoàn thành',
};

export const cropEventTypeMap: Record<string, string> = {
    'PLANTING': 'Gieo trồng',
    'IRRIGATION': 'Tưới tiêu',
    'FERTILIZING': 'Bón phân',
    'PEST_CONTROL': 'Kiểm soát sâu bệnh',
    'HARVEST': 'Thu hoạch',
    'SOIL_PREPARATION': 'Chuẩn bị đất',
};


/**
 * A helper function to get a translation for a given key from a map.
 * Returns the original key if no translation is found.
 * @param map The translation map (e.g., roleMap).
 * @param key The key to translate (e.g., Role.ADMIN).
 * @returns The translated string or the original key.
 */
export const translate = (map: Record<string, string>, key: string | undefined): string => {
    if (!key) return 'N/A';
    return map[key] || key;
};
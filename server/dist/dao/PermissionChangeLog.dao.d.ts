import { CreateOptions } from 'sequelize';
import PermissionChangeLog, { PermissionChangeLogCreationAttributes, ChangeTargetType, ChangeAction } from '../models/PermissionChangeLog.model';
export interface PermissionChangeLogQueryParams {
    page: number;
    pageSize: number;
    operatorId?: string;
    operatorName?: string;
    targetType?: ChangeTargetType;
    targetId?: string;
    action?: ChangeAction;
    module?: string;
    startTime?: string;
    endTime?: string;
    keyword?: string;
}
export interface AnomalyDetectionParams {
    userId?: string;
    timeWindowMinutes?: number;
    frequencyThreshold?: number;
    startTime?: string;
    endTime?: string;
}
declare class PermissionChangeLogDao {
    create(data: PermissionChangeLogCreationAttributes, options?: CreateOptions): Promise<PermissionChangeLog>;
    findById(id: string): Promise<PermissionChangeLog | null>;
    findAllPaged(params: PermissionChangeLogQueryParams): Promise<{
        rows: PermissionChangeLog[];
        count: number;
    }>;
    findAllForExport(params: Omit<PermissionChangeLogQueryParams, 'page' | 'pageSize'>): Promise<PermissionChangeLog[]>;
    detectHighFrequencyOperations(params: AnomalyDetectionParams): Promise<any[]>;
    findAnomalyOperations(params: AnomalyDetectionParams): Promise<PermissionChangeLog[]>;
}
declare const _default: PermissionChangeLogDao;
export default _default;
//# sourceMappingURL=PermissionChangeLog.dao.d.ts.map
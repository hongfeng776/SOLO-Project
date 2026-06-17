import { PermissionChangeLogQueryParams, AnomalyDetectionParams } from '../dao/PermissionChangeLog.dao';
import { PermissionChangeLogCreationAttributes } from '../models/PermissionChangeLog.model';
import { PaginationResult } from '../types';
declare class PermissionChangeLogService {
    logChange(data: PermissionChangeLogCreationAttributes): Promise<void>;
    findAll(params: PermissionChangeLogQueryParams): Promise<PaginationResult<any>>;
    getDetail(id: string): Promise<any>;
    exportLogs(params: Omit<PermissionChangeLogQueryParams, 'page' | 'pageSize'>, fields: string[], sortBy: string, sortOrder: string): Promise<Buffer>;
    detectAnomalies(params: AnomalyDetectionParams): Promise<any>;
}
declare const _default: PermissionChangeLogService;
export default _default;
//# sourceMappingURL=PermissionChangeLog.service.d.ts.map
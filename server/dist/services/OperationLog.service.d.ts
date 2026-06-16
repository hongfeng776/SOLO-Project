import { PaginationResult } from '../types';
interface OperationLogQueryParams {
    page: number;
    pageSize: number;
    userId?: string;
    module?: string;
    action?: string;
    targetType?: string;
    targetId?: string;
    status?: number;
    startTime?: string;
    endTime?: string;
}
declare class OperationLogService {
    findAll(params: OperationLogQueryParams): Promise<PaginationResult<any>>;
}
declare const _default: OperationLogService;
export default _default;
//# sourceMappingURL=OperationLog.service.d.ts.map
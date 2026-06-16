import { CreateOptions } from 'sequelize';
import OperationLog, { OperationLogCreationAttributes } from '../models/OperationLog.model';
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
declare class OperationLogDao {
    create(data: OperationLogCreationAttributes, options?: CreateOptions): Promise<OperationLog>;
    findAllPaged(params: OperationLogQueryParams): Promise<{
        rows: OperationLog[];
        count: number;
    }>;
}
declare const _default: OperationLogDao;
export default _default;
//# sourceMappingURL=OperationLog.dao.d.ts.map
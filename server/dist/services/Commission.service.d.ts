import { CommissionSummary } from '../dao/Commission.dao';
import { CommissionAttributes, CommissionCreationAttributes } from '../models/Commission.model';
import { PaginationParams, PaginationResult } from '../types';
interface CommissionQueryParams extends PaginationParams {
    promoterId?: string;
    status?: number;
    type?: number;
    startTime?: string;
    endTime?: string;
}
declare class CommissionService {
    create(data: CommissionCreationAttributes): Promise<import("../models/Commission.model").Commission>;
    findById(id: string): Promise<import("../models/Commission.model").Commission>;
    findAll(params: CommissionQueryParams): Promise<PaginationResult<any>>;
    update(id: string, data: Partial<CommissionAttributes>): Promise<import("../models/Commission.model").Commission | null>;
    delete(id: string): Promise<void>;
    summary(params: Partial<CommissionQueryParams>): Promise<CommissionSummary>;
    settle(ids: string[]): Promise<void>;
}
declare const _default: CommissionService;
export default _default;
//# sourceMappingURL=Commission.service.d.ts.map
import { WithdrawAttributes, WithdrawCreationAttributes } from '../models/Withdraw.model';
import { PaginationParams, PaginationResult } from '../types';
interface WithdrawQueryParams extends PaginationParams {
    promoterId?: string;
    status?: number;
}
declare class WithdrawService {
    create(data: WithdrawCreationAttributes): Promise<import("../models/Withdraw.model").Withdraw>;
    private generateWithdrawNo;
    findById(id: string): Promise<import("../models/Withdraw.model").Withdraw>;
    findAll(params: WithdrawQueryParams): Promise<PaginationResult<any>>;
    update(id: string, data: Partial<WithdrawAttributes>): Promise<import("../models/Withdraw.model").Withdraw | null>;
    delete(id: string): Promise<void>;
    apply(data: WithdrawCreationAttributes): Promise<import("../models/Withdraw.model").Withdraw>;
    audit(id: string, approved: boolean, auditRemark?: string, auditUserId?: string): Promise<void>;
    pay(id: string, payRemark?: string): Promise<void>;
}
declare const _default: WithdrawService;
export default _default;
//# sourceMappingURL=Withdraw.service.d.ts.map
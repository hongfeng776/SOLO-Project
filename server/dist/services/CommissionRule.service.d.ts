import CommissionRule, { CommissionRuleCreationAttributes, CommissionRuleAttributes } from '../models/CommissionRule.model';
import { PaginationParams, PaginationResult } from '../types';
interface CommissionRuleQueryParams extends PaginationParams {
    keyword?: string;
    ruleType?: string;
    enabled?: boolean;
}
declare class CommissionRuleService {
    create(data: CommissionRuleCreationAttributes): Promise<CommissionRule>;
    findById(id: string): Promise<CommissionRule>;
    findAll(params: CommissionRuleQueryParams): Promise<PaginationResult<any>>;
    update(id: string, data: Partial<CommissionRuleAttributes>): Promise<CommissionRule | null>;
    delete(id: string): Promise<void>;
    toggleEnabled(id: string): Promise<void>;
    findActiveRules(ruleType?: string): Promise<CommissionRule[]>;
}
declare const _default: CommissionRuleService;
export default _default;
//# sourceMappingURL=CommissionRule.service.d.ts.map
import { PaginationParams, PaginationResult } from '../types';
import { PromoterLevel, LevelChangeSource } from '../constants/enum';
interface ThresholdValidation {
    valid: boolean;
    failingFields: {
        field: string;
        label: string;
        current: number;
        required: number;
        gap: number;
    }[];
}
interface AutoLevelResult {
    promoterId: string;
    name: string;
    code: string;
    originalLevel: string;
    newLevel: string;
    changed: boolean;
    metrics: any;
    reason?: string;
}
interface BatchLevelResult {
    total: number;
    regraded: number;
    skipped: number;
    failed: number;
    details: AutoLevelResult[];
}
interface ComplianceCheckResult {
    compliant: boolean;
    issues: string[];
    anomalyFlagged: boolean;
    anomalyReason?: string;
}
declare class PromoterLevelService {
    validateThresholds(level: string, metrics: any): Promise<ThresholdValidation>;
    getEffectiveRule(level: string): Promise<any>;
    getAllEffectiveRules(): Promise<any>;
    saveLevelRule(ruleData: any, operatorId: string): Promise<any>;
    batchReEvaluateAllLevels(operatorId: string): Promise<BatchLevelResult>;
    autoEvaluateSingleLevel(promoter: any, operatorId: string, changeSource?: LevelChangeSource): Promise<AutoLevelResult>;
    requestManualAdjust(promoterId: string, applicantId: string, targetLevel: PromoterLevel, adjustReason?: string): Promise<any>;
    reviewManualAdjust(requestId: string, approverId: string, approved: boolean, approveRemark?: string): Promise<void>;
    batchResetLevels(ids: string[], operatorId: string, resetTo?: PromoterLevel): Promise<BatchLevelResult>;
    checkLevelChangeCompliance(promoter: any, fromLevel: string, toLevel: string, metrics: any, changeSource: LevelChangeSource): Promise<ComplianceCheckResult>;
    getChangeLogs(promoterId: string, params: PaginationParams): Promise<PaginationResult<any>>;
    getIterationStatistics(params: {
        startDate?: string;
        endDate?: string;
    }): Promise<any>;
    getAdjustRequests(params: any): Promise<PaginationResult<any>>;
}
declare const _default: PromoterLevelService;
export default _default;
//# sourceMappingURL=PromoterLevel.service.d.ts.map
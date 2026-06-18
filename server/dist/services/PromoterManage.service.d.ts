import { PromoterAttributes } from '../models/Promoter.model';
import { PaginationParams, PaginationResult } from '../types';
import { PromoterLevel, SettleStatus, PromoteStatus } from '../constants/enum';
interface UniquenessCheckResult {
    duplicateFields: {
        field: string;
        value: string;
        duplicatePromoters: any[];
    }[];
    valid: boolean;
}
interface BatchUpdateResult {
    total: number;
    success: number;
    failed: number;
    skipped: number;
    details: {
        id: string;
        name: string;
        status: 'success' | 'failed' | 'skipped';
        reason?: string;
    }[];
}
interface QualificationValidateResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
declare class PromoterManageService {
    checkEditPermission(userId: string, editFields: string[]): Promise<{
        allowed: boolean;
        deniedFields: string[];
        userRole: string;
    }>;
    validateField(field: string, value: any): Promise<{
        valid: boolean;
        message?: string;
    }>;
    checkUniqueness(data: {
        phone?: string;
        wechatId?: string;
        idCard?: string;
    }, excludePromoterId?: string): Promise<UniquenessCheckResult>;
    updatePromoterInfo(promoterId: string, operatorId: string, data: Partial<PromoterAttributes> & {
        [key: string]: any;
    }): Promise<any>;
    validateQualification(data: {
        type?: string;
        fileUrl?: string;
        expireAt?: string;
        idCard?: string;
        realName?: string;
    }): Promise<QualificationValidateResult>;
    submitQualification(promoterId: string, operatorId: string, qualificationData: {
        type: string;
        title?: string;
        fileUrl: string;
        expireAt?: string;
        realName?: string;
        idCard?: string;
    }): Promise<any>;
    reviewQualification(qualificationId: string, reviewerId: string, passed: boolean, remark?: string): Promise<void>;
    batchUpdateLevel(ids: string[], targetLevel: PromoterLevel, operatorId: string): Promise<BatchUpdateResult>;
    batchUpdatePromoteStatus(ids: string[], status: PromoteStatus, operatorId: string, remark?: string): Promise<BatchUpdateResult>;
    batchUpdateSettleStatus(ids: string[], status: SettleStatus, operatorId: string, remark?: string): Promise<BatchUpdateResult>;
    getChangeLogs(promoterId: string, params: PaginationParams): Promise<PaginationResult<any>>;
    getChangeDiff(promoterId: string, logId: string): Promise<{
        before: any;
        after: any;
        fieldName: string;
        fieldLabel: string;
    }>;
    getPromoterDetail(promoterId: string): Promise<any>;
    getLevelConfigs(): Promise<{
        level: PromoterLevel;
        commissionRate: number;
        maxChannels: number;
        canUseCoupon: boolean;
        canUseCashback: boolean;
        minOrderAmount: number;
        dailyWithdrawLimit: number;
    }[]>;
}
declare const _default: PromoterManageService;
export default _default;
//# sourceMappingURL=PromoterManage.service.d.ts.map
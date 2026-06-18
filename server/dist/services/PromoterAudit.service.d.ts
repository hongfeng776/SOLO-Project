import { PromoterCreationAttributes } from '../models/Promoter.model';
import { PaginationParams, PaginationResult } from '../types';
import { AuditStage, AuditStatus } from '../constants/enum';
interface PreCheckResult {
    valid: boolean;
    errors: string[];
    blacklistMatched?: {
        items: any[];
    };
    lockInfo?: {
        locked: boolean;
        lockUntil?: Date;
        remainingHours?: number;
    };
    dataIntegrity?: {
        missingFields: string[];
    };
    riskFlags: string[];
}
interface ApplyData {
    name: string;
    phone: string;
    idCard?: string;
    wechatId?: string;
    channelId?: string;
    idCardFrontImg?: string;
    idCardBackImg?: string;
    [key: string]: any;
}
interface RejectData {
    reasonCode: string;
    customRemark?: string;
    lockDays?: number;
}
interface BatchAuditResult {
    total: number;
    success: number;
    failed: number;
    skipped: number;
    details: Array<{
        id: string;
        name: string;
        phone: string;
        status: 'success' | 'failed' | 'skipped';
        reason?: string;
    }>;
}
declare class PromoterAuditService {
    preCheckApplyData(data: ApplyData, promoterId?: string): Promise<PreCheckResult>;
    submitApply(data: PromoterCreationAttributes & ApplyData): Promise<any>;
    private generateCode;
    firstAuditPass(id: string, auditUserId: string, remark?: string): Promise<void>;
    firstAuditReject(id: string, auditUserId: string, rejectData: RejectData): Promise<void>;
    secondAuditPass(id: string, auditUserId: string, remark?: string): Promise<void>;
    secondAuditReject(id: string, auditUserId: string, rejectData: RejectData): Promise<void>;
    batchFirstPass(ids: string[], auditUserId: string): Promise<BatchAuditResult>;
    batchSecondPass(ids: string[], auditUserId: string): Promise<BatchAuditResult>;
    batchFirstReject(ids: string[], auditUserId: string, rejectData: RejectData): Promise<BatchAuditResult>;
    batchSecondReject(ids: string[], auditUserId: string, rejectData: RejectData): Promise<BatchAuditResult>;
    private batchAudit;
    getAuditList(params: PaginationParams & {
        keyword?: string;
        auditStageList?: AuditStage[];
        auditStatusList?: AuditStatus[];
        channelId?: string;
        level?: string;
        phone?: string;
        idCard?: string;
        riskFlagged?: boolean;
        startDate?: string;
        endDate?: string;
    }): Promise<PaginationResult<any>>;
    getAuditDetail(id: string): Promise<any>;
    searchAuditLogs(params: {
        page: number;
        pageSize: number;
        phone?: string;
        idCard?: string;
        promoterId?: string;
        startDate?: string;
        endDate?: string;
    }): Promise<PaginationResult<any>>;
    getStatistics(): Promise<any>;
    private sendRejectNotification;
    private getStageLabel;
    private getStatusLabel;
    private getActionLabel;
}
declare const _default: PromoterAuditService;
export default _default;
//# sourceMappingURL=PromoterAudit.service.d.ts.map
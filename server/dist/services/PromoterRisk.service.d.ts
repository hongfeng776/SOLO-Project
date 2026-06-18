import { PaginationParams, PaginationResult } from '../types';
import { RiskLevel, RiskType, RiskWarningLevel } from '../constants/enum';
interface RiskMarkCheckResult {
    canMark: boolean;
    currentRisk?: any;
    issues: string[];
}
interface HighFrequencyCheckResult {
    isHighFrequency: boolean;
    riskCount: number;
    abnormalOrderCount: number;
    complaintCount: number;
    warnings: string[];
}
interface ComplianceCheckResult {
    passed: boolean;
    abnormalDataRemaining: string[];
    issues: string[];
}
declare class PromoterRiskService {
    getRiskProfile(promoterId: string): Promise<any>;
    checkCanMarkRisk(promoterId: string, targetLevel: RiskLevel): Promise<RiskMarkCheckResult>;
    getPromoterRiskAnalysis(promoterId: string): Promise<{
        promotionData: any;
        orderData: any;
        complaintCount: number;
        abnormalOrderCount: number;
        riskHistory: any[];
    }>;
    markRisk(promoterId: string, operatorId: string, data: {
        riskLevel: RiskLevel;
        riskType: RiskType;
        riskTitle: string;
        riskDescription?: string;
        riskEvidence?: string[];
        expireAt?: string;
    }): Promise<any>;
    cancelRisk(riskRecordId: string, operatorId: string): Promise<void>;
    checkHighFrequency(promoterId: string): Promise<HighFrequencyCheckResult>;
    checkReleaseCompliance(promoterId: string, riskRecordId: string): Promise<ComplianceCheckResult>;
    submitRelease(promoterId: string, applicantId: string, data: {
        riskRecordId: string;
        releaseReason: string;
        proofMaterials?: string[];
        rectificationDesc?: string;
    }): Promise<any>;
    reviewRelease(releaseId: string, reviewerId: string, data: {
        passed: boolean;
        verifyRemark?: string;
        restoreStage?: number;
    }): Promise<void>;
    private calculateStagePermissions;
    batchMarkRisk(ids: string[], operatorId: string, data: {
        riskLevel: RiskLevel;
        riskType: RiskType;
        riskTitle: string;
        riskDescription?: string;
        expireAt?: string;
    }): Promise<any>;
    batchCancelRisk(ids: string[], operatorId: string): Promise<any>;
    createWarning(promoterId: string, warningLevel: RiskWarningLevel, warningType: string, warningTitle: string, warningDesc: string, ruleCode: string, riskScore: number): Promise<any>;
    getBehaviorTrace(promoterId: string, params: PaginationParams & {
        behaviorType?: string;
        riskFlagged?: boolean;
        startDate?: string;
        endDate?: string;
    }): Promise<PaginationResult<any>>;
    getRiskList(params: PaginationParams & {
        riskLevel?: string;
        riskType?: string;
        controlStatus?: number;
        isActive?: boolean;
    }): Promise<PaginationResult<any>>;
    getStatistics(params?: {
        startDate?: string;
        endDate?: string;
    }): Promise<any>;
    private calculateRiskScore;
}
declare const _default: PromoterRiskService;
export default _default;
//# sourceMappingURL=PromoterRisk.service.d.ts.map
import { Model, Optional } from 'sequelize';
import { PromoterLevel, ManualLevelAdjustStatus } from '../constants/enum';
interface MetricsSnapshot {
    monthlyOrders?: number;
    monthlyAmount?: number;
    activeDays?: number;
    reputationScore?: number;
}
interface PromoterLevelAdjustRequestAttributes {
    id: string;
    promoterId: string;
    applicantId?: string;
    applicantName?: string;
    fromLevel?: PromoterLevel;
    toLevel?: PromoterLevel;
    adjustReason: string;
    metricsSnapshot?: MetricsSnapshot;
    meetsThreshold?: boolean;
    approveStatus: ManualLevelAdjustStatus;
    approverId?: string;
    approverName?: string;
    approveRemark?: string;
    approvedAt?: Date;
    syncedToFrontend?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface PromoterLevelAdjustRequestCreationAttributes extends Optional<PromoterLevelAdjustRequestAttributes, 'id' | 'applicantId' | 'applicantName' | 'fromLevel' | 'toLevel' | 'metricsSnapshot' | 'meetsThreshold' | 'approveStatus' | 'approverId' | 'approverName' | 'approveRemark' | 'approvedAt' | 'syncedToFrontend' | 'createdAt' | 'updatedAt'> {
}
declare class PromoterLevelAdjustRequest extends Model<PromoterLevelAdjustRequestAttributes, PromoterLevelAdjustRequestCreationAttributes> implements PromoterLevelAdjustRequestAttributes {
    id: string;
    promoterId: string;
    applicantId?: string;
    applicantName?: string;
    fromLevel?: PromoterLevel;
    toLevel?: PromoterLevel;
    adjustReason: string;
    metricsSnapshot?: MetricsSnapshot;
    meetsThreshold?: boolean;
    approveStatus: ManualLevelAdjustStatus;
    approverId?: string;
    approverName?: string;
    approveRemark?: string;
    approvedAt?: Date;
    syncedToFrontend?: boolean;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { PromoterLevelAdjustRequest, PromoterLevelAdjustRequestAttributes, PromoterLevelAdjustRequestCreationAttributes, MetricsSnapshot };
export default PromoterLevelAdjustRequest;
//# sourceMappingURL=PromoterLevelAdjustRequest.model.d.ts.map
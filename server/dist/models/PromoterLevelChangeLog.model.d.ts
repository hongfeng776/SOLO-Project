import { Model, Optional } from 'sequelize';
import { PromoterLevel, LevelChangeSource } from '../constants/enum';
interface MetricsAtChange {
    monthlyOrders?: number;
    monthlyAmount?: number;
    activeDays?: number;
    reputationScore?: number;
}
interface ComplianceCheck {
    passed?: boolean;
    checks?: {
        name: string;
        passed: boolean;
        message?: string;
    }[];
}
interface PromoterLevelChangeLogAttributes {
    id: string;
    promoterId: string;
    changeSource?: LevelChangeSource;
    fromLevel?: PromoterLevel;
    toLevel?: PromoterLevel;
    operatorId?: string;
    operatorName?: string;
    metricsAtChange?: MetricsAtChange;
    meetsThreshold?: boolean;
    adjustRequestId?: string;
    changeReason?: string;
    complianceCheck?: ComplianceCheck;
    anomalyFlagged?: boolean;
    anomalyReason?: string;
    iterationCount?: number;
    createdAt: Date;
}
interface PromoterLevelChangeLogCreationAttributes extends Optional<PromoterLevelChangeLogAttributes, 'id' | 'changeSource' | 'fromLevel' | 'toLevel' | 'operatorId' | 'operatorName' | 'metricsAtChange' | 'meetsThreshold' | 'adjustRequestId' | 'changeReason' | 'complianceCheck' | 'anomalyFlagged' | 'anomalyReason' | 'iterationCount' | 'createdAt'> {
}
declare class PromoterLevelChangeLog extends Model<PromoterLevelChangeLogAttributes, PromoterLevelChangeLogCreationAttributes> implements PromoterLevelChangeLogAttributes {
    id: string;
    promoterId: string;
    changeSource?: LevelChangeSource;
    fromLevel?: PromoterLevel;
    toLevel?: PromoterLevel;
    operatorId?: string;
    operatorName?: string;
    metricsAtChange?: MetricsAtChange;
    meetsThreshold?: boolean;
    adjustRequestId?: string;
    changeReason?: string;
    complianceCheck?: ComplianceCheck;
    anomalyFlagged?: boolean;
    anomalyReason?: string;
    iterationCount?: number;
    readonly createdAt: Date;
}
export { PromoterLevelChangeLog, PromoterLevelChangeLogAttributes, PromoterLevelChangeLogCreationAttributes, MetricsAtChange, ComplianceCheck };
export default PromoterLevelChangeLog;
//# sourceMappingURL=PromoterLevelChangeLog.model.d.ts.map
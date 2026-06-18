import { Model, Optional } from 'sequelize';
import { AuditAction, AuditStage, AuditStatus } from '../constants/enum';
interface PromoterAuditLogAttributes {
    id: string;
    promoterId: string;
    action: AuditAction;
    fromStage: AuditStage;
    toStage: AuditStage;
    fromStatus: AuditStatus;
    toStatus: AuditStatus;
    operatorId?: string;
    operatorName?: string;
    remark?: string;
    rejectReasonCode?: string;
    rejectCustomRemark?: string;
    metadata?: string;
    createdAt: Date;
    updatedAt: Date;
}
interface PromoterAuditLogCreationAttributes extends Optional<PromoterAuditLogAttributes, 'id' | 'operatorId' | 'operatorName' | 'remark' | 'rejectReasonCode' | 'rejectCustomRemark' | 'metadata' | 'createdAt' | 'updatedAt'> {
}
declare class PromoterAuditLog extends Model<PromoterAuditLogAttributes, PromoterAuditLogCreationAttributes> implements PromoterAuditLogAttributes {
    id: string;
    promoterId: string;
    action: AuditAction;
    fromStage: AuditStage;
    toStage: AuditStage;
    fromStatus: AuditStatus;
    toStatus: AuditStatus;
    operatorId?: string;
    operatorName?: string;
    remark?: string;
    rejectReasonCode?: string;
    rejectCustomRemark?: string;
    metadata?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { PromoterAuditLog, PromoterAuditLogAttributes, PromoterAuditLogCreationAttributes };
export default PromoterAuditLog;
//# sourceMappingURL=PromoterAuditLog.model.d.ts.map
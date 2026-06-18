import { Model, Optional } from 'sequelize';
interface PromoterRiskRecordAttributes {
    id: string;
    promoterId: string;
    riskLevel: string;
    riskType: string;
    riskTitle: string;
    riskDescription?: string;
    riskEvidence?: any;
    operatorId?: string;
    operatorName?: string;
    controlStatus?: number;
    permissionsSnapshot?: any;
    expireAt?: Date;
    isActive?: boolean;
    createdAt: Date;
}
interface PromoterRiskRecordCreationAttributes extends Optional<PromoterRiskRecordAttributes, 'id' | 'riskDescription' | 'riskEvidence' | 'operatorId' | 'operatorName' | 'controlStatus' | 'permissionsSnapshot' | 'expireAt' | 'isActive' | 'createdAt'> {
}
declare class PromoterRiskRecord extends Model<PromoterRiskRecordAttributes, PromoterRiskRecordCreationAttributes> implements PromoterRiskRecordAttributes {
    id: string;
    promoterId: string;
    riskLevel: string;
    riskType: string;
    riskTitle: string;
    riskDescription?: string;
    riskEvidence?: any;
    operatorId?: string;
    operatorName?: string;
    controlStatus?: number;
    permissionsSnapshot?: any;
    expireAt?: Date;
    isActive?: boolean;
    readonly createdAt: Date;
}
export { PromoterRiskRecord, PromoterRiskRecordAttributes, PromoterRiskRecordCreationAttributes };
export default PromoterRiskRecord;
//# sourceMappingURL=PromoterRiskRecord.model.d.ts.map
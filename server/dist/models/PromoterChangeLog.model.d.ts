import { Model, Optional } from 'sequelize';
interface PromoterChangeLogAttributes {
    id: string;
    promoterId: string;
    operatorId?: string;
    operatorName?: string;
    fieldName: string;
    fieldLabel?: string;
    oldValue?: string;
    newValue?: string;
    changeType?: string;
    remark?: string;
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}
interface PromoterChangeLogCreationAttributes extends Optional<PromoterChangeLogAttributes, 'id' | 'operatorId' | 'operatorName' | 'fieldLabel' | 'oldValue' | 'newValue' | 'changeType' | 'remark' | 'metadata' | 'createdAt' | 'updatedAt'> {
}
declare class PromoterChangeLog extends Model<PromoterChangeLogAttributes, PromoterChangeLogCreationAttributes> implements PromoterChangeLogAttributes {
    id: string;
    promoterId: string;
    operatorId?: string;
    operatorName?: string;
    fieldName: string;
    fieldLabel?: string;
    oldValue?: string;
    newValue?: string;
    changeType?: string;
    remark?: string;
    metadata?: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { PromoterChangeLog, PromoterChangeLogAttributes, PromoterChangeLogCreationAttributes };
export default PromoterChangeLog;
//# sourceMappingURL=PromoterChangeLog.model.d.ts.map
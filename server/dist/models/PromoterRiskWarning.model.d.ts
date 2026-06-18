import { Model, Optional } from 'sequelize';
interface PromoterRiskWarningAttributes {
    id: string;
    promoterId: string;
    warningLevel?: string;
    warningType?: string;
    warningTitle: string;
    warningDesc?: string;
    ruleCode?: string;
    riskScore?: number;
    isHandled?: boolean;
    handledBy?: string;
    handledAt?: Date;
    handleRemark?: string;
    createdAt: Date;
}
interface PromoterRiskWarningCreationAttributes extends Optional<PromoterRiskWarningAttributes, 'id' | 'warningLevel' | 'warningType' | 'warningDesc' | 'ruleCode' | 'riskScore' | 'isHandled' | 'handledBy' | 'handledAt' | 'handleRemark' | 'createdAt'> {
}
declare class PromoterRiskWarning extends Model<PromoterRiskWarningAttributes, PromoterRiskWarningCreationAttributes> implements PromoterRiskWarningAttributes {
    id: string;
    promoterId: string;
    warningLevel?: string;
    warningType?: string;
    warningTitle: string;
    warningDesc?: string;
    ruleCode?: string;
    riskScore?: number;
    isHandled?: boolean;
    handledBy?: string;
    handledAt?: Date;
    handleRemark?: string;
    readonly createdAt: Date;
}
export { PromoterRiskWarning, PromoterRiskWarningAttributes, PromoterRiskWarningCreationAttributes };
export default PromoterRiskWarning;
//# sourceMappingURL=PromoterRiskWarning.model.d.ts.map
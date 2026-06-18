import { Model, Optional } from 'sequelize';
import { PromoterLevel } from '../constants/enum';
interface PromoterLevelRuleAttributes {
    id: string;
    level: PromoterLevel;
    levelName?: string;
    minMonthlyAmount: number;
    minMonthlyOrders: number;
    minActiveDays: number;
    minReputationScore: number;
    commissionRate?: number;
    maxChannels?: number;
    canUseCoupon?: boolean;
    canUseCashback?: boolean;
    minOrderAmount?: number;
    dailyWithdrawLimit?: number;
    canUsePremiumMaterial?: boolean;
    canUseAdvancedAnalytics?: boolean;
    effectiveFrom?: Date;
    effectiveTo?: Date;
    createdBy?: string;
    updatedBy?: string;
    remark?: string;
    createdAt: Date;
    updatedAt: Date;
}
interface PromoterLevelRuleCreationAttributes extends Optional<PromoterLevelRuleAttributes, 'id' | 'levelName' | 'minMonthlyAmount' | 'minMonthlyOrders' | 'minActiveDays' | 'minReputationScore' | 'commissionRate' | 'maxChannels' | 'canUseCoupon' | 'canUseCashback' | 'minOrderAmount' | 'dailyWithdrawLimit' | 'canUsePremiumMaterial' | 'canUseAdvancedAnalytics' | 'effectiveFrom' | 'effectiveTo' | 'createdBy' | 'updatedBy' | 'remark' | 'createdAt' | 'updatedAt'> {
}
declare class PromoterLevelRule extends Model<PromoterLevelRuleAttributes, PromoterLevelRuleCreationAttributes> implements PromoterLevelRuleAttributes {
    id: string;
    level: PromoterLevel;
    levelName?: string;
    minMonthlyAmount: number;
    minMonthlyOrders: number;
    minActiveDays: number;
    minReputationScore: number;
    commissionRate?: number;
    maxChannels?: number;
    canUseCoupon?: boolean;
    canUseCashback?: boolean;
    minOrderAmount?: number;
    dailyWithdrawLimit?: number;
    canUsePremiumMaterial?: boolean;
    canUseAdvancedAnalytics?: boolean;
    effectiveFrom?: Date;
    effectiveTo?: Date;
    createdBy?: string;
    updatedBy?: string;
    remark?: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { PromoterLevelRule, PromoterLevelRuleAttributes, PromoterLevelRuleCreationAttributes };
export default PromoterLevelRule;
//# sourceMappingURL=PromoterLevelRule.model.d.ts.map
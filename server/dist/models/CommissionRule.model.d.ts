import { Model, Optional } from 'sequelize';
interface CommissionRuleAttributes {
    id: string;
    name: string;
    code: string;
    ruleType: string;
    condition: any;
    calculation: any;
    priority: number;
    enabled: boolean;
    effectiveStartTime?: Date;
    effectiveEndTime?: Date;
    createdAt: Date;
    updatedAt: Date;
}
interface CommissionRuleCreationAttributes extends Optional<CommissionRuleAttributes, 'id' | 'priority' | 'enabled' | 'effectiveStartTime' | 'effectiveEndTime' | 'createdAt' | 'updatedAt'> {
}
declare class CommissionRule extends Model<CommissionRuleAttributes, CommissionRuleCreationAttributes> implements CommissionRuleAttributes {
    id: string;
    name: string;
    code: string;
    ruleType: string;
    condition: any;
    calculation: any;
    priority: number;
    enabled: boolean;
    effectiveStartTime?: Date;
    effectiveEndTime?: Date;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}
export { CommissionRule, CommissionRuleAttributes, CommissionRuleCreationAttributes };
export default CommissionRule;
//# sourceMappingURL=CommissionRule.model.d.ts.map
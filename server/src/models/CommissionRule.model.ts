import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

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

interface CommissionRuleCreationAttributes extends Optional<CommissionRuleAttributes, 'id' | 'priority' | 'enabled' | 'effectiveStartTime' | 'effectiveEndTime' | 'createdAt' | 'updatedAt'> {}

class CommissionRule extends Model<CommissionRuleAttributes, CommissionRuleCreationAttributes> implements CommissionRuleAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public ruleType!: string;
  public condition!: any;
  public calculation!: any;
  public priority!: number;
  public enabled!: boolean;
  public effectiveStartTime?: Date;
  public effectiveEndTime?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

CommissionRule.init(
  {
    id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: () => uuidv4() },
    name: { type: DataTypes.STRING(100), allowNull: false },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    ruleType: { type: DataTypes.STRING(30), allowNull: false },
    condition: { type: DataTypes.JSON, allowNull: false },
    calculation: { type: DataTypes.JSON, allowNull: false },
    priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    effectiveStartTime: { type: DataTypes.DATE, allowNull: true },
    effectiveEndTime: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'commission_rules',
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'idx_code', fields: ['code'] },
      { name: 'idx_rule_type', fields: ['rule_type'] },
      { name: 'idx_enabled', fields: ['enabled'] },
      { name: 'idx_priority', fields: ['priority'] },
    ],
  }
);

export { CommissionRule, CommissionRuleAttributes, CommissionRuleCreationAttributes };
export default CommissionRule;

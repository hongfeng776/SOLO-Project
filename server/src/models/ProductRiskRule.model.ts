import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import {
  ProductRiskStatus,
  ProductRiskType,
  ProductRiskSeverity,
  ProductRiskAction,
} from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ProductRiskRuleAttributes {
  id: string;
  ruleName: string;
  ruleType: ProductRiskType;
  severity: ProductRiskSeverity;
  action: ProductRiskAction;
  enabled: boolean;
  dailyMaxPromotionCount?: number;
  singleMaxCommission?: number;
  highFrequencyThreshold?: number;
  highFrequencyWindowMinutes?: number;
  dailyMaxSuspiciousOrderRatio?: number;
  priceAbnormalDeviationRate?: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  description?: string;
  creatorId?: string;
  creatorName?: string;
  sort?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface ProductRiskRuleCreationAttributes
  extends Optional<
    ProductRiskRuleAttributes,
    | 'id'
    | 'severity'
    | 'action'
    | 'enabled'
    | 'dailyMaxPromotionCount'
    | 'singleMaxCommission'
    | 'highFrequencyThreshold'
    | 'highFrequencyWindowMinutes'
    | 'dailyMaxSuspiciousOrderRatio'
    | 'priceAbnormalDeviationRate'
    | 'effectiveFrom'
    | 'effectiveTo'
    | 'description'
    | 'creatorId'
    | 'creatorName'
    | 'sort'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

class ProductRiskRule
  extends Model<ProductRiskRuleAttributes, ProductRiskRuleCreationAttributes>
  implements ProductRiskRuleAttributes
{
  public id!: string;
  public ruleName!: string;
  public ruleType!: ProductRiskType;
  public severity!: ProductRiskSeverity;
  public action!: ProductRiskAction;
  public enabled!: boolean;
  public dailyMaxPromotionCount?: number;
  public singleMaxCommission?: number;
  public highFrequencyThreshold?: number;
  public highFrequencyWindowMinutes?: number;
  public dailyMaxSuspiciousOrderRatio?: number;
  public priceAbnormalDeviationRate?: number;
  public effectiveFrom?: Date;
  public effectiveTo?: Date;
  public description?: string;
  public creatorId?: string;
  public creatorName?: string;
  public sort?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

ProductRiskRule.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    ruleName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    ruleType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ProductRiskSeverity.MEDIUM,
    },
    action: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: ProductRiskAction.WARNING_NOTICE,
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    dailyMaxPromotionCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    singleMaxCommission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    highFrequencyThreshold: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    highFrequencyWindowMinutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dailyMaxSuspiciousOrderRatio: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
    },
    priceAbnormalDeviationRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
    },
    effectiveFrom: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    effectiveTo: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    creatorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    creatorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'product_risk_rules',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_rule_type',
        fields: ['rule_type'],
      },
      {
        name: 'idx_enabled',
        fields: ['enabled'],
      },
      {
        name: 'idx_severity',
        fields: ['severity'],
      },
      {
        name: 'idx_sort',
        fields: ['sort'],
      },
    ],
  }
);

export {
  ProductRiskRule,
  ProductRiskRuleAttributes,
  ProductRiskRuleCreationAttributes,
};
export default ProductRiskRule;

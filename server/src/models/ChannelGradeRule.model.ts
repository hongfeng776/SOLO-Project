import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ChannelLevel } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ChannelGradeRuleAttributes {
  id: string;
  level: ChannelLevel;
  levelName?: string;
  minMonthlyAmount: number;
  minMonthlyOrders: number;
  minCooperationMonths: number;
  minFulfillmentRate: number;
  minPromotionScore: number;
  commissionRateBonus?: number;
  resourceSupportLevel?: number;
  canExclusiveActivity: boolean;
  canCustomSettle: boolean;
  prioritySupport: boolean;
  dedicatedManager: boolean;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  createdBy?: string;
  updatedBy?: string;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChannelGradeRuleCreationAttributes extends Optional<ChannelGradeRuleAttributes, 'id' | 'levelName' | 'minMonthlyAmount' | 'minMonthlyOrders' | 'minCooperationMonths' | 'minFulfillmentRate' | 'minPromotionScore' | 'commissionRateBonus' | 'resourceSupportLevel' | 'canExclusiveActivity' | 'canCustomSettle' | 'prioritySupport' | 'dedicatedManager' | 'effectiveFrom' | 'effectiveTo' | 'createdBy' | 'updatedBy' | 'remark' | 'createdAt' | 'updatedAt'> {}

class ChannelGradeRule extends Model<ChannelGradeRuleAttributes, ChannelGradeRuleCreationAttributes> implements ChannelGradeRuleAttributes {
  public id!: string;
  public level!: ChannelLevel;
  public levelName?: string;
  public minMonthlyAmount!: number;
  public minMonthlyOrders!: number;
  public minCooperationMonths!: number;
  public minFulfillmentRate!: number;
  public minPromotionScore!: number;
  public commissionRateBonus?: number;
  public resourceSupportLevel?: number;
  public canExclusiveActivity!: boolean;
  public canCustomSettle!: boolean;
  public prioritySupport!: boolean;
  public dedicatedManager!: boolean;
  public effectiveFrom?: Date;
  public effectiveTo?: Date;
  public createdBy?: string;
  public updatedBy?: string;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChannelGradeRule.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    level: {
      type: DataTypes.ENUM(ChannelLevel.STAR, ChannelLevel.BRONZE, ChannelLevel.SILVER, ChannelLevel.GOLD, ChannelLevel.PLATINUM, ChannelLevel.DIAMOND),
      allowNull: false,
    },
    levelName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    minMonthlyAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    minMonthlyOrders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    minCooperationMonths: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    minFulfillmentRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    minPromotionScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    commissionRateBonus: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
    },
    resourceSupportLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    canExclusiveActivity: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    canCustomSettle: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    prioritySupport: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    dedicatedManager: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    effectiveFrom: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    effectiveTo: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    updatedBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'channel_grade_rules',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_level',
        fields: ['level'],
        unique: true,
      },
      {
        name: 'idx_effective',
        fields: ['effective_from', 'effective_to'],
      },
    ],
  }
);

export { ChannelGradeRule, ChannelGradeRuleAttributes, ChannelGradeRuleCreationAttributes };
export default ChannelGradeRule;

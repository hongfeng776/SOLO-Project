import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { PromoterLevel } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

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

interface PromoterLevelRuleCreationAttributes extends Optional<PromoterLevelRuleAttributes, 'id' | 'levelName' | 'minMonthlyAmount' | 'minMonthlyOrders' | 'minActiveDays' | 'minReputationScore' | 'commissionRate' | 'maxChannels' | 'canUseCoupon' | 'canUseCashback' | 'minOrderAmount' | 'dailyWithdrawLimit' | 'canUsePremiumMaterial' | 'canUseAdvancedAnalytics' | 'effectiveFrom' | 'effectiveTo' | 'createdBy' | 'updatedBy' | 'remark' | 'createdAt' | 'updatedAt'> {}

class PromoterLevelRule extends Model<PromoterLevelRuleAttributes, PromoterLevelRuleCreationAttributes> implements PromoterLevelRuleAttributes {
  public id!: string;
  public level!: PromoterLevel;
  public levelName?: string;
  public minMonthlyAmount!: number;
  public minMonthlyOrders!: number;
  public minActiveDays!: number;
  public minReputationScore!: number;
  public commissionRate?: number;
  public maxChannels?: number;
  public canUseCoupon?: boolean;
  public canUseCashback?: boolean;
  public minOrderAmount?: number;
  public dailyWithdrawLimit?: number;
  public canUsePremiumMaterial?: boolean;
  public canUseAdvancedAnalytics?: boolean;
  public effectiveFrom?: Date;
  public effectiveTo?: Date;
  public createdBy?: string;
  public updatedBy?: string;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PromoterLevelRule.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    level: {
      type: DataTypes.ENUM(PromoterLevel.L1, PromoterLevel.L2, PromoterLevel.L3, PromoterLevel.L4, PromoterLevel.L5),
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
    minActiveDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    minReputationScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
    },
    maxChannels: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    canUseCoupon: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    canUseCashback: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    minOrderAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    dailyWithdrawLimit: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    canUsePremiumMaterial: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    canUseAdvancedAnalytics: {
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
    tableName: 'promoter_level_rules',
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

export { PromoterLevelRule, PromoterLevelRuleAttributes, PromoterLevelRuleCreationAttributes };
export default PromoterLevelRule;

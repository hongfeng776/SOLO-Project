import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { RewardRuleType, MarketingType } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface LadderRewardConfig {
  level: number;
  minAmount: number;
  minOrders: number;
  rewardAmount: number;
  rewardRate: number;
  rewardType: 'fixed' | 'percentage';
}

interface RankingRewardConfig {
  rankStart: number;
  rankEnd: number;
  rewardAmount: number;
  rewardRate: number;
  rewardType: 'fixed' | 'percentage';
}

interface FullAmountRewardConfig {
  threshold: number;
  rewardAmount: number;
  rewardRate: number;
  rewardType: 'fixed' | 'percentage';
  canStack: boolean;
}

interface MarketingRewardRuleAttributes {
  id: string;
  marketingId: string;
  ruleType: RewardRuleType;
  marketingType: MarketingType;
  ladderConfigs?: LadderRewardConfig[];
  rankingConfigs?: RankingRewardConfig[];
  fullAmountConfigs?: FullAmountRewardConfig[];
  isStackableWithCommission: boolean;
  maxRewardPerOrder?: number;
  maxRewardPerPromoter?: number;
  maxDailyReward?: number;
  rewardCalculationRule?: object;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface MarketingRewardRuleCreationAttributes extends Optional<MarketingRewardRuleAttributes, 'id' | 'status' | 'isStackableWithCommission' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class MarketingRewardRule extends Model<MarketingRewardRuleAttributes, MarketingRewardRuleCreationAttributes> implements MarketingRewardRuleAttributes {
  public id!: string;
  public marketingId!: string;
  public ruleType!: RewardRuleType;
  public marketingType!: MarketingType;
  public ladderConfigs?: LadderRewardConfig[];
  public rankingConfigs?: RankingRewardConfig[];
  public fullAmountConfigs?: FullAmountRewardConfig[];
  public isStackableWithCommission!: boolean;
  public maxRewardPerOrder?: number;
  public maxRewardPerPromoter?: number;
  public maxDailyReward?: number;
  public rewardCalculationRule?: object;
  public status!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

MarketingRewardRule.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    marketingId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'marketings',
        key: 'id',
      },
    },
    ruleType: {
      type: DataTypes.ENUM(RewardRuleType.LADDER, RewardRuleType.RANKING, RewardRuleType.FULL_AMOUNT),
      allowNull: false,
    },
    marketingType: {
      type: DataTypes.ENUM(...Object.values(MarketingType)),
      allowNull: false,
    },
    ladderConfigs: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    rankingConfigs: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    fullAmountConfigs: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    isStackableWithCommission: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    maxRewardPerOrder: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    maxRewardPerPromoter: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    maxDailyReward: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    rewardCalculationRule: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
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
    tableName: 'marketing_reward_rules',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_marketing_id',
        fields: ['marketing_id'],
      },
      {
        name: 'idx_rule_type',
        fields: ['rule_type'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
    ],
  }
);

export { MarketingRewardRule, MarketingRewardRuleAttributes, MarketingRewardRuleCreationAttributes, LadderRewardConfig, RankingRewardConfig, FullAmountRewardConfig };
export default MarketingRewardRule;

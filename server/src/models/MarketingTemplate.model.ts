import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { MarketingType, ActivityTemplateCategory, RewardRuleType, ParticipationThresholdType } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface TemplateParticipationConfig {
  thresholdType: ParticipationThresholdType;
  thresholdValue: any;
  description?: string;
}

interface TemplateRewardConfig {
  ruleType: RewardRuleType;
  configs: any[];
  isStackableWithCommission: boolean;
}

interface TemplateProductConfig {
  productIds?: string[];
  categories?: string[];
  excludeProductIds?: string[];
}

interface MarketingTemplateAttributes {
  id: string;
  name: string;
  code: string;
  category: ActivityTemplateCategory;
  marketingType: MarketingType;
  description?: string;
  coverImage?: string;
  activityDurationDays?: number;
  baseRewardRate?: number;
  participationConfig?: TemplateParticipationConfig[];
  rewardConfig?: TemplateRewardConfig;
  productConfig?: TemplateProductConfig;
  budget?: number;
  isHot: boolean;
  isRecommended: boolean;
  useCount: number;
  sort: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface MarketingTemplateCreationAttributes extends Optional<MarketingTemplateAttributes, 'id' | 'isHot' | 'isRecommended' | 'useCount' | 'sort' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class MarketingTemplate extends Model<MarketingTemplateAttributes, MarketingTemplateCreationAttributes> implements MarketingTemplateAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public category!: ActivityTemplateCategory;
  public marketingType!: MarketingType;
  public description?: string;
  public coverImage?: string;
  public activityDurationDays?: number;
  public baseRewardRate?: number;
  public participationConfig?: TemplateParticipationConfig[];
  public rewardConfig?: TemplateRewardConfig;
  public productConfig?: TemplateProductConfig;
  public budget?: number;
  public isHot!: boolean;
  public isRecommended!: boolean;
  public useCount!: number;
  public sort!: number;
  public createdBy!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

MarketingTemplate.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.ENUM(...Object.values(ActivityTemplateCategory)),
      allowNull: false,
      defaultValue: ActivityTemplateCategory.CUSTOM,
    },
    marketingType: {
      type: DataTypes.ENUM(...Object.values(MarketingType)),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    activityDurationDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    baseRewardRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    participationConfig: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    rewardConfig: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    productConfig: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    budget: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    isHot: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isRecommended: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    useCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    createdBy: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
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
    tableName: 'marketing_templates',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_code',
        fields: ['code'],
        unique: true,
      },
      {
        name: 'idx_category',
        fields: ['category'],
      },
      {
        name: 'idx_marketing_type',
        fields: ['marketing_type'],
      },
      {
        name: 'idx_is_hot',
        fields: ['is_hot'],
      },
      {
        name: 'idx_is_recommended',
        fields: ['is_recommended'],
      },
      {
        name: 'idx_sort',
        fields: ['sort'],
      },
    ],
  }
);

export { MarketingTemplate, MarketingTemplateAttributes, MarketingTemplateCreationAttributes, TemplateParticipationConfig, TemplateRewardConfig, TemplateProductConfig };
export default MarketingTemplate;

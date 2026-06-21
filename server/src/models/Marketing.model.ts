import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { MarketingStatus, MarketingType, ParticipationThresholdType } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ParticipationThreshold {
  thresholdType: ParticipationThresholdType;
  thresholdValue: any;
  description?: string;
}

interface ActivityProductConfig {
  productIds?: string[];
  categories?: string[];
  excludeProductIds?: string[];
}

interface MarketingAttributes {
  id: string;
  name: string;
  code: string;
  type: MarketingType;
  status: MarketingStatus;
  startTime?: Date;
  endTime?: Date;
  rules?: any;
  budget?: number;
  usedAmount?: number;
  maxCommissionRate?: number;
  channels?: any;
  description?: string;
  coverImage?: string;
  sort?: number;
  participationThresholds?: ParticipationThreshold[];
  productConfig?: ActivityProductConfig;
  rewardRuleId?: string;
  templateId?: string;
  createdBy?: string;
  submitToken?: string;
  previewCount?: number;
  lastPreviewAt?: Date;
  pausedAt?: Date;
  pausedBy?: string;
  pauseReason?: string;
  participantCount?: number;
  pendingRewardAmount?: number;
  statusChangedAt?: Date;
  statusChangedBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface MarketingCreationAttributes extends Optional<MarketingAttributes, 'id' | 'type' | 'status' | 'budget' | 'usedAmount' | 'sort' | 'pausedAt' | 'pausedBy' | 'pauseReason' | 'participantCount' | 'pendingRewardAmount' | 'statusChangedAt' | 'statusChangedBy' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Marketing extends Model<MarketingAttributes, MarketingCreationAttributes> implements MarketingAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public type!: MarketingType;
  public status!: MarketingStatus;
  public startTime?: Date;
  public endTime?: Date;
  public rules?: any;
  public budget?: number;
  public usedAmount?: number;
  public maxCommissionRate?: number;
  public channels?: any;
  public description?: string;
  public coverImage?: string;
  public sort?: number;
  public pausedAt?: Date;
  public pausedBy?: string;
  public pauseReason?: string;
  public participantCount?: number;
  public pendingRewardAmount?: number;
  public statusChangedAt?: Date;
  public statusChangedBy?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Marketing.init(
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
    type: {
      type: DataTypes.ENUM(MarketingType.COUPON, MarketingType.DISCOUNT, MarketingType.CASHBACK, MarketingType.REBATE, MarketingType.BONUS),
      allowNull: false,
      defaultValue: MarketingType.COUPON,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: MarketingStatus.DRAFT,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rules: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    budget: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    usedAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    maxCommissionRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    channels: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    participationThresholds: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'participation_thresholds',
    },
    productConfig: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'product_config',
    },
    rewardRuleId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      field: 'reward_rule_id',
      references: {
        model: 'marketing_reward_rules',
        key: 'id',
      },
    },
    templateId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      field: 'template_id',
      references: {
        model: 'marketing_templates',
        key: 'id',
      },
    },
    createdBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    submitToken: {
      type: DataTypes.STRING(64),
      allowNull: true,
      field: 'submit_token',
    },
    previewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'preview_count',
    },
    lastPreviewAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_preview_at',
    },
    pausedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'paused_at',
    },
    pausedBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
      field: 'paused_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    pauseReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      field: 'pause_reason',
    },
    participantCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'participant_count',
    },
    pendingRewardAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'pending_reward_amount',
    },
    statusChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'status_changed_at',
    },
    statusChangedBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
      field: 'status_changed_by',
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
    tableName: 'marketings',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_code',
        fields: ['code'],
      },
      {
        name: 'idx_type',
        fields: ['type'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
      {
        name: 'idx_start_time',
        fields: ['start_time'],
      },
      {
        name: 'idx_end_time',
        fields: ['end_time'],
      },
      {
        name: 'idx_template_id',
        fields: ['template_id'],
      },
      {
        name: 'idx_reward_rule_id',
        fields: ['reward_rule_id'],
      },
      {
        name: 'idx_created_by',
        fields: ['created_by'],
      },
      {
        name: 'idx_submit_token',
        fields: ['submit_token'],
      },
      {
        name: 'idx_paused_at',
        fields: ['paused_at'],
      },
      {
        name: 'idx_status_changed_at',
        fields: ['status_changed_at'],
      },
    ],
  }
);

export { Marketing, MarketingAttributes, MarketingCreationAttributes, ParticipationThreshold, ActivityProductConfig };
export default Marketing;

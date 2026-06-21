import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ActivityStatusChangeType, MarketingStatus, ValidationSeverity } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface StatusValidationResult {
  ruleCode: string;
  severity: ValidationSeverity;
  message: string;
  passed: boolean;
}

interface MarketingStatusChangeLogAttributes {
  id: string;
  marketingId: string;
  changeType: ActivityStatusChangeType;
  beforeStatus: MarketingStatus;
  afterStatus: MarketingStatus;
  operatorId: string;
  operatorName: string;
  reason?: string;
  participationSnapshot?: object;
  rewardSnapshot?: object;
  validationResults?: StatusValidationResult[];
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

interface MarketingStatusChangeLogCreationAttributes extends Optional<MarketingStatusChangeLogAttributes, 'id' | 'createdAt'> {}

class MarketingStatusChangeLog extends Model<MarketingStatusChangeLogAttributes, MarketingStatusChangeLogCreationAttributes> implements MarketingStatusChangeLogAttributes {
  public id!: string;
  public marketingId!: string;
  public changeType!: ActivityStatusChangeType;
  public beforeStatus!: MarketingStatus;
  public afterStatus!: MarketingStatus;
  public operatorId!: string;
  public operatorName!: string;
  public reason?: string;
  public participationSnapshot?: object;
  public rewardSnapshot?: object;
  public validationResults?: StatusValidationResult[];
  public ipAddress?: string;
  public userAgent?: string;
  public readonly createdAt!: Date;
}

MarketingStatusChangeLog.init(
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
    changeType: {
      type: DataTypes.ENUM(...Object.values(ActivityStatusChangeType)),
      allowNull: false,
    },
    beforeStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    afterStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    operatorId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    operatorName: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    participationSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    rewardSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    validationResults: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'marketing_status_change_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_marketing_id',
        fields: ['marketing_id'],
      },
      {
        name: 'idx_change_type',
        fields: ['change_type'],
      },
      {
        name: 'idx_operator_id',
        fields: ['operator_id'],
      },
      {
        name: 'idx_before_status',
        fields: ['before_status'],
      },
      {
        name: 'idx_after_status',
        fields: ['after_status'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
    ],
  }
);

export { MarketingStatusChangeLog, MarketingStatusChangeLogAttributes, MarketingStatusChangeLogCreationAttributes, StatusValidationResult };
export default MarketingStatusChangeLog;

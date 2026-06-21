import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ActivityOperationType, ValidationSeverity } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ValidationResult {
  field: string;
  severity: ValidationSeverity;
  message: string;
  ruleCode?: string;
}

interface ChangeDiff {
  field: string;
  oldValue?: any;
  newValue?: any;
}

interface MarketingActivityLogAttributes {
  id: string;
  marketingId?: string;
  templateId?: string;
  operatorId: string;
  operatorName: string;
  operationType: ActivityOperationType;
  operationDetail?: string;
  beforeData?: object;
  afterData?: object;
  changeDiffs?: ChangeDiff[];
  validationResults?: ValidationResult[];
  previewSnapshot?: object;
  ipAddress?: string;
  userAgent?: string;
  remark?: string;
  createdAt: Date;
}

interface MarketingActivityLogCreationAttributes extends Optional<MarketingActivityLogAttributes, 'id' | 'createdAt'> {}

class MarketingActivityLog extends Model<MarketingActivityLogAttributes, MarketingActivityLogCreationAttributes> implements MarketingActivityLogAttributes {
  public id!: string;
  public marketingId?: string;
  public templateId?: string;
  public operatorId!: string;
  public operatorName!: string;
  public operationType!: ActivityOperationType;
  public operationDetail?: string;
  public beforeData?: object;
  public afterData?: object;
  public changeDiffs?: ChangeDiff[];
  public validationResults?: ValidationResult[];
  public previewSnapshot?: object;
  public ipAddress?: string;
  public userAgent?: string;
  public remark?: string;
  public readonly createdAt!: Date;
}

MarketingActivityLog.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    marketingId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'marketings',
        key: 'id',
      },
    },
    templateId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'marketing_templates',
        key: 'id',
      },
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
    operationType: {
      type: DataTypes.ENUM(...Object.values(ActivityOperationType)),
      allowNull: false,
    },
    operationDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    beforeData: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    afterData: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    changeDiffs: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    validationResults: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    previewSnapshot: {
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
    remark: {
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
    tableName: 'marketing_activity_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_marketing_id',
        fields: ['marketing_id'],
      },
      {
        name: 'idx_template_id',
        fields: ['template_id'],
      },
      {
        name: 'idx_operator_id',
        fields: ['operator_id'],
      },
      {
        name: 'idx_operation_type',
        fields: ['operation_type'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
    ],
  }
);

export { MarketingActivityLog, MarketingActivityLogAttributes, MarketingActivityLogCreationAttributes, ValidationResult, ChangeDiff };
export default MarketingActivityLog;

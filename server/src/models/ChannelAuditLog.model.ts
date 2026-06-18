import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ChannelAuditAction, ChannelAuditStage, ChannelAuditStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ChannelAuditLogAttributes {
  id: string;
  channelAuditId: string;
  action: ChannelAuditAction;
  fromStage?: ChannelAuditStage;
  toStage?: ChannelAuditStage;
  fromStatus?: ChannelAuditStatus;
  toStatus?: ChannelAuditStatus;
  operatorId?: string;
  operatorName?: string;
  remark?: string;
  rejectIssueTypes?: any;
  rejectCustomRemark?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface ChannelAuditLogCreationAttributes extends Optional<ChannelAuditLogAttributes,
  'id' | 'createdAt' | 'updatedAt'> {}

class ChannelAuditLog extends Model<ChannelAuditLogAttributes, ChannelAuditLogCreationAttributes> implements ChannelAuditLogAttributes {
  public id!: string;
  public channelAuditId!: string;
  public action!: ChannelAuditAction;
  public fromStage?: ChannelAuditStage;
  public toStage?: ChannelAuditStage;
  public fromStatus?: ChannelAuditStatus;
  public toStatus?: ChannelAuditStatus;
  public operatorId?: string;
  public operatorName?: string;
  public remark?: string;
  public rejectIssueTypes?: any;
  public rejectCustomRemark?: string;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChannelAuditLog.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    channelAuditId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: { model: 'channel_audits', key: 'id' },
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    fromStage: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    toStage: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    fromStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    toStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    operatorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    operatorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectIssueTypes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    rejectCustomRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
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
    tableName: 'channel_audit_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'idx_channel_audit_id', fields: ['channel_audit_id'] },
      { name: 'idx_action', fields: ['action'] },
      { name: 'idx_operator_id', fields: ['operator_id'] },
      { name: 'idx_created_at', fields: ['created_at'] },
    ],
  }
);

export { ChannelAuditLog, ChannelAuditLogAttributes, ChannelAuditLogCreationAttributes };
export default ChannelAuditLog;

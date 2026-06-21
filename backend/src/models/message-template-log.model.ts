import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MessageTemplateLogAttributes {
  id: number;
  templateId: number;
  templateName?: string;
  action: string;
  changedFields?: string;
  oldValues?: string;
  newValues?: string;
  versionBefore?: number;
  versionAfter?: number;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  operationRemark?: string;
  isComplianceChecked: boolean;
  complianceIssues?: string;
  statusBefore?: string;
  statusAfter?: string;
  weightBefore?: number;
  weightAfter?: number;
}

interface MessageTemplateLogCreationAttributes extends Optional<MessageTemplateLogAttributes, 'id' | 'isComplianceChecked'> {}

class MessageTemplateLog extends Model<MessageTemplateLogAttributes, MessageTemplateLogCreationAttributes> implements MessageTemplateLogAttributes {
  public id!: number;
  public templateId!: number;
  public templateName?: string;
  public action!: string;
  public changedFields?: string;
  public oldValues?: string;
  public newValues?: string;
  public versionBefore?: number;
  public versionAfter?: number;
  public operatorId?: number;
  public operatorName?: string;
  public operatorRole?: string;
  public operationRemark?: string;
  public isComplianceChecked!: boolean;
  public complianceIssues?: string;
  public statusBefore?: string;
  public statusAfter?: string;
  public weightBefore?: number;
  public weightAfter?: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

MessageTemplateLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    templateId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '模板ID',
    },
    templateName: {
      type: DataTypes.STRING(100),
      comment: '模板名称',
    },
    action: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '操作类型',
    },
    changedFields: {
      type: DataTypes.STRING(500),
      comment: '变更字段，逗号分隔',
    },
    oldValues: {
      type: DataTypes.TEXT,
      comment: '变更前值，JSON格式',
    },
    newValues: {
      type: DataTypes.TEXT,
      comment: '变更后值，JSON格式',
    },
    versionBefore: {
      type: DataTypes.INTEGER,
      comment: '变更前版本号',
    },
    versionAfter: {
      type: DataTypes.INTEGER,
      comment: '变更后版本号',
    },
    operatorId: {
      type: DataTypes.INTEGER,
      comment: '操作人ID',
    },
    operatorName: {
      type: DataTypes.STRING(50),
      comment: '操作人姓名',
    },
    operatorRole: {
      type: DataTypes.STRING(20),
      comment: '操作人角色',
    },
    operationRemark: {
      type: DataTypes.STRING(500),
      comment: '操作备注',
    },
    isComplianceChecked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否通过合规校验',
    },
    complianceIssues: {
      type: DataTypes.TEXT,
      comment: '合规问题列表，JSON格式',
    },
    statusBefore: {
      type: DataTypes.STRING(20),
      comment: '变更前状态',
    },
    statusAfter: {
      type: DataTypes.STRING(20),
      comment: '变更后状态',
    },
    weightBefore: {
      type: DataTypes.INTEGER,
      comment: '变更前权重',
    },
    weightAfter: {
      type: DataTypes.INTEGER,
      comment: '变更后权重',
    },
  },
  {
    sequelize,
    tableName: 'message_template_log',
    comment: '消息模板变更日志表',
    indexes: [
      { fields: ['templateId'] },
      { fields: ['action'] },
      { fields: ['operatorId'] },
      { fields: ['created_at'] },
    ],
  }
);

export default MessageTemplateLog;

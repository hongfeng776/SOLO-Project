import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { MessageDeliveryLogAction, MessageDeliveryStatus } from '../constants/recruitment.enum';

interface MessageDeliveryLogAttributes {
  id: number;
  messageId: number;
  messageCode?: string;
  action: MessageDeliveryLogAction;
  actionDetail?: string;
  oldDeliveryStatus?: MessageDeliveryStatus;
  newDeliveryStatus?: MessageDeliveryStatus;
  oldReadStatus?: string;
  newReadStatus?: string;
  changedFields?: string;
  oldValues?: string;
  newValues?: string;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  ipAddress?: string;
  userAgent?: string;
  remark?: string;
  created_at: Date;
}

interface MessageDeliveryLogCreationAttributes extends Optional<MessageDeliveryLogAttributes, 'id'> {}

class MessageDeliveryLog extends Model<MessageDeliveryLogAttributes, MessageDeliveryLogCreationAttributes> 
  implements MessageDeliveryLogAttributes {
  public id!: number;
  public messageId!: number;
  public messageCode?: string;
  public action!: MessageDeliveryLogAction;
  public actionDetail?: string;
  public oldDeliveryStatus?: MessageDeliveryStatus;
  public newDeliveryStatus?: MessageDeliveryStatus;
  public oldReadStatus?: string;
  public newReadStatus?: string;
  public changedFields?: string;
  public oldValues?: string;
  public newValues?: string;
  public operatorId?: number;
  public operatorName?: string;
  public operatorRole?: string;
  public ipAddress?: string;
  public userAgent?: string;
  public remark?: string;
  public readonly created_at!: Date;
}

MessageDeliveryLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    messageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '消息ID',
    },
    messageCode: {
      type: DataTypes.STRING(50),
      comment: '消息编码',
    },
    action: {
      type: DataTypes.ENUM(
        'trigger', 'push_attempt', 'push_success', 'push_failed',
        'retry', 'read', 'mark_read', 'mark_unread', 'delete',
        'batch_retry', 'batch_mark_read', 'batch_delete'
      ),
      allowNull: false,
      comment: '操作类型',
    },
    actionDetail: {
      type: DataTypes.STRING(500),
      comment: '操作详情',
    },
    oldDeliveryStatus: {
      type: DataTypes.ENUM('pending', 'sent_success', 'sent_failed', 'read', 'unread'),
      comment: '原推送状态',
    },
    newDeliveryStatus: {
      type: DataTypes.ENUM('pending', 'sent_success', 'sent_failed', 'read', 'unread'),
      comment: '新推送状态',
    },
    oldReadStatus: {
      type: DataTypes.ENUM('read', 'unread'),
      comment: '原阅读状态',
    },
    newReadStatus: {
      type: DataTypes.ENUM('read', 'unread'),
      comment: '新阅读状态',
    },
    changedFields: {
      type: DataTypes.TEXT,
      comment: '变更字段列表(JSON)',
    },
    oldValues: {
      type: DataTypes.TEXT,
      comment: '变更前值(JSON)',
    },
    newValues: {
      type: DataTypes.TEXT,
      comment: '变更后值(JSON)',
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
    ipAddress: {
      type: DataTypes.STRING(50),
      comment: '操作IP',
    },
    userAgent: {
      type: DataTypes.STRING(500),
      comment: '用户代理',
    },
    remark: {
      type: DataTypes.STRING(500),
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'message_delivery_log',
    comment: '消息推送日志表',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['messageId'] },
      { fields: ['messageCode'] },
      { fields: ['action'] },
      { fields: ['operatorId'] },
      { fields: ['created_at'] },
      { fields: ['messageId', 'action'] },
    ],
  }
);

export default MessageDeliveryLog;

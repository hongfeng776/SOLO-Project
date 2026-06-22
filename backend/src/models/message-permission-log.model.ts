import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import {
  MessagePermissionAction,
  MessagePermissionStatus,
} from '../constants/recruitment.enum';

interface MessagePermissionLogAttributes {
  id: number;
  permissionId?: number;
  userId: number;
  username: string;
  action: MessagePermissionAction;
  actionDetail?: string;
  oldPermissionStatus?: MessagePermissionStatus;
  newPermissionStatus?: MessagePermissionStatus;
  oldAllowedScenes?: string;
  newAllowedScenes?: string;
  oldBlockedScenes?: string;
  newBlockedScenes?: string;
  changedFields?: string;
  oldValues?: string;
  newValues?: string;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  ipAddress?: string;
  userAgent?: string;
  validationResult?: string;
  conflictInfo?: string;
  remark?: string;
  created_at: Date;
}

interface MessagePermissionLogCreationAttributes extends Optional<MessagePermissionLogAttributes, 'id'> {}

class MessagePermissionLog extends Model<MessagePermissionLogAttributes, MessagePermissionLogCreationAttributes> 
  implements MessagePermissionLogAttributes {
  public id!: number;
  public permissionId?: number;
  public userId!: number;
  public username!: string;
  public action!: MessagePermissionAction;
  public actionDetail?: string;
  public oldPermissionStatus?: MessagePermissionStatus;
  public newPermissionStatus?: MessagePermissionStatus;
  public oldAllowedScenes?: string;
  public newAllowedScenes?: string;
  public oldBlockedScenes?: string;
  public newBlockedScenes?: string;
  public changedFields?: string;
  public oldValues?: string;
  public newValues?: string;
  public operatorId?: number;
  public operatorName?: string;
  public operatorRole?: string;
  public ipAddress?: string;
  public userAgent?: string;
  public validationResult?: string;
  public conflictInfo?: string;
  public remark?: string;
  public readonly created_at!: Date;
}

MessagePermissionLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    permissionId: {
      type: DataTypes.INTEGER,
      comment: '权限配置ID',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID',
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '用户名',
    },
    action: {
      type: DataTypes.ENUM(
        'create', 'update', 'enable', 'disable',
        'batch_update', 'batch_enable', 'batch_disable', 'batch_standardize'
      ),
      allowNull: false,
      comment: '操作类型',
    },
    actionDetail: {
      type: DataTypes.STRING(500),
      comment: '操作详情',
    },
    oldPermissionStatus: {
      type: DataTypes.ENUM('full_receive', 'partial_receive', 'no_receive'),
      comment: '原权限状态',
    },
    newPermissionStatus: {
      type: DataTypes.ENUM('full_receive', 'partial_receive', 'no_receive'),
      comment: '新权限状态',
    },
    oldAllowedScenes: {
      type: DataTypes.TEXT,
      comment: '原允许场景',
    },
    newAllowedScenes: {
      type: DataTypes.TEXT,
      comment: '新允许场景',
    },
    oldBlockedScenes: {
      type: DataTypes.TEXT,
      comment: '原禁止场景',
    },
    newBlockedScenes: {
      type: DataTypes.TEXT,
      comment: '新禁止场景',
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
    validationResult: {
      type: DataTypes.TEXT,
      comment: '校验结果(JSON)',
    },
    conflictInfo: {
      type: DataTypes.TEXT,
      comment: '冲突信息(JSON)',
    },
    remark: {
      type: DataTypes.STRING(500),
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'message_permission_log',
    comment: '消息权限变更日志表',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['permissionId'] },
      { fields: ['userId'] },
      { fields: ['action'] },
      { fields: ['operatorId'] },
      { fields: ['created_at'] },
      { fields: ['userId', 'action'] },
    ],
  }
);

export default MessagePermissionLog;

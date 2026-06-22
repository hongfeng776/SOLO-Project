import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import {
  MessagePermissionStatus,
  MessageTemplateScene,
  UserRole,
} from '../constants/recruitment.enum';

interface MessagePermissionAttributes {
  id: number;
  userId: number;
  username: string;
  userRole: UserRole;
  department?: string;
  position?: string;
  permissionStatus: MessagePermissionStatus;
  allowedScenes?: string;
  blockedScenes?: string;
  allowedChannels?: string;
  blockedChannels?: string;
  allowedNotificationTypes?: string;
  blockedNotificationTypes?: string;
  canViewSensitiveMessages: boolean;
  canReceiveSystemMessages: boolean;
  canReceiveRiskMessages: boolean;
  messageQuota?: number;
  effectiveTime?: Date;
  expiryTime?: Date;
  isEnabled: boolean;
  configSource: string;
  companyId?: number;
  remark?: string;
  createdBy?: number;
  createdByName?: string;
  updatedBy?: number;
  updatedByName?: string;
  created_at: Date;
  updated_at: Date;
}

interface MessagePermissionCreationAttributes extends Optional<MessagePermissionAttributes, 
  'id' | 'permissionStatus' | 'canViewSensitiveMessages' | 'canReceiveSystemMessages' | 
  'canReceiveRiskMessages' | 'isEnabled' | 'configSource'
> {}

class MessagePermission extends Model<MessagePermissionAttributes, MessagePermissionCreationAttributes> 
  implements MessagePermissionAttributes {
  public id!: number;
  public userId!: number;
  public username!: string;
  public userRole!: UserRole;
  public department?: string;
  public position?: string;
  public permissionStatus!: MessagePermissionStatus;
  public allowedScenes?: string;
  public blockedScenes?: string;
  public allowedChannels?: string;
  public blockedChannels?: string;
  public allowedNotificationTypes?: string;
  public blockedNotificationTypes?: string;
  public canViewSensitiveMessages!: boolean;
  public canReceiveSystemMessages!: boolean;
  public canReceiveRiskMessages!: boolean;
  public messageQuota?: number;
  public effectiveTime?: Date;
  public expiryTime?: Date;
  public isEnabled!: boolean;
  public configSource!: string;
  public companyId?: number;
  public remark?: string;
  public createdBy?: number;
  public createdByName?: string;
  public updatedBy?: number;
  public updatedByName?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

MessagePermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    userRole: {
      type: DataTypes.ENUM('admin', 'hr', 'interviewer'),
      allowNull: false,
      comment: '用户角色',
    },
    department: {
      type: DataTypes.STRING(50),
      comment: '所属部门',
    },
    position: {
      type: DataTypes.STRING(100),
      comment: '职位',
    },
    permissionStatus: {
      type: DataTypes.ENUM('full_receive', 'partial_receive', 'no_receive'),
      allowNull: false,
      defaultValue: MessagePermissionStatus.FULL_RECEIVE,
      comment: '权限状态',
    },
    allowedScenes: {
      type: DataTypes.TEXT,
      comment: '允许接收的消息场景(JSON数组)',
    },
    blockedScenes: {
      type: DataTypes.TEXT,
      comment: '禁止接收的消息场景(JSON数组)',
    },
    allowedChannels: {
      type: DataTypes.TEXT,
      comment: '允许的推送渠道(JSON数组)',
    },
    blockedChannels: {
      type: DataTypes.TEXT,
      comment: '禁止的推送渠道(JSON数组)',
    },
    allowedNotificationTypes: {
      type: DataTypes.TEXT,
      comment: '允许的通知类型(JSON数组)',
    },
    blockedNotificationTypes: {
      type: DataTypes.TEXT,
      comment: '禁止的通知类型(JSON数组)',
    },
    canViewSensitiveMessages: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否可查看敏感消息',
    },
    canReceiveSystemMessages: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否可接收系统消息',
    },
    canReceiveRiskMessages: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否可接收风控消息',
    },
    messageQuota: {
      type: DataTypes.INTEGER,
      comment: '每日消息接收限额',
    },
    effectiveTime: {
      type: DataTypes.DATE,
      comment: '生效时间',
    },
    expiryTime: {
      type: DataTypes.DATE,
      comment: '过期时间',
    },
    isEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否启用',
    },
    configSource: {
      type: DataTypes.STRING(20),
      defaultValue: 'manual',
      comment: '配置来源 manual/auto/batch',
    },
    companyId: {
      type: DataTypes.INTEGER,
      comment: '所属企业ID',
    },
    remark: {
      type: DataTypes.STRING(500),
      comment: '备注',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      comment: '创建人ID',
    },
    createdByName: {
      type: DataTypes.STRING(50),
      comment: '创建人姓名',
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      comment: '更新人ID',
    },
    updatedByName: {
      type: DataTypes.STRING(50),
      comment: '更新人姓名',
    },
  },
  {
    sequelize,
    tableName: 'message_permission',
    comment: '消息权限配置表',
    indexes: [
      { fields: ['userId'], unique: true },
      { fields: ['userRole'] },
      { fields: ['permissionStatus'] },
      { fields: ['department'] },
      { fields: ['companyId'] },
      { fields: ['isEnabled'] },
      { fields: ['userRole', 'permissionStatus'] },
      { fields: ['companyId', 'department'] },
    ],
  }
);

export default MessagePermission;

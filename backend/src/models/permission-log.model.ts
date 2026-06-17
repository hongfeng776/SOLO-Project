import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type PermissionLogAction = 'create' | 'update' | 'freeze' | 'unfreeze' | 'expire' | 'permission_change' | 'status_change' | 'batch_assign';

interface PermissionLogAttributes {
  id: number;
  userId: number;
  username?: string;
  companyId?: number;
  companyName?: string;
  action: PermissionLogAction;
  changeType: string;
  oldValue?: string;
  newValue?: string;
  changedFields?: string;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  operationRemark?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface PermissionLogCreationAttributes extends Optional<PermissionLogAttributes, 'id'> {}

class PermissionLog extends Model<PermissionLogAttributes, PermissionLogCreationAttributes> implements PermissionLogAttributes {
  public id!: number;
  public userId!: number;
  public username?: string;
  public companyId?: number;
  public companyName?: string;
  public action!: PermissionLogAction;
  public changeType!: string;
  public oldValue?: string;
  public newValue?: string;
  public changedFields?: string;
  public operatorId?: number;
  public operatorName?: string;
  public operatorRole?: string;
  public operationRemark?: string;
  public ipAddress?: string;
  public userAgent?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

PermissionLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID',
    },
    username: {
      type: DataTypes.STRING(50),
      comment: '用户名',
    },
    companyId: {
      type: DataTypes.INTEGER,
      comment: '企业ID',
    },
    companyName: {
      type: DataTypes.STRING(100),
      comment: '企业名称',
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'freeze', 'unfreeze', 'expire', 'permission_change', 'status_change', 'batch_assign'),
      allowNull: false,
      comment: '操作类型',
    },
    changeType: {
      type: DataTypes.STRING(50),
      comment: '变更类型 角色/权限/状态/数据范围',
    },
    oldValue: {
      type: DataTypes.TEXT,
      comment: '变更前值',
    },
    newValue: {
      type: DataTypes.TEXT,
      comment: '变更后值',
    },
    changedFields: {
      type: DataTypes.STRING(500),
      comment: '变更字段列表，逗号分隔',
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
    ipAddress: {
      type: DataTypes.STRING(50),
      comment: '操作IP',
    },
    userAgent: {
      type: DataTypes.STRING(255),
      comment: '用户代理',
    },
  },
  {
    sequelize,
    tableName: 'permission_log',
    comment: '权限变更日志表',
    indexes: [
      { fields: ['userId'] },
      { fields: ['companyId'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
      { fields: ['operatorId'] },
    ],
  }
);

export default PermissionLog;

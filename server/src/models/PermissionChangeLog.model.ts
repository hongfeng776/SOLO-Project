import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

export enum ChangeTargetType {
  ROLE = 'role',
  PERMISSION = 'permission',
  USER = 'user',
}

export enum ChangeAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  BATCH_ASSIGN = 'batch_assign',
  BATCH_REVOKE = 'batch_revoke',
  BATCH_COPY = 'batch_copy',
}

interface PermissionChangeLogAttributes {
  id: string;
  operatorId: string;
  operatorName: string;
  targetId: string;
  targetType: ChangeTargetType;
  targetName?: string;
  action: ChangeAction;
  module?: string;
  beforeData?: any;
  afterData?: any;
  changedFields?: any;
  affectedUserIds?: string[];
  affectedUserCount?: number;
  reason?: string;
  ip: string;
  userAgent?: string;
  createdAt: Date;
}

interface PermissionChangeLogCreationAttributes extends Optional<PermissionChangeLogAttributes, 'id' | 'targetName' | 'module' | 'beforeData' | 'afterData' | 'changedFields' | 'affectedUserIds' | 'affectedUserCount' | 'reason' | 'userAgent' | 'createdAt'> {}

class PermissionChangeLog extends Model<PermissionChangeLogAttributes, PermissionChangeLogCreationAttributes> implements PermissionChangeLogAttributes {
  public id!: string;
  public operatorId!: string;
  public operatorName!: string;
  public targetId!: string;
  public targetType!: ChangeTargetType;
  public targetName?: string;
  public action!: ChangeAction;
  public module?: string;
  public beforeData?: any;
  public afterData?: any;
  public changedFields?: any;
  public affectedUserIds?: string[];
  public affectedUserCount?: number;
  public reason?: string;
  public ip!: string;
  public userAgent?: string;
  public readonly createdAt!: Date;
}

PermissionChangeLog.init(
  {
    id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: () => uuidv4() },
    operatorId: { type: DataTypes.STRING(36), allowNull: false },
    operatorName: { type: DataTypes.STRING(50), allowNull: false },
    targetId: { type: DataTypes.STRING(36), allowNull: false },
    targetType: { type: DataTypes.STRING(20), allowNull: false },
    targetName: { type: DataTypes.STRING(100), allowNull: true },
    action: { type: DataTypes.STRING(30), allowNull: false },
    module: { type: DataTypes.STRING(50), allowNull: true },
    beforeData: { type: DataTypes.JSON, allowNull: true },
    afterData: { type: DataTypes.JSON, allowNull: true },
    changedFields: { type: DataTypes.JSON, allowNull: true },
    affectedUserIds: { type: DataTypes.JSON, allowNull: true },
    affectedUserCount: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    reason: { type: DataTypes.STRING(500), allowNull: true },
    ip: { type: DataTypes.STRING(50), allowNull: false },
    userAgent: { type: DataTypes.STRING(500), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'permission_change_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { name: 'idx_operator_id', fields: ['operator_id'] },
      { name: 'idx_target', fields: ['target_type', 'target_id'] },
      { name: 'idx_action', fields: ['action'] },
      { name: 'idx_module', fields: ['module'] },
      { name: 'idx_created_at', fields: ['created_at'] },
    ],
  }
);

export { PermissionChangeLog, PermissionChangeLogAttributes, PermissionChangeLogCreationAttributes };
export default PermissionChangeLog;

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface OperationLogAttributes {
  id: string;
  userId: string;
  userName: string;
  module: string;
  action: string;
  targetId?: string;
  targetType?: string;
  detail?: any;
  ip: string;
  userAgent?: string;
  status: number;
  errorMessage?: string;
  duration: number;
  createdAt: Date;
}

interface OperationLogCreationAttributes extends Optional<OperationLogAttributes, 'id' | 'targetId' | 'targetType' | 'detail' | 'userAgent' | 'errorMessage' | 'createdAt'> {}

class OperationLog extends Model<OperationLogAttributes, OperationLogCreationAttributes> implements OperationLogAttributes {
  public id!: string;
  public userId!: string;
  public userName!: string;
  public module!: string;
  public action!: string;
  public targetId?: string;
  public targetType?: string;
  public detail?: any;
  public ip!: string;
  public userAgent?: string;
  public status!: number;
  public errorMessage?: string;
  public duration!: number;
  public readonly createdAt!: Date;
}

OperationLog.init(
  {
    id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: () => uuidv4() },
    userId: { type: DataTypes.STRING(36), allowNull: false },
    userName: { type: DataTypes.STRING(50), allowNull: false },
    module: { type: DataTypes.STRING(50), allowNull: false },
    action: { type: DataTypes.STRING(50), allowNull: false },
    targetId: { type: DataTypes.STRING(36), allowNull: true },
    targetType: { type: DataTypes.STRING(50), allowNull: true },
    detail: { type: DataTypes.JSON, allowNull: true },
    ip: { type: DataTypes.STRING(50), allowNull: false },
    userAgent: { type: DataTypes.STRING(500), allowNull: true },
    status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    errorMessage: { type: DataTypes.STRING(500), allowNull: true },
    duration: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'operation_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { name: 'idx_user_id', fields: ['user_id'] },
      { name: 'idx_module', fields: ['module'] },
      { name: 'idx_action', fields: ['action'] },
      { name: 'idx_target', fields: ['target_type', 'target_id'] },
      { name: 'idx_created_at', fields: ['created_at'] },
      { name: 'idx_status', fields: ['status'] },
    ],
  }
);

export { OperationLog, OperationLogAttributes, OperationLogCreationAttributes };
export default OperationLog;

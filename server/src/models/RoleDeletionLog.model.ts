import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface RoleDeletionLogAttributes {
  id: string;
  roleId: string;
  roleName: string;
  roleCode: string;
  deletedBy: string;
  deletedByName: string;
  reason?: string;
  permissionSnapshot?: any;
  boundUsers?: number;
  deletedAt: Date;
  createdAt: Date;
}

interface RoleDeletionLogCreationAttributes extends Optional<RoleDeletionLogAttributes, 'id' | 'reason' | 'permissionSnapshot' | 'boundUsers' | 'createdAt'> {}

class RoleDeletionLog extends Model<RoleDeletionLogAttributes, RoleDeletionLogCreationAttributes> implements RoleDeletionLogAttributes {
  public id!: string;
  public roleId!: string;
  public roleName!: string;
  public roleCode!: string;
  public deletedBy!: string;
  public deletedByName!: string;
  public reason?: string;
  public permissionSnapshot?: any;
  public boundUsers?: number;
  public deletedAt!: Date;
  public readonly createdAt!: Date;
}

RoleDeletionLog.init(
  {
    id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: () => uuidv4() },
    roleId: { type: DataTypes.STRING(36), allowNull: false },
    roleName: { type: DataTypes.STRING(50), allowNull: false },
    roleCode: { type: DataTypes.STRING(50), allowNull: false },
    deletedBy: { type: DataTypes.STRING(36), allowNull: false },
    deletedByName: { type: DataTypes.STRING(50), allowNull: false },
    reason: { type: DataTypes.STRING(255), allowNull: true },
    permissionSnapshot: { type: DataTypes.JSON, allowNull: true },
    boundUsers: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    deletedAt: { type: DataTypes.DATE, allowNull: false },
    createdAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'role_deletion_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { name: 'idx_role_name', fields: ['role_name'] },
      { name: 'idx_deleted_at', fields: ['deleted_at'] },
      { name: 'idx_deleted_by', fields: ['deleted_by'] },
    ],
  }
);

export { RoleDeletionLog, RoleDeletionLogAttributes, RoleDeletionLogCreationAttributes };
export default RoleDeletionLog;

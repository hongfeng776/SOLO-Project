import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface RolePermissionAttributes {
  roleId: string;
  permissionId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface RolePermissionCreationAttributes extends Optional<RolePermissionAttributes, 'createdAt' | 'updatedAt'> {}

class RolePermission extends Model<RolePermissionAttributes, RolePermissionCreationAttributes> implements RolePermissionAttributes {
  public roleId!: string;
  public permissionId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

RolePermission.init(
  {
    roleId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'roles',
        key: 'id',
      },
    },
    permissionId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'permissions',
        key: 'id',
      },
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
    tableName: 'role_permissions',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_role_id',
        fields: ['role_id'],
      },
      {
        name: 'idx_permission_id',
        fields: ['permission_id'],
      },
    ],
  }
);

export { RolePermission, RolePermissionAttributes, RolePermissionCreationAttributes };
export default RolePermission;

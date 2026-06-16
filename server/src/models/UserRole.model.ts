import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

interface UserRoleAttributes {
  userId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface UserRoleCreationAttributes extends Optional<UserRoleAttributes, 'createdAt' | 'updatedAt'> {}

class UserRole extends Model<UserRoleAttributes, UserRoleCreationAttributes> implements UserRoleAttributes {
  public userId!: string;
  public roleId!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

UserRole.init(
  {
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    roleId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'roles',
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
    tableName: 'user_roles',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_role_id',
        fields: ['role_id'],
      },
    ],
  }
);

export { UserRole, UserRoleAttributes, UserRoleCreationAttributes };
export default UserRole;

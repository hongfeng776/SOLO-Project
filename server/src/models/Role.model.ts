import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { CommonStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface RoleAttributes {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: CommonStatus;
  sort?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'description' | 'status' | 'sort' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public description?: string;
  public status!: CommonStatus;
  public sort?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: CommonStatus.ENABLED,
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'roles',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_code',
        fields: ['code'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
    ],
  }
);

export { Role, RoleAttributes, RoleCreationAttributes };
export default Role;

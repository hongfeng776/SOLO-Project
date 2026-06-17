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
  level?: number;
  scenario?: string;
  permissionIds?: string[];
  createdBy?: string;
  createdByName?: string;
  isSystem?: boolean;
  userCount?: number;
  boundPermissionIds?: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface RoleCreationAttributes extends Optional<RoleAttributes, 'id' | 'description' | 'status' | 'sort' | 'level' | 'scenario' | 'permissionIds' | 'createdBy' | 'createdByName' | 'isSystem' | 'userCount' | 'boundPermissionIds' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public description?: string;
  public status!: CommonStatus;
  public sort?: number;
  public level?: number;
  public scenario?: string;
  public permissionIds?: string[];
  public createdBy?: string;
  public createdByName?: string;
  public isSystem?: boolean;
  public userCount?: number;
  public boundPermissionIds?: string[];
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
    level: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: 5,
    },
    scenario: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    createdBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    createdByName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    isSystem: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
      {
        name: 'idx_level',
        fields: ['level'],
      },
      {
        name: 'idx_is_system',
        fields: ['is_system'],
      },
    ],
  }
);

export { Role, RoleAttributes, RoleCreationAttributes };
export default Role;

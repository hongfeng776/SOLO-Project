import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { PermissionType, CommonStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface PermissionAttributes {
  id: string;
  parentId?: string;
  name: string;
  code: string;
  type: PermissionType;
  path?: string;
  icon?: string;
  component?: string;
  method?: string;
  sort?: number;
  status: CommonStatus;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface PermissionCreationAttributes extends Optional<PermissionAttributes, 'id' | 'parentId' | 'type' | 'path' | 'icon' | 'component' | 'method' | 'sort' | 'status' | 'remark' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Permission extends Model<PermissionAttributes, PermissionCreationAttributes> implements PermissionAttributes {
  public id!: string;
  public parentId?: string;
  public name!: string;
  public code!: string;
  public type!: PermissionType;
  public path?: string;
  public icon?: string;
  public component?: string;
  public method?: string;
  public sort?: number;
  public status!: CommonStatus;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Permission.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    parentId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'permissions',
        key: 'id',
      },
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM(PermissionType.MENU, PermissionType.BUTTON, PermissionType.API),
      allowNull: false,
      defaultValue: PermissionType.MENU,
    },
    path: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    component: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    method: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: CommonStatus.ENABLED,
    },
    remark: {
      type: DataTypes.STRING(255),
      allowNull: true,
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
    tableName: 'permissions',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_code',
        fields: ['code'],
      },
      {
        name: 'idx_parent_id',
        fields: ['parent_id'],
      },
      {
        name: 'idx_type',
        fields: ['type'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
    ],
  }
);

export { Permission, PermissionAttributes, PermissionCreationAttributes };
export default Permission;

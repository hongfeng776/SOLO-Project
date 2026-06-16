import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class Permission extends Model<InferAttributes<Permission>, InferCreationAttributes<Permission>> {
  declare id: CreationOptional<number>;
  declare perm_name: string;
  declare perm_code: string;
  declare perm_type: CreationOptional<string>;
  declare parent_id: CreationOptional<number>;
  declare path: CreationOptional<string>;
  declare icon: CreationOptional<string>;
  declare sort_order: CreationOptional<number>;
  declare status: CreationOptional<number>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

Permission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    perm_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    perm_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    perm_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    parent_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    path: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    icon: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'permission',
    paranoid: true,
  },
);

export default Permission;

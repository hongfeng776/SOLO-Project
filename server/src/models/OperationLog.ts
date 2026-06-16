import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class OperationLog extends Model<InferAttributes<OperationLog>, InferCreationAttributes<OperationLog>> {
  declare id: CreationOptional<number>;
  declare user_id: CreationOptional<number>;
  declare username: CreationOptional<string>;
  declare module: string;
  declare operation: string;
  declare operation_type: string;
  declare target_type: CreationOptional<string>;
  declare target_id: CreationOptional<number>;
  declare ip_address: CreationOptional<string>;
  declare user_agent: CreationOptional<string>;
  declare request_params: CreationOptional<string>;
  declare response_data: CreationOptional<string>;
  declare operation_status: CreationOptional<string>;
  declare error_msg: CreationOptional<string>;
  declare duration: CreationOptional<number>;
  declare remark: CreationOptional<string>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

OperationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    operation: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    operation_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    target_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    target_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    request_params: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    response_data: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    operation_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'success',
    },
    error_msg: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
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
    tableName: 'operation_log',
    paranoid: true,
  },
);

export default OperationLog;

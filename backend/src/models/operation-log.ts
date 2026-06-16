import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class OperationLog extends Model<InferAttributes<OperationLog>, InferCreationAttributes<OperationLog>> {
  declare id: CreationOptional<number>
  declare module: string
  declare action: string
  declare method: CreationOptional<string>
  declare params: CreationOptional<string>
  declare result: CreationOptional<string>
  declare ip: CreationOptional<string>
  declare userId: CreationOptional<number>
  declare username: CreationOptional<string>
  declare status: CreationOptional<number>
  declare errorMsg: CreationOptional<string>
  declare costTime: CreationOptional<number>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

OperationLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    method: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ''
    },
    params: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    result: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '0失败 1成功'
    },
    errorMsg: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    costTime: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'sys_operation_log',
    modelName: 'OperationLog',
    paranoid: false,
    indexes: [
      { fields: ['module', 'create_time'] },
      { fields: ['user_id', 'create_time'] }
    ]
  }
)

export default OperationLog

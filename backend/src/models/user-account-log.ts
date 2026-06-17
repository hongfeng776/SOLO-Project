import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class UserAccountLog extends Model<InferAttributes<UserAccountLog>, InferCreationAttributes<UserAccountLog>> {
  declare id: CreationOptional<number>
  declare userId: number
  declare userName: string
  declare operatorId: number
  declare operatorName: string
  declare logType: string
  declare fieldName: string
  declare oldValue: string
  declare newValue: string
  declare reason: string
  declare ip: string
  declare userAgent: string
  declare status: number
  declare errorMsg: string
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

UserAccountLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '用户ID'
    },
    userName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '用户名'
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作人名称'
    },
    logType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '日志类型'
    },
    fieldName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '修改字段名'
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '旧值'
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '新值'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '修改原因'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: 'IP地址'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '用户代理'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '状态 0失败 1成功'
    },
    errorMsg: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '错误信息'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'sys_user_account_log',
    modelName: 'UserAccountLog',
    indexes: [
      { fields: ['user_id', 'create_time'] },
      { fields: ['operator_id', 'create_time'] },
      { fields: ['log_type', 'create_time'] }
    ]
  }
)

export default UserAccountLog

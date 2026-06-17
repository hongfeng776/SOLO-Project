import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class UserAbnormalLog extends Model<InferAttributes<UserAbnormalLog>, InferCreationAttributes<UserAbnormalLog>> {
  declare id: CreationOptional<number>
  declare userId: number
  declare userName: string
  declare abnormalType: string
  declare abnormalDetail: string
  declare severity: number
  declare traceData: string
  declare detectedTime: Date
  declare handled: number
  declare handlerId: number
  declare handlerName: string
  declare handleTime: Date
  declare handleResult: string
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

UserAbnormalLog.init(
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
    abnormalType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '异常类型'
    },
    abnormalDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '异常详情'
    },
    severity: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '严重程度 1低 2中 3高'
    },
    traceData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '溯源数据(JSON)'
    },
    detectedTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '检测时间'
    },
    handled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否已处理 0否 1是'
    },
    handlerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '处理人ID'
    },
    handlerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '处理人名称'
    },
    handleTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '处理时间'
    },
    handleResult: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '处理结果'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'sys_user_abnormal_log',
    modelName: 'UserAbnormalLog',
    indexes: [
      { fields: ['user_id', 'create_time'] },
      { fields: ['abnormal_type', 'create_time'] },
      { fields: ['handled', 'create_time'] }
    ]
  }
)

export default UserAbnormalLog

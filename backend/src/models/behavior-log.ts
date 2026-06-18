import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class BehaviorLog extends Model<InferAttributes<BehaviorLog>, InferCreationAttributes<BehaviorLog>> {
  declare id: CreationOptional<number>
  declare userId: number
  declare userName: string
  declare behaviorType: string
  declare targetId: CreationOptional<number>
  declare targetType: CreationOptional<string>
  declare content: CreationOptional<string>
  declare ip: CreationOptional<string>
  declare userAgent: CreationOptional<string>
  declare isAbnormal: CreationOptional<number>
  declare abnormalType: CreationOptional<string>
  declare riskLevel: CreationOptional<number>
  declare frequency: CreationOptional<number>
  declare timePeriod: CreationOptional<string>
  declare intercepted: CreationOptional<number>
  declare createTime: CreationOptional<Date>
}

BehaviorLog.init(
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
    behaviorType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '行为类型 publish/comment/dm/like/follow/share'
    },
    targetId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '操作目标ID'
    },
    targetType: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: '目标类型 note/comment/user'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '行为内容摘要'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IP地址'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '用户代理'
    },
    isAbnormal: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否异常 0否 1是'
    },
    abnormalType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '异常类型'
    },
    riskLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '风险等级 0正常 1轻微 2中度 3重度'
    },
    frequency: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: '行为频次'
    },
    timePeriod: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '操作时段'
    },
    intercepted: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否已拦截 0否 1是'
    },
    createTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'user_behavior_log',
    modelName: 'BehaviorLog'
  }
)

export default BehaviorLog

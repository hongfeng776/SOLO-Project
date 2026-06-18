import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class UserLevelLog extends Model<InferAttributes<UserLevelLog>, InferCreationAttributes<UserLevelLog>> {
  declare id: CreationOptional<number>
  declare userId: number
  declare userName: string
  declare oldLevel: number
  declare newLevel: number
  declare oldScore: number
  declare newScore: number
  declare operationType: string
  declare reason: string
  declare reasonDetail: CreationOptional<string>
  declare scoreDetail: CreationOptional<string>
  declare benefitsChanged: CreationOptional<string>
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare isCrossLevel: CreationOptional<number>
  declare isAutoAdjust: CreationOptional<number>
  declare analysisResult: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

UserLevelLog.init(
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
    oldLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '原等级'
    },
    newLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '新等级'
    },
    oldScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      comment: '原分值'
    },
    newScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      comment: '新分值'
    },
    operationType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '操作类型 upgrade/downgrade/set'
    },
    reason: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '调整原因'
    },
    reasonDetail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '原因详情'
    },
    scoreDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '分值明细JSON'
    },
    benefitsChanged: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '权益变更JSON'
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作人名称'
    },
    isCrossLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否越级调整 0否 1是'
    },
    isAutoAdjust: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否自动调整 0否 1是'
    },
    analysisResult: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '分析复盘结果JSON'
    },
    createTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'user_level_log',
    modelName: 'UserLevelLog'
  }
)

export default UserLevelLog

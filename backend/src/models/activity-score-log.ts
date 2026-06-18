import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ActivityScoreLog extends Model<InferAttributes<ActivityScoreLog>, InferCreationAttributes<ActivityScoreLog>> {
  declare id: CreationOptional<number>
  declare userId: number
  declare userName: string
  declare oldLevel: number
  declare newLevel: number
  declare oldScore: number
  declare newScore: number
  declare scoreDetail: CreationOptional<string>
  declare changeType: string
  declare logType: string
  declare abnormalType: CreationOptional<string>
  declare isAbnormal: CreationOptional<number>
  declare fluctuationAmount: CreationOptional<number>
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare remark: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

ActivityScoreLog.init(
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
      defaultValue: 0,
      comment: '变更前活跃度等级'
    },
    newLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '变更后活跃度等级'
    },
    oldScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '变更前分值'
    },
    newScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '变更后分值'
    },
    scoreDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '分值明细JSON'
    },
    changeType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '变更类型 level_change/manual_refresh/auto_update'
    },
    logType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '日志类型'
    },
    abnormalType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '异常类型'
    },
    isAbnormal: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否异常 0否 1是'
    },
    fluctuationAmount: {
      type: DataTypes.SMALLINT,
      allowNull: true,
      comment: '分��波动幅度'
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
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    },
    createTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'activity_score_log',
    modelName: 'ActivityScoreLog'
  }
)

export default ActivityScoreLog

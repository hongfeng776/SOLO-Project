import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum TrafficPoolLogType {
  CREATE = 'create',
  UPDATE = 'update',
  QUOTA_CHANGE = 'quota_change',
  RULE_CHANGE = 'rule_change',
  STATUS_CHANGE = 'status_change',
  WEIGHT_CHANGE = 'weight_change',
  BATCH_OPERATION = 'batch_operation',
  SYSTEM_ADJUST = 'system_adjust'
}

export enum TrafficPoolLogStatus {
  PENDING = 0,
  SUCCESS = 1,
  BLOCKED = 2,
  FAILED = 3
}

export const TRAFFIC_POOL_LOG_TYPE_NAMES: Record<string, string> = {
  [TrafficPoolLogType.CREATE]: '创建流量池',
  [TrafficPoolLogType.UPDATE]: '更新配置',
  [TrafficPoolLogType.QUOTA_CHANGE]: '配额变更',
  [TrafficPoolLogType.RULE_CHANGE]: '规则变更',
  [TrafficPoolLogType.STATUS_CHANGE]: '状态变更',
  [TrafficPoolLogType.WEIGHT_CHANGE]: '权重变更',
  [TrafficPoolLogType.BATCH_OPERATION]: '批量操作',
  [TrafficPoolLogType.SYSTEM_ADJUST]: '系统调整'
}

export const TRAFFIC_POOL_LOG_STATUS_NAMES: Record<number, string> = {
  [TrafficPoolLogStatus.PENDING]: '待处理',
  [TrafficPoolLogStatus.SUCCESS]: '成功',
  [TrafficPoolLogStatus.BLOCKED]: '已拦截',
  [TrafficPoolLogStatus.FAILED]: '失败'
}

export const TRAFFIC_POOL_LOG_STATUS_COLORS: Record<number, string> = {
  [TrafficPoolLogStatus.PENDING]: '#909399',
  [TrafficPoolLogStatus.SUCCESS]: '#67c23a',
  [TrafficPoolLogStatus.BLOCKED]: '#f56c6c',
  [TrafficPoolLogStatus.FAILED]: '#e6a23c'
}

class TrafficPoolLog extends Model<InferAttributes<TrafficPoolLog>, InferCreationAttributes<TrafficPoolLog>> {
  declare id: CreationOptional<number>
  declare poolId: number
  declare poolName: CreationOptional<string>
  declare logType: string
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare operatorRole: CreationOptional<string>
  declare oldConfig: CreationOptional<string>
  declare newConfig: CreationOptional<string>
  declare changedFields: CreationOptional<string>
  declare reason: CreationOptional<string>
  declare status: CreationOptional<number>
  declare blockReason: CreationOptional<string>
  declare validationResult: CreationOptional<string>
  declare affectedContentCount: CreationOptional<number>
  declare oldWeightMultiplier: CreationOptional<number>
  declare newWeightMultiplier: CreationOptional<number>
  declare oldDailyQuota: CreationOptional<number>
  declare newDailyQuota: CreationOptional<number>
  declare ip: CreationOptional<string>
  declare userAgent: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

TrafficPoolLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    poolId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '流量池ID'
    },
    poolName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '流量池名称'
    },
    logType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '日志类型'
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '操作人名称'
    },
    operatorRole: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: '',
      comment: '操作人角色'
    },
    oldConfig: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '原配置JSON'
    },
    newConfig: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '新配置JSON'
    },
    changedFields: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '变更字段'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '操作原因'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: TrafficPoolLogStatus.SUCCESS,
      comment: '状态 0待处理 1成功 2已拦截 3失败'
    },
    blockReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '拦截原因'
    },
    validationResult: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '校验结果JSON'
    },
    affectedContentCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '影响内容数量'
    },
    oldWeightMultiplier: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '原权重倍数'
    },
    newWeightMultiplier: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '新权重倍数'
    },
    oldDailyQuota: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: '原日配额'
    },
    newDailyQuota: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true,
      comment: '新日配额'
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
      comment: 'UA'
    },
    createTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_traffic_pool_log',
    modelName: 'TrafficPoolLog',
    indexes: [
      { fields: ['poolId'] },
      { fields: ['logType'] },
      { fields: ['status'] },
      { fields: ['operatorId'] },
      { fields: ['createTime'] }
    ]
  }
)

export default TrafficPoolLog

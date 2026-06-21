import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum WeightRuleLogType {
  CREATE = 'create',
  UPDATE = 'update',
  WEIGHT_CHANGE = 'weight_change',
  STATUS_CHANGE = 'status_change',
  SCENE_CHANGE = 'scene_change',
  BATCH_OPERATION = 'batch_operation',
  RECALC_TRIGGER = 'recalc_trigger',
  SYSTEM_ADJUST = 'system_adjust'
}

export enum WeightRuleLogStatus {
  PENDING = 0,
  SUCCESS = 1,
  BLOCKED = 2,
  FAILED = 3
}

export enum WeightRuleBlockReason {
  SUM_NOT_100 = 'sum_not_100',
  FIELD_MISSING = 'field_missing',
  DIMENSION_IMBALANCE = 'dimension_imbalance',
  OVERSIZED_WEIGHT = 'oversized_weight',
  UNDERWEIGHT = 'underweight',
  UNFAIR_TILT = 'unfair_tilt',
  MALICIOUS_MODIFICATION = 'malicious_modification',
  SCENE_CONFLICT = 'scene_conflict'
}

export const WEIGHT_RULE_LOG_TYPE_NAMES: Record<string, string> = {
  [WeightRuleLogType.CREATE]: '创建规则',
  [WeightRuleLogType.UPDATE]: '更新规则',
  [WeightRuleLogType.WEIGHT_CHANGE]: '权重变更',
  [WeightRuleLogType.STATUS_CHANGE]: '状态变更',
  [WeightRuleLogType.SCENE_CHANGE]: '场景变更',
  [WeightRuleLogType.BATCH_OPERATION]: '批量操作',
  [WeightRuleLogType.RECALC_TRIGGER]: '触发重算',
  [WeightRuleLogType.SYSTEM_ADJUST]: '系统调整'
}

export const WEIGHT_RULE_LOG_STATUS_NAMES: Record<number, string> = {
  [WeightRuleLogStatus.PENDING]: '待处理',
  [WeightRuleLogStatus.SUCCESS]: '成功',
  [WeightRuleLogStatus.BLOCKED]: '已拦截',
  [WeightRuleLogStatus.FAILED]: '失败'
}

export const WEIGHT_RULE_LOG_STATUS_COLORS: Record<number, string> = {
  [WeightRuleLogStatus.PENDING]: '#909399',
  [WeightRuleLogStatus.SUCCESS]: '#67c23a',
  [WeightRuleLogStatus.BLOCKED]: '#f56c6c',
  [WeightRuleLogStatus.FAILED]: '#e6a23c'
}

export const WEIGHT_RULE_BLOCK_REASON_NAMES: Record<string, string> = {
  [WeightRuleBlockReason.SUM_NOT_100]: '权重配比总和不为100%',
  [WeightRuleBlockReason.FIELD_MISSING]: '必填字段缺失',
  [WeightRuleBlockReason.DIMENSION_IMBALANCE]: '维度配比失衡',
  [WeightRuleBlockReason.OVERSIZED_WEIGHT]: '单维度权重超上限',
  [WeightRuleBlockReason.UNDERWEIGHT]: '单维度权重低于下限',
  [WeightRuleBlockReason.UNFAIR_TILT]: '权重倾斜不公平',
  [WeightRuleBlockReason.MALICIOUS_MODIFICATION]: '恶意规则修改',
  [WeightRuleBlockReason.SCENE_CONFLICT]: '生效场景冲突'
}

class TrafficWeightRuleLog extends Model<InferAttributes<TrafficWeightRuleLog>, InferCreationAttributes<TrafficWeightRuleLog>> {
  declare id: CreationOptional<number>
  declare ruleId: number
  declare ruleName: CreationOptional<string>
  declare logType: string
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare operatorRole: CreationOptional<string>
  declare oldWeights?: string
  declare newWeights?: string
  declare oldStatus?: number | null
  declare newStatus?: number | null
  declare oldScene?: string
  declare newScene?: string
  declare changedFields?: string
  declare reason?: string
  declare status: CreationOptional<number>
  declare blockReason?: string
  declare blockDetail?: string
  declare fairnessScore?: number | null
  declare validationResult?: string
  declare affectedContentCount: CreationOptional<number>
  declare estimatedImpact?: string
  declare queueRefreshCost?: number | null
  declare ip?: string
  declare userAgent?: string
  declare createTime: CreationOptional<Date>
}

TrafficWeightRuleLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    ruleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '权重规则ID'
    },
    ruleName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '规则名称'
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
    oldWeights: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '原权重配置JSON'
    },
    newWeights: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '新权重配置JSON'
    },
    oldStatus: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '原状态'
    },
    newStatus: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '新状态'
    },
    oldScene: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '原场景'
    },
    newScene: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '新场景'
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
      defaultValue: WeightRuleLogStatus.SUCCESS,
      comment: '状态 0待处理 1成功 2已拦截 3失败'
    },
    blockReason: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '拦截原因编码'
    },
    blockDetail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '拦截详情'
    },
    fairnessScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '公平性评分 0-100'
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
    estimatedImpact: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '预估影响描述'
    },
    queueRefreshCost: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '队列刷新耗时(ms)'
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
    tableName: 'biz_traffic_weight_rule_log',
    modelName: 'TrafficWeightRuleLog',
    indexes: [
      { fields: ['ruleId'] },
      { fields: ['logType'] },
      { fields: ['status'] },
      { fields: ['blockReason'] },
      { fields: ['operatorId'] },
      { fields: ['createTime'] }
    ]
  }
)

export default TrafficWeightRuleLog

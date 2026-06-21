import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum WeightRuleStatus {
  DISABLED = 0,
  ENABLED = 1
}

export enum WeightRuleScene {
  DAILY = 'daily',
  ACTIVITY = 'activity'
}

export enum WeightDimension {
  CONTENT_QUALITY = 'content_quality',
  USER_ACTIVITY = 'user_activity',
  INTERACTION = 'interaction',
  COMPLIANCE = 'compliance'
}

export const WEIGHT_RULE_STATUS_NAMES: Record<number, string> = {
  [WeightRuleStatus.DISABLED]: '已停用',
  [WeightRuleStatus.ENABLED]: '已启用'
}

export const WEIGHT_RULE_STATUS_COLORS: Record<number, string> = {
  [WeightRuleStatus.DISABLED]: '#909399',
  [WeightRuleStatus.ENABLED]: '#67c23a'
}

export const WEIGHT_RULE_SCENE_NAMES: Record<string, string> = {
  [WeightRuleScene.DAILY]: '日常时段',
  [WeightRuleScene.ACTIVITY]: '活动时段'
}

export const WEIGHT_RULE_SCENE_COLORS: Record<string, string> = {
  [WeightRuleScene.DAILY]: '#409eff',
  [WeightRuleScene.ACTIVITY]: '#e6a23c'
}

export const WEIGHT_DIMENSION_NAMES: Record<string, string> = {
  [WeightDimension.CONTENT_QUALITY]: '内容质量',
  [WeightDimension.USER_ACTIVITY]: '用户活跃度',
  [WeightDimension.INTERACTION]: '互动数据',
  [WeightDimension.COMPLIANCE]: '合规记录'
}

export const WEIGHT_DIMENSION_COLORS: Record<string, string> = {
  [WeightDimension.CONTENT_QUALITY]: '#409eff',
  [WeightDimension.USER_ACTIVITY]: '#67c23a',
  [WeightDimension.INTERACTION]: '#e6a23c',
  [WeightDimension.COMPLIANCE]: '#909399'
}

export const WEIGHT_DIMENSION_DEFAULT_WEIGHTS: Record<string, number> = {
  [WeightDimension.CONTENT_QUALITY]: 35,
  [WeightDimension.USER_ACTIVITY]: 25,
  [WeightDimension.INTERACTION]: 30,
  [WeightDimension.COMPLIANCE]: 10
}

export const TOTAL_WEIGHT_SUM = 100
export const WEIGHT_MIN_RATIO = 5
export const WEIGHT_MAX_RATIO = 60
export const WEIGHT_FAIRNESS_DIFF_THRESHOLD = 40

class TrafficWeightRule extends Model<InferAttributes<TrafficWeightRule>, InferCreationAttributes<TrafficWeightRule>> {
  declare id: CreationOptional<number>
  declare ruleName: string
  declare ruleCode: string
  declare sceneType: string
  declare contentQualityWeight: number
  declare userActivityWeight: number
  declare interactionWeight: number
  declare complianceWeight: number
  declare qualitySubRules?: string
  declare activitySubRules?: string
  declare interactionSubRules?: string
  declare complianceSubRules?: string
  declare applicablePoolLevel?: string
  declare status: CreationOptional<number>
  declare priority: CreationOptional<number>
  declare effectiveTime?: Date | null
  declare expireTime?: Date | null
  declare affectedContentCount: CreationOptional<number>
  declare avgWeightScore?: number | null
  declare lastRecalcTime?: Date | null
  declare description?: string
  declare operatorId?: number | null
  declare operatorName?: string
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

TrafficWeightRule.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    ruleName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '规则名称'
    },
    ruleCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '规则编码'
    },
    sceneType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: WeightRuleScene.DAILY,
      comment: '生效场景 daily日常 activity活动'
    },
    contentQualityWeight: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 35,
      comment: '内容质量权重 0-100'
    },
    userActivityWeight: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 25,
      comment: '用户活跃度权重 0-100'
    },
    interactionWeight: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 30,
      comment: '互动数据权重 0-100'
    },
    complianceWeight: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 10,
      comment: '合规记录权重 0-100'
    },
    qualitySubRules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '内容质量子规则JSON'
    },
    activitySubRules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户活跃子规则JSON'
    },
    interactionSubRules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '互动数据子规则JSON'
    },
    complianceSubRules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '合规子规则JSON'
    },
    applicablePoolLevel: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '适用流量池等级，逗号分隔'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: WeightRuleStatus.DISABLED,
      comment: '状态 0停用 1启用'
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '优先级'
    },
    effectiveTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '生效时间'
    },
    expireTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '失效时间'
    },
    affectedContentCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '影响内容数量'
    },
    avgWeightScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '平均权重得分'
    },
    lastRecalcTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最近重算时间'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '描述'
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
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_traffic_weight_rule',
    modelName: 'TrafficWeightRule',
    indexes: [
      { fields: ['ruleCode'], unique: true },
      { fields: ['sceneType'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['createTime'] },
      { fields: ['effectiveTime'] }
    ]
  }
)

export default TrafficWeightRule

import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ActivityStatsAuditLog extends Model<
  InferAttributes<ActivityStatsAuditLog>,
  InferCreationAttributes<ActivityStatsAuditLog>
> {
  declare id: CreationOptional<number>
  declare activityId: number
  declare activityName: string
  declare targetType: string
  declare targetId: number
  declare action: string
  declare actionName: string
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare oldData: CreationOptional<string>
  declare newData: CreationOptional<string>
  declare changedFields: CreationOptional<string>
  declare oldMetrics: CreationOptional<string>
  declare newMetrics: CreationOptional<string>
  declare checkDimension: CreationOptional<string>
  declare checkLevel: CreationOptional<string>
  declare checkMessage: CreationOptional<string>
  declare anomalyType: CreationOptional<string>
  declare anomalyLevel: CreationOptional<number>
  declare anomalyDetail: CreationOptional<string>
  declare ip: CreationOptional<string>
  declare userAgent: CreationOptional<string>
  declare batchId: CreationOptional<string>
  declare remark: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

ActivityStatsAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    activityId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '关联活动ID'
    },
    activityName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '活动名称快照'
    },
    targetType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'snapshot',
      comment: '操作对象类型 snapshot/report/metric/anomaly'
    },
    targetId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '关联对象ID（快照ID/报表ID等）'
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '审计动作（枚举）'
    },
    actionName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '动作名称（冗余便于展示）'
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '操作人ID（系统操作为空）'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '操作人名称'
    },
    oldData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更前数据快照(JSON)'
    },
    newData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更后数据快照(JSON)'
    },
    changedFields: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更字段列表(JSON数组)'
    },
    oldMetrics: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更前指标数据(JSON，核心指标冗余)'
    },
    newMetrics: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更后指标数据(JSON，核心指标冗余)'
    },
    checkDimension: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '命中的校验维度'
    },
    checkLevel: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '',
      comment: '校验等级 pass/warning/error/blocker'
    },
    checkMessage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '校验说明'
    },
    anomalyType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '异常类型'
    },
    anomalyLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '异常等级 0正常 1预警 2异常 3严重'
    },
    anomalyDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '异常详情(含证据链 JSON)'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '操作IP'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '操作UA'
    },
    batchId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '批量操作关联号'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '备注'
    },
    createTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_activity_stats_audit_log',
    modelName: 'ActivityStatsAuditLog',
    timestamps: false,
    indexes: [
      { fields: ['activity_id', 'create_time'] },
      { fields: ['target_type', 'target_id', 'create_time'] },
      { fields: ['action', 'create_time'] },
      { fields: ['anomaly_level', 'create_time'] },
      { fields: ['batch_id'] }
    ]
  }
)

export default ActivityStatsAuditLog

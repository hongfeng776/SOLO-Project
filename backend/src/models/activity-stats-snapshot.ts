import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ActivityStatsSnapshot extends Model<
  InferAttributes<ActivityStatsSnapshot>,
  InferCreationAttributes<ActivityStatsSnapshot>
> {
  declare id: CreationOptional<number>
  declare activityId: number
  declare activityName: string
  declare snapshotTime: Date
  declare timeDimension: string
  declare timeBucket: string
  declare dimensionType: string
  declare dimensionValue: string
  declare exposureCount: CreationOptional<number>
  declare clickCount: CreationOptional<number>
  declare viewCount: CreationOptional<number>
  declare signupCount: CreationOptional<number>
  declare participateCount: CreationOptional<number>
  declare taskCompleteCount: CreationOptional<number>
  declare rewardIssueCount: CreationOptional<number>
  declare rewardIssueAmount: CreationOptional<number>
  declare rewardArrivedAmount: CreationOptional<number>
  declare budgetUsageRatio: CreationOptional<number>
  declare conversionRate: CreationOptional<number>
  declare retentionD1: CreationOptional<number>
  declare retentionD7: CreationOptional<number>
  declare retentionD30: CreationOptional<number>
  declare anomalyLevel: CreationOptional<number>
  declare anomalyTypes: CreationOptional<string>
  declare anomalyCount: CreationOptional<number>
  declare metricsData: CreationOptional<string>
  declare isLocked: CreationOptional<number>
  declare lockedTime: CreationOptional<Date | null>
  declare lockOperatorId: CreationOptional<number>
  declare lockOperatorName: CreationOptional<string>
  declare dataSource: CreationOptional<string>
  declare checksum: CreationOptional<string>
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare batchId: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

ActivityStatsSnapshot.init(
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
    snapshotTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '快照生成时间'
    },
    timeDimension: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'day',
      comment: '时间维度 hour/day/week/custom'
    },
    timeBucket: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '时间桶标识（如 2026-06-22 / 2026-W25）'
    },
    dimensionType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'total',
      comment: '统计维度类型（total/user_level/activity_level/device/region等）'
    },
    dimensionValue: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '统计维度取值'
    },
    exposureCount: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '曝光量'
    },
    clickCount: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '点击量'
    },
    viewCount: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '浏览量'
    },
    signupCount: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '报名量'
    },
    participateCount: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '参与量'
    },
    taskCompleteCount: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '任务完成量'
    },
    rewardIssueCount: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '奖励发放笔数'
    },
    rewardIssueAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '奖励发放总额'
    },
    rewardArrivedAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '奖励到账总额'
    },
    budgetUsageRatio: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
      comment: '预算使用率 0-1'
    },
    conversionRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
      comment: '转化率 0-1'
    },
    retentionD1: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      defaultValue: 0,
      comment: '次日留存率'
    },
    retentionD7: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      defaultValue: 0,
      comment: '7日留存率'
    },
    retentionD30: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: true,
      defaultValue: 0,
      comment: '30日留存率'
    },
    anomalyLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '异常等级 0正常 1预警 2异常 3严重'
    },
    anomalyTypes: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '命中的异常类型列表(JSON数组)'
    },
    anomalyCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '异常条目数'
    },
    metricsData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '扩展指标数据(JSON)'
    },
    isLocked: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '数据是否锁定 0否 1是（活动下线锁定后禁止修改）'
    },
    lockedTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '锁定时间'
    },
    lockOperatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '锁定操作人ID'
    },
    lockOperatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '锁定操作人名称'
    },
    dataSource: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'auto_collect',
      comment: '数据来源 auto_collect/manual_import/recalculate'
    },
    checksum: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '数据校验和（防篡改）'
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '最后操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '最后操作人名称'
    },
    batchId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: '',
      comment: '批量操作关联号'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_activity_stats_snapshot',
    modelName: 'ActivityStatsSnapshot',
    indexes: [
      { unique: true, fields: ['activity_id', 'snapshot_time', 'dimension_type', 'dimension_value', 'time_bucket'] },
      { fields: ['activity_id', 'create_time'] },
      { fields: ['anomaly_level', 'create_time'] },
      { fields: ['is_locked', 'create_time'] },
      { fields: ['time_dimension', 'time_bucket'] },
      { fields: ['dimension_type', 'dimension_value'] }
    ]
  }
)

export default ActivityStatsSnapshot

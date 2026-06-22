import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ActivityRewardAuditLog extends Model<
  InferAttributes<ActivityRewardAuditLog>,
  InferCreationAttributes<ActivityRewardAuditLog>
> {
  declare id: CreationOptional<number>
  declare rewardId: number
  declare rewardNo: string
  declare activityId: number
  declare activityName: string
  declare userId: number
  declare username: string
  declare action: string
  declare actionName: string
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare oldData: CreationOptional<string>
  declare newData: CreationOptional<string>
  declare changedFields: CreationOptional<string>
  declare oldAmount: CreationOptional<number>
  declare newAmount: CreationOptional<number>
  declare checkDimension: CreationOptional<string>
  declare checkLevel: CreationOptional<string>
  declare checkMessage: CreationOptional<string>
  declare violationType: CreationOptional<string>
  declare violationDetail: CreationOptional<string>
  declare ip: CreationOptional<string>
  declare userAgent: CreationOptional<string>
  declare batchId: CreationOptional<string>
  declare remark: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

ActivityRewardAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    rewardId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '关联奖励记录ID'
    },
    rewardNo: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: '',
      comment: '奖励发放单号'
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
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '用户ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '用户名'
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
      comment: '动作名称（冗余便于前端展示）'
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
      comment: '变更前数据快照 JSON'
    },
    newData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更后数据快照 JSON'
    },
    changedFields: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更字段列表 JSON'
    },
    oldAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: '变更前金额（冗余便于账目审计）'
    },
    newAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      comment: '变更后金额（冗余便于账目审计）'
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
      comment: '校验等级'
    },
    checkMessage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '校验说明'
    },
    violationType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '违规类型'
    },
    violationDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '违规详情 JSON'
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
    tableName: 'biz_activity_reward_audit_log',
    modelName: 'ActivityRewardAuditLog',
    timestamps: false,
    indexes: [
      { fields: ['reward_id', 'create_time'] },
      { fields: ['user_id', 'create_time'] },
      { fields: ['activity_id', 'create_time'] },
      { fields: ['action', 'create_time'] },
      { fields: ['batch_id'] }
    ]
  }
)

export default ActivityRewardAuditLog

import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ActivityParticipationAuditLog extends Model<
  InferAttributes<ActivityParticipationAuditLog>,
  InferCreationAttributes<ActivityParticipationAuditLog>
> {
  declare id: CreationOptional<number>
  declare participationId: number
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

ActivityParticipationAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    participationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '关联参与记录ID'
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
      comment: '参与用户ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '参与用户名'
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作动作（枚举）'
    },
    actionName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '操作动作名称（冗余，便于前端展示）'
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
      comment: '变更前数据快照JSON'
    },
    newData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更后数据快照JSON'
    },
    changedFields: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更字段列表JSON'
    },
    checkDimension: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '拦截命中的校验维度'
    },
    checkLevel: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '',
      comment: '校验结果等级'
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
      comment: '违规详情（含证据链）JSON'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '操作人IP'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '操作人UA'
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
    tableName: 'biz_activity_participation_audit_log',
    modelName: 'ActivityParticipationAuditLog',
    timestamps: false,
    indexes: [
      { fields: ['participation_id', 'create_time'] },
      { fields: ['user_id', 'create_time'] },
      { fields: ['activity_id', 'create_time'] },
      { fields: ['action', 'create_time'] },
      { fields: ['batch_id'] }
    ]
  }
)

export default ActivityParticipationAuditLog

import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ActivityParticipation extends Model<
  InferAttributes<ActivityParticipation>,
  InferCreationAttributes<ActivityParticipation>
> {
  declare id: CreationOptional<number>
  declare activityId: number
  declare activityName: string
  declare userId: number
  declare username: string
  declare nickname: string
  declare status: CreationOptional<number>
  declare signUpTime: CreationOptional<Date>
  declare taskStatus: CreationOptional<number>
  declare taskSubmitTime: CreationOptional<Date | null>
  declare taskVerifyTime: CreationOptional<Date | null>
  declare taskDetail: CreationOptional<string>
  declare rewardStatus: CreationOptional<number>
  declare rewardGrantTime: CreationOptional<Date | null>
  declare rewardDetail: CreationOptional<string>
  declare participantSnapshot: CreationOptional<string>
  declare checkDimension: CreationOptional<string>
  declare checkLevel: CreationOptional<string>
  declare checkMessage: CreationOptional<string>
  declare violationType: CreationOptional<string>
  declare violationDetail: CreationOptional<string>
  declare deviceId: CreationOptional<string>
  declare ip: CreationOptional<string>
  declare userAgent: CreationOptional<string>
  declare riskScore: CreationOptional<number>
  declare riskLevel: CreationOptional<number>
  declare isAnomaly: CreationOptional<number>
  declare anomalyType: CreationOptional<string>
  declare anomalyReason: CreationOptional<string>
  declare remark: CreationOptional<string>
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare batchId: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

ActivityParticipation.init(
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
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '参与用户昵称'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '参与状态 0待参与 1任务完成 2待领奖 3已领奖 4无效资格 5已取消 6审核中'
    },
    signUpTime: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '报名时间'
    },
    taskStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '任务状态 0未开始 1进行中 2已提交 3已验证 4已驳回'
    },
    taskSubmitTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '任务提交时间'
    },
    taskVerifyTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '任务验证时间'
    },
    taskDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '任务完成明细JSON（含证据链）'
    },
    rewardStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '奖励状态 0未发放 1发放中 2已发放 3发放失败 4已拦截'
    },
    rewardGrantTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '奖励发放时间'
    },
    rewardDetail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '奖励发放明细JSON'
    },
    participantSnapshot: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '报名时用户属性快照（等级/活跃度/风险等）JSON'
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
      comment: '校验结果等级 pass/warning/error/blocker'
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
      comment: '违规详情（含证据）JSON'
    },
    deviceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '设备ID（反作弊）'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '参与IP（反作弊）'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: 'UA信息'
    },
    riskScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '本次参与风险分 0-100'
    },
    riskLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '本次参与风险等级 0正常 1轻微 2中度 3重度'
    },
    isAnomaly: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否异常参与 0否 1是'
    },
    anomalyType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '异常参与类型'
    },
    anomalyReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '异常原因'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '备注'
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
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_activity_participation',
    modelName: 'ActivityParticipation',
    paranoid: true,
    indexes: [
      { unique: true, fields: ['activity_id', 'user_id', 'delete_time'] },
      { fields: ['user_id', 'create_time'] },
      { fields: ['status', 'create_time'] },
      { fields: ['is_anomaly', 'create_time'] },
      { fields: ['activity_id', 'status'] },
      { fields: ['device_id', 'create_time'] },
      { fields: ['ip', 'create_time'] },
      { fields: ['batch_id'] }
    ]
  }
)

export default ActivityParticipation

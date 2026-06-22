import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ActivityReward extends Model<InferAttributes<ActivityReward>, InferCreationAttributes<ActivityReward>> {
  declare id: CreationOptional<number>
  declare rewardNo: string
  declare activityId: number
  declare activityName: string
  declare participationId: number
  declare userId: number
  declare username: string
  declare nickname: string
  declare rewardType: string
  declare rewardTypeName: string
  declare rewardName: string
  declare rewardAmount: number
  declare rewardQuantity: number
  declare differentialFactor: CreationOptional<string>
  declare differentialValue: CreationOptional<number>
  declare status: CreationOptional<number>
  declare budgetLockedTime: CreationOptional<Date | null>
  declare issueTime: CreationOptional<Date | null>
  declare arriveTime: CreationOptional<Date | null>
  declare failTime: CreationOptional<Date | null>
  declare recycleTime: CreationOptional<Date | null>
  declare failReason: CreationOptional<string>
  declare accountChannel: CreationOptional<string>
  declare accountTargetId: CreationOptional<string>
  declare transactionId: CreationOptional<string>
  declare participantSnapshot: CreationOptional<string>
  declare taskSnapshot: CreationOptional<string>
  declare rewardRulesSnapshot: CreationOptional<string>
  declare checkDimension: CreationOptional<string>
  declare checkLevel: CreationOptional<string>
  declare checkMessage: CreationOptional<string>
  declare violationType: CreationOptional<string>
  declare violationDetail: CreationOptional<string>
  declare reconcileStatus: CreationOptional<number>
  declare reconcileRemark: CreationOptional<string>
  declare reconcileTime: CreationOptional<Date | null>
  declare expireTime: CreationOptional<Date | null>
  declare remark: CreationOptional<string>
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare batchId: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

ActivityReward.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    rewardNo: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      comment: '奖励发放单号（全局唯一）'
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
    participationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '关联参与记录ID'
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
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '用户昵称'
    },
    rewardType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: '',
      comment: '奖励类型（枚举：现金/积分/优惠券/虚拟币/实物等）'
    },
    rewardTypeName: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: '',
      comment: '奖励类型名称'
    },
    rewardName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: '',
      comment: '奖励名称'
    },
    rewardAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '奖励金额（元/积分/币）'
    },
    rewardQuantity: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 1,
      comment: '奖励数量'
    },
    differentialFactor: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: '',
      comment: '差异化发放因子'
    },
    differentialValue: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 1,
      comment: '差异化系数（倍率）'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '状态 0待发放 1锁定中 2已发放 3已到账 4发放失败 5额度退回 6已回收 7已撤销'
    },
    budgetLockedTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '预算锁定时间'
    },
    issueTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发放时间'
    },
    arriveTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '到账确认时间'
    },
    failTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '失败时间'
    },
    recycleTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '回收时间'
    },
    failReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '失败原因'
    },
    accountChannel: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: '',
      comment: '到账渠道 wallet/payment/coupon/points'
    },
    accountTargetId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '到账账户ID/订单号'
    },
    transactionId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '支付/结算事务ID'
    },
    participantSnapshot: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '用户参与属性快照 JSON'
    },
    taskSnapshot: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '任务完成情况快照 JSON'
    },
    rewardRulesSnapshot: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '活动奖励规则快照 JSON'
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
    reconcileStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '账目核对状态 0待核对 1账实一致 2账实不符 3人工修正'
    },
    reconcileRemark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '核对备注'
    },
    reconcileTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最近核对时间'
    },
    expireTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '奖励过期时间（未领取/未使用）'
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
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '操作人名称'
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
    tableName: 'biz_activity_reward',
    modelName: 'ActivityReward',
    paranoid: true,
    indexes: [
      { unique: true, fields: ['reward_no'] },
      { unique: true, fields: ['activity_id', 'participation_id', 'delete_time'] },
      { fields: ['user_id', 'status', 'create_time'] },
      { fields: ['activity_id', 'status', 'create_time'] },
      { fields: ['status', 'create_time'] },
      { fields: ['reconcile_status', 'create_time'] },
      { fields: ['violation_type', 'create_time'] },
      { fields: ['batch_id'] }
    ]
  }
)

export default ActivityReward

import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum MerchantOnboardingLogType {
  SUBMIT = 'submit',
  PRE_CHECK = 'pre_check',
  INITIAL_PASS = 'initial_pass',
  INITIAL_REJECT = 'initial_reject',
  FINAL_PASS = 'final_pass',
  FINAL_REJECT = 'final_reject',
  BATCH_PASS = 'batch_pass',
  BATCH_REJECT = 'batch_reject',
  BATCH_RETURN = 'batch_return',
  RETURN = 'return',
  STATUS_CHANGE = 'status_change',
  PERMISSION_CHANGE = 'permission_change',
  DUPLICATE_DETECT = 'duplicate_detect',
  FAKE_DETECT = 'fake_detect',
  CROSS_INDUSTRY_DETECT = 'cross_industry_detect',
  CREDIT_UPDATE = 'credit_update'
}

export const MERCHANT_ONBOARDING_LOG_TYPE_NAMES: Record<string, string> = {
  [MerchantOnboardingLogType.SUBMIT]: '提交申请',
  [MerchantOnboardingLogType.PRE_CHECK]: '前置校验',
  [MerchantOnboardingLogType.INITIAL_PASS]: '初审通过',
  [MerchantOnboardingLogType.INITIAL_REJECT]: '初审驳回',
  [MerchantOnboardingLogType.FINAL_PASS]: '终审通过',
  [MerchantOnboardingLogType.FINAL_REJECT]: '终审驳回',
  [MerchantOnboardingLogType.BATCH_PASS]: '批量通过',
  [MerchantOnboardingLogType.BATCH_REJECT]: '批量驳回',
  [MerchantOnboardingLogType.BATCH_RETURN]: '批量退回',
  [MerchantOnboardingLogType.RETURN]: '退回补充',
  [MerchantOnboardingLogType.STATUS_CHANGE]: '状态变更',
  [MerchantOnboardingLogType.PERMISSION_CHANGE]: '权限变更',
  [MerchantOnboardingLogType.DUPLICATE_DETECT]: '重复入驻检测',
  [MerchantOnboardingLogType.FAKE_DETECT]: '虚假资质检测',
  [MerchantOnboardingLogType.CROSS_INDUSTRY_DETECT]: '跨行业违规检测',
  [MerchantOnboardingLogType.CREDIT_UPDATE]: '信用评分更新'
}

class MerchantOnboardingLog extends Model<InferAttributes<MerchantOnboardingLog>, InferCreationAttributes<MerchantOnboardingLog>> {
  declare id: CreationOptional<number>
  declare applyId: number
  declare logType: string
  declare operatorId: CreationOptional<number>
  declare operatorName: CreationOptional<string>
  declare operatorRole: CreationOptional<string>
  declare beforeStatus: CreationOptional<number>
  declare afterStatus: CreationOptional<number>
  declare remark: CreationOptional<string>
  declare detail: CreationOptional<string>
  declare ip: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

MerchantOnboardingLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    applyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '入驻申请ID'
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
      comment: '操作人姓名'
    },
    operatorRole: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: '',
      comment: '操作人角色'
    },
    beforeStatus: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '变更前状态'
    },
    afterStatus: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '变更后状态'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '备注'
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '详细信息JSON'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '操作IP'
    },
    createTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_merchant_onboarding_log',
    modelName: 'MerchantOnboardingLog',
    indexes: [
      { fields: ['apply_id'] },
      { fields: ['log_type'] },
      { fields: ['create_time'] }
    ],
    timestamps: false
  }
)

export default MerchantOnboardingLog

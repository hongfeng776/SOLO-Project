import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum QualificationLogType {
  SUBMIT = 'submit',
  PRE_CHECK = 'pre_check',
  AUDIT_PASS = 'audit_pass',
  AUDIT_REJECT = 'audit_reject',
  BATCH_PASS = 'batch_pass',
  BATCH_REJECT = 'batch_reject',
  EXPIRE = 'expire',
  RENEW = 'renew',
  FAKE_DETECT = 'fake_detect',
  STATUS_CHANGE = 'status_change',
  BENEFIT_CHANGE = 'benefit_change'
}

export const QUALIFICATION_LOG_TYPE_NAMES: Record<string, string> = {
  [QualificationLogType.SUBMIT]: '提交申请',
  [QualificationLogType.PRE_CHECK]: '前置校验',
  [QualificationLogType.AUDIT_PASS]: '审核通过',
  [QualificationLogType.AUDIT_REJECT]: '审核驳回',
  [QualificationLogType.BATCH_PASS]: '批量通过',
  [QualificationLogType.BATCH_REJECT]: '批量驳回',
  [QualificationLogType.EXPIRE]: '资质过期',
  [QualificationLogType.RENEW]: '资质续期',
  [QualificationLogType.FAKE_DETECT]: '虚假资质检测',
  [QualificationLogType.STATUS_CHANGE]: '身份状态变更',
  [QualificationLogType.BENEFIT_CHANGE]: '权益变更'
}

class CreatorQualificationLog extends Model<InferAttributes<CreatorQualificationLog>, InferCreationAttributes<CreatorQualificationLog>> {
  declare id: CreationOptional<number>
  declare applyId: number
  declare creatorId: number
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

CreatorQualificationLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    applyId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '资质申请ID'
    },
    creatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '达人ID'
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
    tableName: 'biz_creator_qualification_log',
    modelName: 'CreatorQualificationLog',
    indexes: [
      { fields: ['apply_id'] },
      { fields: ['creator_id'] },
      { fields: ['log_type'] },
      { fields: ['create_time'] }
    ],
    timestamps: false
  }
)

export default CreatorQualificationLog

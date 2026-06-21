import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'
import {
  CampaignAuditAction
} from '@/enums/business'

class ActivityAuditLog extends Model<InferAttributes<ActivityAuditLog>, InferCreationAttributes<ActivityAuditLog>> {
  declare id: CreationOptional<number>
  declare activityId: number
  declare activityName: string
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
  declare ip: CreationOptional<string>
  declare userAgent: CreationOptional<string>
  declare batchId: CreationOptional<string>
  declare remark: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

ActivityAuditLog.init(
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
      comment: '活动名称（快照）'
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: CampaignAuditAction.UPDATED,
      comment: '操作类型'
    },
    actionName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '操作类型名称（快照）'
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
    oldData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更前数据JSON'
    },
    newData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更后数据JSON'
    },
    changedFields: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '变更字段列表JSON'
    },
    checkDimension: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '校验维度（上线拦截场景）'
    },
    checkLevel: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '校验等级 pass/warning/error/blocker'
    },
    checkMessage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '校验消息'
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
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '批量操作批次号'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '备注'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_activity_audit_log',
    modelName: 'ActivityAuditLog',
    paranoid: false,
    indexes: [
      { fields: ['activity_id', 'create_time'] },
      { fields: ['operator_id', 'create_time'] },
      { fields: ['action', 'create_time'] },
      { fields: ['batch_id'] }
    ]
  }
)

export default ActivityAuditLog

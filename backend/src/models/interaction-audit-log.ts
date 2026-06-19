import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class InteractionAuditLog extends Model<
  InferAttributes<InteractionAuditLog>,
  InferCreationAttributes<InteractionAuditLog>
> {
  declare id: CreationOptional<number>
  declare noteId: number
  declare noteTitle: string
  declare action: string
  declare actionName: string
  declare operatorId: number
  declare operatorName: string
  declare operatorRole: string
  declare beforeData: CreationOptional<string>
  declare afterData: CreationOptional<string>
  declare abnormalIds: CreationOptional<string>
  declare handledCount: CreationOptional<number>
  declare successCount: CreationOptional<number>
  declare reason: CreationOptional<string>
  declare result: CreationOptional<string>
  declare ip: CreationOptional<string>
  declare userAgent: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

InteractionAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '笔记ID，批量操作时为0'
    },
    noteTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '笔记标题，批量操作时为空'
    },
    action: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '操作类型 calibrate/clean/mark_quality/demote/promote/batch_calibrate/batch_clean/batch_mark_quality'
    },
    actionName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '操作名称'
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作人姓名'
    },
    operatorRole: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: '',
      comment: '操作人角色'
    },
    beforeData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '操作前数据快照(JSON)'
    },
    afterData: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '操作后数据快照(JSON)'
    },
    abnormalIds: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '处理的异常记录ID列表'
    },
    handledCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '处理总数'
    },
    successCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '成功数'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '操作原因'
    },
    result: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: '',
      comment: '操作结果'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: 'IP地址'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '用户代理'
    },
    createTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_interaction_audit_log',
    modelName: 'InteractionAuditLog',
    indexes: [
      { fields: ['note_id', 'create_time'] },
      { fields: ['operator_id', 'create_time'] },
      { fields: ['action', 'create_time'] },
      { fields: ['create_time'] }
    ]
  }
)

export default InteractionAuditLog

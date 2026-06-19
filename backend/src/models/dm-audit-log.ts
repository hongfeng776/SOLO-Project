import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class DmAuditLog extends Model<InferAttributes<DmAuditLog>, InferCreationAttributes<DmAuditLog>> {
  declare id: CreationOptional<number>
  declare messageId: CreationOptional<number>
  declare conversationId: CreationOptional<number>
  declare senderId: number
  declare senderName: string
  declare receiverId: number
  declare receiverName: string
  declare content: CreationOptional<string>
  declare action: number
  declare violationType: CreationOptional<string>
  declare violationDetail: CreationOptional<string>
  declare sensitiveWords: CreationOptional<string>
  declare punishmentType: CreationOptional<string>
  declare punishmentDuration: CreationOptional<number>
  declare handlerId: CreationOptional<number>
  declare handlerName: CreationOptional<string>
  declare handleNote: CreationOptional<string>
  declare ip: CreationOptional<string>
  declare deviceInfo: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

DmAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    messageId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '消息ID'
    },
    conversationId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '会话ID'
    },
    senderId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '发送者用户ID'
    },
    senderName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '发送者用户名'
    },
    receiverId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '接收者用户ID'
    },
    receiverName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '接收者用户名'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '消息内容原文'
    },
    action: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '操作 0自动拦截 1合规通过 2违规删除 3账号处罚 4批量清理 5批量封禁 6会话限制 7解除限制 8人工复核'
    },
    violationType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '违规类型'
    },
    violationDetail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '违规详情'
    },
    sensitiveWords: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '命中敏感词'
    },
    punishmentType: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: '',
      comment: '处罚类型 warning/temp_restrict/temp_ban/permanent_ban'
    },
    punishmentDuration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '处罚时长(分钟)'
    },
    handlerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '操作人ID'
    },
    handlerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '操作人名称'
    },
    handleNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '处理备注'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '发送方IP'
    },
    deviceInfo: {
      type: DataTypes.STRING(200),
      allowNull: true,
      defaultValue: '',
      comment: '设备信息'
    },
    createTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_dm_audit_log',
    modelName: 'DmAuditLog',
    indexes: [
      { fields: ['message_id'] },
      { fields: ['conversation_id'] },
      { fields: ['sender_id', 'action'] },
      { fields: ['action', 'create_time'] },
      { fields: ['violation_type', 'create_time'] }
    ]
  }
)

export default DmAuditLog

import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class CommentAuditLog extends Model<InferAttributes<CommentAuditLog>, InferCreationAttributes<CommentAuditLog>> {
  declare id: CreationOptional<number>
  declare commentId: number
  declare noteId: number
  declare userId: number
  declare userName: string
  declare content: string
  declare action: number
  declare violationType: CreationOptional<string>
  declare violationDetail: CreationOptional<string>
  declare sensitiveWords: CreationOptional<string>
  declare handlerId: CreationOptional<number>
  declare handlerName: CreationOptional<string>
  declare handleNote: CreationOptional<string>
  declare ip: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

CommentAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    commentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    userName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    action: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '0自动拦截 1审核通过 2审核驳回 3批量通过 4批量删除 5标记复核'
    },
    violationType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    violationDetail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    sensitiveWords: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    handlerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    handlerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    handleNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    createTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_comment_audit_log',
    modelName: 'CommentAuditLog',
    indexes: [
      { fields: ['comment_id'] },
      { fields: ['user_id', 'action'] },
      { fields: ['action', 'create_time'] }
    ]
  }
)

export default CommentAuditLog

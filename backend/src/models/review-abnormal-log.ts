import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ReviewAbnormalLog extends Model<InferAttributes<ReviewAbnormalLog>, InferCreationAttributes<ReviewAbnormalLog>> {
  declare id: CreationOptional<number>
  declare reviewLogId: number
  declare noteId: number
  declare reviewerId: number
  declare reviewerName: string
  declare abnormalType: string
  declare abnormalReason: string
  declare severity: number
  declare status: CreationOptional<number>
  declare handlerId: CreationOptional<number | null>
  declare handlerName: CreationOptional<string>
  declare handleNote: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

ReviewAbnormalLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    reviewLogId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '审核日志ID'
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '笔记ID'
    },
    reviewerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '审核人ID'
    },
    reviewerName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '审核人姓名'
    },
    abnormalType: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '异常类型'
    },
    abnormalReason: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '异常原因'
    },
    severity: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '严重程度 1轻微 2中等 3严重'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '处理状态 0待处理 1已处理 2已忽略'
    },
    handlerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '处理人ID'
    },
    handlerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '处理人姓名'
    },
    handleNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '处理备注'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_review_abnormal_log',
    modelName: 'ReviewAbnormalLog',
    indexes: [
      { fields: ['review_log_id'], unique: true },
      { fields: ['reviewer_id', 'create_time'] },
      { fields: ['severity', 'status'] },
      { fields: ['abnormal_type', 'create_time'] }
    ]
  }
)

export default ReviewAbnormalLog

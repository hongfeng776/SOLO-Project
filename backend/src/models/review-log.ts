import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ReviewLog extends Model<InferAttributes<ReviewLog>, InferCreationAttributes<ReviewLog>> {
  declare id: CreationOptional<number>
  declare noteId: number
  declare noteTitle: string
  declare reviewerId: number
  declare reviewerName: string
  declare action: number
  declare reviewLevel: number
  declare statusBefore: number
  declare statusAfter: number
  declare reason: CreationOptional<string>
  declare violationType: CreationOptional<string>
  declare reviewWeight: CreationOptional<number>
  declare isAbnormal: CreationOptional<number>
  declare abnormalReason: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

ReviewLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '笔记ID'
    },
    noteTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '笔记标题'
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
    action: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '审核动作 1通过 2驳回 3暂缓'
    },
    reviewLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '审核层级 1/2/3'
    },
    statusBefore: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '审核前状态'
    },
    statusAfter: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '审核后状态'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '审核原因'
    },
    violationType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '违规类型'
    },
    reviewWeight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '审核权重'
    },
    isAbnormal: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否异常 0否 1是'
    },
    abnormalReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '异常原因'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_review_log',
    modelName: 'ReviewLog',
    indexes: [
      { fields: ['note_id'] },
      { fields: ['reviewer_id', 'create_time'] },
      { fields: ['action', 'create_time'] },
      { fields: ['is_abnormal', 'create_time'] }
    ]
  }
)

export default ReviewLog

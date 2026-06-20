import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class HotCommentLog extends Model<InferAttributes<HotCommentLog>, InferCreationAttributes<HotCommentLog>> {
  declare id: CreationOptional<number>
  declare hotCommentId: CreationOptional<number>
  declare commentId: number
  declare noteId: number
  declare action: number
  declare actionName: CreationOptional<string>
  declare beforeStatus: CreationOptional<number>
  declare afterStatus: CreationOptional<number>
  declare beforeIsTop: CreationOptional<number>
  declare afterIsTop: CreationOptional<number>
  declare beforeTopOrder: CreationOptional<number>
  declare afterTopOrder: CreationOptional<number>
  declare beforeHotScore: CreationOptional<number>
  declare afterHotScore: CreationOptional<number>
  declare beforeRank: CreationOptional<number>
  declare afterRank: CreationOptional<number>
  declare qualityScore: CreationOptional<number>
  declare conflictReason: CreationOptional<string>
  declare anomalyReason: CreationOptional<string>
  declare riskLevel: CreationOptional<number>
  declare violationType: CreationOptional<string>
  declare handlerId: CreationOptional<number | null>
  declare handlerName: CreationOptional<string>
  declare handleNote: CreationOptional<string>
  declare sourceType: CreationOptional<string>
  declare ip: CreationOptional<string>
  declare deviceInfo: CreationOptional<string>
  declare createTime: CreationOptional<Date>
}

HotCommentLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    hotCommentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      comment: '热门评论ID'
    },
    commentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '评论ID'
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '笔记ID'
    },
    action: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '0上榜 1自动置顶 2人工置顶 3取消置顶 4下架 5批量置顶 6批量下架 7刷新排序 8冲突拦截 9异常拦截'
    },
    actionName: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: '',
      comment: '操作名称'
    },
    beforeStatus: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '操作前状态'
    },
    afterStatus: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '操作后状态'
    },
    beforeIsTop: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '操作前置顶状态'
    },
    afterIsTop: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '操作后置顶状态'
    },
    beforeTopOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作前置顶顺序'
    },
    afterTopOrder: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作后置顶顺序'
    },
    beforeHotScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '操作前热度分'
    },
    afterHotScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '操作后热度分'
    },
    beforeRank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作前排名'
    },
    afterRank: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作后排名'
    },
    qualityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: '质量分快照'
    },
    conflictReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '冲突原因'
    },
    anomalyReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '异常原因'
    },
    riskLevel: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: '评论风险等级快照'
    },
    violationType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: '',
      comment: '违规类型快照'
    },
    handlerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作人ID'
    },
    handlerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '操作人姓名'
    },
    handleNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '操作备注'
    },
    sourceType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'auto',
      comment: '来源 auto/manual/batch'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '操作IP'
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
    tableName: 'biz_hot_comment_log',
    modelName: 'HotCommentLog',
    indexes: [
      { fields: ['hot_comment_id'] },
      { fields: ['comment_id', 'action'] },
      { fields: ['note_id', 'create_time'] },
      { fields: ['action', 'create_time'] },
      { fields: ['handler_id', 'action'] },
      { fields: ['source_type', 'create_time'] }
    ]
  }
)

export default HotCommentLog

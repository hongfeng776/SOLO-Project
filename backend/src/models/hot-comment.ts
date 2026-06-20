import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class HotComment extends Model<InferAttributes<HotComment>, InferCreationAttributes<HotComment>> {
  declare id: CreationOptional<number>
  declare commentId: number
  declare noteId: number
  declare userId: number
  declare nickname: CreationOptional<string>
  declare avatar: CreationOptional<string>
  declare content: CreationOptional<string>
  declare likeCount: CreationOptional<number>
  declare replyCount: CreationOptional<number>
  declare contentLength: CreationOptional<number>
  declare keywordDensity: CreationOptional<number>
  declare qualityScore: CreationOptional<number>
  declare hotScore: CreationOptional<number>
  declare weightLike: CreationOptional<number>
  declare weightReply: CreationOptional<number>
  declare weightTime: CreationOptional<number>
  declare weightQuality: CreationOptional<number>
  declare isTop: CreationOptional<number>
  declare topSource: CreationOptional<string>
  declare topOrder: CreationOptional<number>
  declare topTime: CreationOptional<Date | null>
  declare topHandlerId: CreationOptional<number | null>
  declare topHandlerName: CreationOptional<string>
  declare status: CreationOptional<number>
  declare sourceType: CreationOptional<string>
  declare rank: CreationOptional<number>
  declare conflictReason: CreationOptional<string>
  declare lastRefreshTime: CreationOptional<Date | null>
  declare expireTime: CreationOptional<Date | null>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

HotComment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
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
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '发布用户ID'
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '用户昵称'
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '用户头像'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '评论内容'
    },
    likeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '点赞量'
    },
    replyCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '回复量'
    },
    contentLength: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '内容长度'
    },
    keywordDensity: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '关键词密度'
    },
    qualityScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '内容质量分0-100'
    },
    hotScore: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '综合热度分'
    },
    weightLike: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '点赞权重分'
    },
    weightReply: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '回复权重分'
    },
    weightTime: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '时间权重分'
    },
    weightQuality: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '质量权重分'
    },
    isTop: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否置顶 0否 1系统自动 2人工置顶'
    },
    topSource: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: '',
      comment: '置顶来源 auto/manual'
    },
    topOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '置顶排序号，数值越小越前'
    },
    topTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '置顶时间'
    },
    topHandlerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '置顶操作人ID'
    },
    topHandlerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '置顶操作人'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '0已下架 1正常上榜 2待审核 3冲突拦截'
    },
    sourceType: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'auto',
      comment: '上榜来源 auto/manual/batch'
    },
    rank: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '当前名次'
    },
    conflictReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '排序冲突拦截原因'
    },
    lastRefreshTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '上次刷新时间'
    },
    expireTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '过期时间，到时自动下架'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_hot_comment',
    modelName: 'HotComment',
    indexes: [
      { fields: ['comment_id'], unique: true },
      { fields: ['note_id', 'status', 'is_top', 'hot_score'] },
      { fields: ['is_top', 'top_order'] },
      { fields: ['status', 'rank'] },
      { fields: ['last_refresh_time'] },
      { fields: ['source_type', 'create_time'] }
    ]
  }
)

export default HotComment

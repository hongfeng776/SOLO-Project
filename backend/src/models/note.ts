import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class Note extends Model<InferAttributes<Note>, InferCreationAttributes<Note>> {
  declare id: CreationOptional<number>
  declare title: string
  declare content: string
  declare coverImage: string
  declare status: CreationOptional<number>
  declare authorId: number
  declare authorName: string
  declare viewCount: CreationOptional<number>
  declare likeCount: CreationOptional<number>
  declare favoriteCount: CreationOptional<number>
  declare commentCount: CreationOptional<number>
  declare shareCount: CreationOptional<number>
  declare interactionQuality: CreationOptional<number>
  declare abnormalInteraction: CreationOptional<number>
  declare isQualityInteraction: CreationOptional<number>
  declare lastInteractionCheckTime: CreationOptional<Date | null>
  declare rejectReason: CreationOptional<string>
  declare publishTime: CreationOptional<Date | null>
  declare reviewLevel: CreationOptional<number>
  declare scheduleTime: CreationOptional<Date | null>
  declare contentFingerprint: CreationOptional<string>
  declare fingerprint: CreationOptional<string>
  declare externalLinks: CreationOptional<string>
  declare videoUrl: CreationOptional<string>
  declare noteType: CreationOptional<number>
  declare batchNo: CreationOptional<string>
  declare postponeReason: CreationOptional<string>
  declare violationType: CreationOptional<string>
  declare reviewWeight: CreationOptional<number>
  declare flowUnlocked: CreationOptional<number>
  declare lastReviewerId: CreationOptional<number | null>
  declare lastReviewerName: CreationOptional<string>
  declare lastReviewTime: CreationOptional<Date | null>
  declare flowLevel: CreationOptional<number>
  declare isPinned: CreationOptional<number>
  declare isHot: CreationOptional<number>
  declare lastOpsTime: CreationOptional<Date | null>
  declare lastOpsUserId: CreationOptional<number | null>
  declare lastOpsUserName: CreationOptional<string>
  declare hiddenReason: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

Note.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0草稿 1待审核 2已发布 3已拒绝 4已下架 5定时待发布 6暂缓审核 7限流'
    },
    authorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    authorName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    viewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    likeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '点赞数'
    },
    favoriteCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '收藏数'
    },
    commentCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '评论数'
    },
    shareCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '转发数'
    },
    interactionQuality: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '互动质量分 0-100'
    },
    abnormalInteraction: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '异常互动数'
    },
    isQualityInteraction: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否优质互动笔记 0否 1是'
    },
    lastInteractionCheckTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后互动检测时间'
    },
    rejectReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    publishTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '审核层级 1/2/3'
    },
    scheduleTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    contentFingerprint: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    fingerprint: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    externalLinks: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: ''
    },
    videoUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    noteType: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '1图文 2视频'
    },
    batchNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    postponeReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '暂缓审核原因'
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
      comment: '审核权重：值越大越优先'
    },
    flowUnlocked: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '流量分发权限 0未解锁 1已解锁'
    },
    lastReviewerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '最后审核人ID'
    },
    lastReviewerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '最后审核人姓名'
    },
    lastReviewTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后审核时间'
    },
    flowLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '流量池等级 1普通 2优质 3热门'
    },
    isPinned: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否置顶 0否 1是'
    },
    isHot: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否在热门推送中 0否 1是'
    },
    lastOpsTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最后运维时间'
    },
    lastOpsUserId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '最后运维人ID'
    },
    lastOpsUserName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '最后运维人姓名'
    },
    hiddenReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '隐藏原因'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_note',
    modelName: 'Note',
    indexes: [
      { fields: ['status', 'create_time'] },
      { fields: ['author_id', 'status'] },
      { fields: ['review_level', 'status'] },
      { fields: ['author_id', 'schedule_time'] },
      { fields: ['review_weight', 'create_time'] },
      { fields: ['flow_level', 'is_hot', 'status'] },
      { fields: ['is_quality_interaction', 'flow_level'] },
      { fields: ['abnormal_interaction', 'create_time'] },
      { fields: ['interaction_quality', 'create_time'] },
      { fields: ['like_count', 'create_time'] }
    ]
  }
)

export default Note

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
  declare commentCount: CreationOptional<number>
  declare shareCount: CreationOptional<number>
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
      comment: '0草稿 1待审核 2已发布 3已拒绝 4已下架 5定时待发布'
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
      defaultValue: 0
    },
    commentCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    shareCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
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
      { fields: ['author_id', 'schedule_time'] }
    ]
  }
)

export default Note

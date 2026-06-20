import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum ContentPushStatus {
  PENDING = 0,
  PUSHING = 1,
  PAUSED = 2,
  FINISHED = 3,
  TERMINATED = 4,
  BLOCKED = 5
}

export enum ContentPushStrength {
  NORMAL = 1,
  ENHANCED = 2,
  AGGRESSIVE = 3
}

export enum PushBlockReason {
  NOT_REVIEWED = 'not_reviewed',
  STATUS_ABNORMAL = 'status_abnormal',
  POOL_NOT_MATCH = 'pool_not_match',
  MATCH_INSUFFICIENT = 'match_insufficient',
  VIOLATION = 'violation',
  FLOW_LIMITED = 'flow_limited',
  QUOTA_EXCEEDED = 'quota_exceeded'
}

class ContentPushTask extends Model<InferAttributes<ContentPushTask>, InferCreationAttributes<ContentPushTask>> {
  declare id: CreationOptional<number>
  declare taskNo: string
  declare noteId: number
  declare noteTitle: string
  declare noteCoverImage: CreationOptional<string>
  declare authorId: number
  declare authorName: string
  declare poolId: number
  declare poolName: string
  declare poolLevel: number
  declare pushStatus: CreationOptional<number>
  declare pushStrength: CreationOptional<number>
  declare targetExposure: number
  declare currentExposure: CreationOptional<number>
  declare realExposure: CreationOptional<number>
  declare clickCount: CreationOptional<number>
  declare likeCount: CreationOptional<number>
  declare commentCount: CreationOptional<number>
  declare shareCount: CreationOptional<number>
  declare interactCount: CreationOptional<number>
  declare targetUserCount: CreationOptional<number>
  declare reachedUserCount: CreationOptional<number>
  declare matchScore: number
  declare tagMatchScore: CreationOptional<number>
  declare interestMatchScore: CreationOptional<number>
  declare profileMatchScore: CreationOptional<number>
  declare contentTags: CreationOptional<string>
  declare targetInterests: CreationOptional<string>
  declare blockReason: CreationOptional<string>
  declare blockDetail: CreationOptional<string>
  declare anomalyFlags: CreationOptional<string>
  declare anomalyCount: CreationOptional<number>
  declare lastDataRefreshTime: CreationOptional<Date | null>
  declare freezeExposure: CreationOptional<number>
  declare freezeClick: CreationOptional<number>
  declare freezeInteract: CreationOptional<number>
  declare startTime: CreationOptional<Date | null>
  declare pauseTime: CreationOptional<Date | null>
  declare resumeTime: CreationOptional<Date | null>
  declare finishTime: CreationOptional<Date | null>
  declare expectedEndTime: CreationOptional<Date | null>
  declare operatorId: CreationOptional<number | null>
  declare operatorName: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

ContentPushTask.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    taskNo: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true,
      comment: '推送任务编号 CP+时间戳+6位随机'
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '关联笔记ID'
    },
    noteTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '笔记标题快照'
    },
    noteCoverImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '笔记封面快照'
    },
    authorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    authorName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    poolId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '所属流量池ID'
    },
    poolName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '流量池名称快照'
    },
    poolLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '流量池等级 1-4'
    },
    pushStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0待推送 1推送中 2已暂停 3已完成 4已终止 5已拦截'
    },
    pushStrength: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '推送力度 1标准 2加强 3激进'
    },
    targetExposure: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '目标曝光量'
    },
    currentExposure: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '累计曝光(含冻结)'
    },
    realExposure: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '真实曝光(清洗后)'
    },
    clickCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    likeCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    commentCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    shareCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0
    },
    interactCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '总互动数'
    },
    targetUserCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '目标用户数'
    },
    reachedUserCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '触达用户数'
    },
    matchScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '综合匹配度 0-100'
    },
    tagMatchScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '内容标签匹配分'
    },
    interestMatchScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '用户兴趣匹配分'
    },
    profileMatchScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '用户画像匹配分'
    },
    contentTags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '内容标签快照 JSON数组'
    },
    targetInterests: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '目标用户兴趣标签 JSON'
    },
    blockReason: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: '',
      comment: '拦截原因编码'
    },
    blockDetail: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '拦截详细说明'
    },
    anomalyFlags: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '异常标记 JSON'
    },
    anomalyCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '检测到的异常次数'
    },
    lastDataRefreshTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '数据最后刷新时间'
    },
    freezeExposure: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '暂停时冻结曝光'
    },
    freezeClick: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '暂停时冻结点击'
    },
    freezeInteract: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '暂停时冻结互动'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    pauseTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resumeTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    finishTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expectedEndTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    operatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    createTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updateTime: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    tableName: 'biz_content_push_task',
    indexes: [
      { fields: ['taskNo'], unique: true },
      { fields: ['noteId'] },
      { fields: ['poolId'] },
      { fields: ['authorId'] },
      { fields: ['pushStatus'] },
      { fields: ['poolLevel'] },
      { fields: ['matchScore'] },
      { fields: ['createTime'] },
      { fields: ['startTime'] }
    ]
  }
)

export default ContentPushTask

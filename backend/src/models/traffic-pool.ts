import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum TrafficPoolLevel {
  NORMAL = 1,
  QUALITY = 2,
  HOT = 3,
  PREMIUM = 4
}

export enum TrafficPoolStatus {
  DISABLED = 0,
  ENABLED = 1
}

export enum ContentAdaptType {
  GENERAL = 'general',
  IMAGE_TEXT = 'image_text',
  VIDEO = 'video',
  SHORT_VIDEO = 'short_video',
  LIVE = 'live'
}

export const TRAFFIC_POOL_LEVEL_NAMES: Record<number, string> = {
  [TrafficPoolLevel.NORMAL]: '普通池',
  [TrafficPoolLevel.QUALITY]: '优质池',
  [TrafficPoolLevel.HOT]: '热门池',
  [TrafficPoolLevel.PREMIUM]: '尊享池'
}

export const TRAFFIC_POOL_LEVEL_COLORS: Record<number, string> = {
  [TrafficPoolLevel.NORMAL]: '#909399',
  [TrafficPoolLevel.QUALITY]: '#409eff',
  [TrafficPoolLevel.HOT]: '#e6a23c',
  [TrafficPoolLevel.PREMIUM]: '#67c23a'
}

export const CONTENT_ADAPT_TYPE_NAMES: Record<string, string> = {
  [ContentAdaptType.GENERAL]: '通用',
  [ContentAdaptType.IMAGE_TEXT]: '图文',
  [ContentAdaptType.VIDEO]: '视频',
  [ContentAdaptType.SHORT_VIDEO]: '短视频',
  [ContentAdaptType.LIVE]: '直播'
}

export const PLATFORM_TOTAL_FLOW_QUOTA = 10000000

class TrafficPool extends Model<InferAttributes<TrafficPool>, InferCreationAttributes<TrafficPool>> {
  declare id: CreationOptional<number>
  declare poolName: string
  declare poolCode: string
  declare poolLevel: number
  declare contentAdaptType: string
  declare dailyQuota: number
  declare usedQuota: CreationOptional<number>
  declare remainingQuota: CreationOptional<number>
  declare weightMultiplier: number
  declare minContentScore: number
  declare maxViolationCount: number
  declare admissionRules: CreationOptional<string>
  declare description: CreationOptional<string>
  declare status: CreationOptional<number>
  declare contentCount: CreationOptional<number>
  declare avgExposure: CreationOptional<number>
  declare clickRate: CreationOptional<number>
  declare sortOrder: CreationOptional<number>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

TrafficPool.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    poolName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '流量池名称'
    },
    poolCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '流量池编码'
    },
    poolLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: TrafficPoolLevel.NORMAL,
      comment: '流量池等级 1普通 2优质 3热门 4尊享'
    },
    contentAdaptType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: ContentAdaptType.GENERAL,
      comment: '内容适配类型'
    },
    dailyQuota: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '日流量配额'
    },
    usedQuota: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '已用配额'
    },
    remainingQuota: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '剩余配额'
    },
    weightMultiplier: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1.0,
      comment: '分发权重倍数'
    },
    minContentScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '准入内容最低质量分 0-100'
    },
    maxViolationCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '最大违规次数'
    },
    admissionRules: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '准入规则JSON'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: '',
      comment: '描述'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: TrafficPoolStatus.ENABLED,
      comment: '状态 0停用 1启用'
    },
    contentCount: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '池内内容数量'
    },
    avgExposure: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '平均曝光量'
    },
    clickRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
      defaultValue: 0,
      comment: '点击率'
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_traffic_pool',
    modelName: 'TrafficPool',
    indexes: [
      { fields: ['poolLevel'] },
      { fields: ['contentAdaptType'] },
      { fields: ['status'] }
    ]
  }
)

export default TrafficPool

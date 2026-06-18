import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

export enum CreatorBenefit {
  LIVE_STREAMING = 'live_streaming',
  PRODUCT_LINK = 'product_link',
  SHOPPING_CART = 'shopping_cart',
  BRAND_COOPERATION = 'brand_cooperation',
  COMMISSION = 'commission',
  DATA_ANALYTICS = 'data_analytics',
  ACTIVITY_PRIORITY = 'activity_priority',
  CUSTOMER_SERVICE = 'customer_service',
  VERIFIED_BADGE = 'verified_badge',
  FLOW_BOOST = 'flow_boost'
}

export const CREATOR_BENEFIT_NAMES: Record<string, string> = {
  [CreatorBenefit.LIVE_STREAMING]: '直播带货',
  [CreatorBenefit.PRODUCT_LINK]: '商品链接',
  [CreatorBenefit.SHOPPING_CART]: '购物车功能',
  [CreatorBenefit.BRAND_COOPERATION]: '品牌合作',
  [CreatorBenefit.COMMISSION]: '佣金结算',
  [CreatorBenefit.DATA_ANALYTICS]: '数据分析',
  [CreatorBenefit.ACTIVITY_PRIORITY]: '活动优先',
  [CreatorBenefit.CUSTOMER_SERVICE]: '专属客服',
  [CreatorBenefit.VERIFIED_BADGE]: '认证标识',
  [CreatorBenefit.FLOW_BOOST]: '流量扶持'
}

export enum CreatorIdentityStatus {
  NORMAL = 0,
  VERIFIED = 1,
  RESTRICTED = 2,
  BANNED = 3
}

export const CREATOR_IDENTITY_STATUS_NAMES: Record<number, string> = {
  [CreatorIdentityStatus.NORMAL]: '普通用户',
  [CreatorIdentityStatus.VERIFIED]: '认证达人',
  [CreatorIdentityStatus.RESTRICTED]: '受限达人',
  [CreatorIdentityStatus.BANNED]: '封禁达人'
}

class CreatorBenefitConfig extends Model<InferAttributes<CreatorBenefitConfig>, InferCreationAttributes<CreatorBenefitConfig>> {
  declare id: CreationOptional<number>
  declare creatorId: number
  declare identityStatus: number
  declare benefits: string
  declare liveStreamingEnabled: CreationOptional<number>
  declare productLinkEnabled: CreationOptional<number>
  declare shoppingCartEnabled: CreationOptional<number>
  declare brandCooperationEnabled: CreationOptional<number>
  declare commissionEnabled: CreationOptional<number>
  declare commissionRate: CreationOptional<number>
  declare dataAnalyticsEnabled: CreationOptional<number>
  declare activityPriorityEnabled: CreationOptional<number>
  declare customerServiceEnabled: CreationOptional<number>
  declare verifiedBadgeEnabled: CreationOptional<number>
  declare flowBoostEnabled: CreationOptional<number>
  declare flowBoostValue: CreationOptional<number>
  declare qualificationExpireTime: CreationOptional<Date | null>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

CreatorBenefitConfig.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    creatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      unique: true,
      comment: '达人ID'
    },
    identityStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '身份状态 0普通用户 1认证达人 2受限达人 3封禁达人'
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '权益列表JSON'
    },
    liveStreamingEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '直播带货权限'
    },
    productLinkEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '商品链接权限'
    },
    shoppingCartEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '购物车功能权限'
    },
    brandCooperationEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '品牌合作权限'
    },
    commissionEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '佣金结算权限'
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
      comment: '佣金比例%'
    },
    dataAnalyticsEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '数据分析权限'
    },
    activityPriorityEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '活动优先权限'
    },
    customerServiceEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '专属客服权限'
    },
    verifiedBadgeEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '认证标识'
    },
    flowBoostEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '流量扶持开关'
    },
    flowBoostValue: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '流量扶持数值'
    },
    qualificationExpireTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '资质到期时间'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_creator_benefit_config',
    modelName: 'CreatorBenefitConfig',
    indexes: [
      { fields: ['creator_id'], unique: true },
      { fields: ['identity_status'] },
      { fields: ['qualification_expire_time'] }
    ]
  }
)

export default CreatorBenefitConfig

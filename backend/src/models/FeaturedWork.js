const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const FeaturedWork = sequelize.define(
  'FeaturedWork',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '收录ID'
    },
    featuredCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '收录编号'
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资源ID'
    },
    resourceTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '资源标题'
    },
    resourceType: {
      type: DataTypes.ENUM('image', 'video', 'audio', 'template'),
      allowNull: false,
      comment: '资源类型'
    },
    coverUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '封面图URL'
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '作者ID'
    },
    authorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '作者名称'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '分类ID'
    },
    categoryName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '分类名称'
    },
    status: {
      type: DataTypes.ENUM('pending_verify', 'verified', 'featured', 'removed', 'rejected'),
      defaultValue: 'pending_verify',
      allowNull: false,
      comment: '收录状态: pending_verify-待核验 verified-已核验 featured-已收录 removed-已取消收录 rejected-不予收录'
    },
    featuredLevel: {
      type: DataTypes.ENUM('normal', 'silver', 'gold', 'platinum', 'diamond'),
      defaultValue: 'normal',
      allowNull: false,
      comment: '精选等级'
    },
    displayWeight: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '展示权重'
    },
    displayPosition: {
      type: DataTypes.ENUM('home_banner', 'home_recommend', 'category_top', 'special_zone', 'editor_pick', 'hot_list'),
      allowNull: true,
      comment: '展示位置'
    },
    featuredTags: {
      type: DataTypes.STRING(500),
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('featuredTags')
        return rawValue ? rawValue.split(',') : []
      },
      set(val) {
        if (Array.isArray(val)) {
          this.setDataValue('featuredTags', val.join(','))
        } else {
          this.setDataValue('featuredTags', val || '')
        }
      },
      comment: '精选标签(逗号分隔)'
    },
    qualityScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '质量评分(0-100)'
    },
    originalScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '原创评分(0-100)'
    },
    resolutionScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '画质评分(0-100)'
    },
    complianceScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '合规评分(0-100)'
    },
    overallScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '综合评分(0-100)'
    },
    verifyReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '核验依据'
    },
    verifyOperatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '核验操作人ID'
    },
    verifyOperatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '核验操作人名称'
    },
    verifyTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '核验时间'
    },
    featuredOperatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '收录操作人ID'
    },
    featuredOperatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '收录操作人名称'
    },
    featuredTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '收录时间'
    },
    removeReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '取消收录原因'
    },
    removeOperatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '取消操作人ID'
    },
    removeOperatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '取消操作人名称'
    },
    removeTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '取消收录时间'
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '精选区浏览量'
    },
    clickCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '精选区点击量'
    },
    likeCountInZone: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '精选区点赞数'
    },
    shareCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '精选区分享数'
    },
    collectionCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '精选区收藏数'
    },
    isOriginal: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: '是否原创'
    },
    originalProof: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '原创证明材料'
    },
    hasViolation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否有违规记录'
    },
    violationDetails: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '违规详情'
    },
    accountStatusNormal: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: '作者账号状态是否正常'
    },
    accountStatusReason: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '账号异常原因'
    },
    heatAtFeatured: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '收录时热度值'
    },
    likeAtFeatured: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '收录时点赞数'
    },
    viewAtFeatured: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '收录时浏览量'
    },
    expireAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '收录到期时间'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    }
  },
  {
    tableName: 'featured_works',
    comment: '作品精选收录表',
    indexes: [
      { fields: ['resourceId'], unique: true },
      { fields: ['featuredCode'], unique: true },
      { fields: ['status'] },
      { fields: ['featuredLevel'] },
      { fields: ['displayPosition'] },
      { fields: ['authorId'] },
      { fields: ['categoryId'] },
      { fields: ['resourceType'] },
      { fields: ['isOriginal'] },
      { fields: ['hasViolation'] },
      { fields: ['displayWeight'] },
      { fields: ['status', 'featuredLevel', 'displayWeight'] },
      { fields: ['featuredTime'] }
    ]
  }
)

module.exports = FeaturedWork

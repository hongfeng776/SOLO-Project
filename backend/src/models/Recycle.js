const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const Recycle = sequelize.define(
  'Recycle',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, comment: '回收站ID' },
    resourceId: { type: DataTypes.INTEGER, allowNull: false, comment: '素材ID' },
    resourceTitle: { type: DataTypes.STRING(200), allowNull: false, comment: '素材标题' },
    resourceType: { type: DataTypes.ENUM('image', 'video', 'audio', 'template'), allowNull: false, comment: '素材类型' },
    materialCode: { type: DataTypes.STRING(50), allowNull: true, comment: '素材编码' },
    originalStatus: { type: DataTypes.STRING(30), allowNull: false, comment: '原始状态' },
    originalCategoryId: { type: DataTypes.INTEGER, allowNull: true, comment: '原始分类ID' },
    originalCategoryName: { type: DataTypes.STRING(100), allowNull: true, comment: '原始分类名称' },
    authorId: { type: DataTypes.INTEGER, allowNull: true, comment: '作者ID' },
    authorName: { type: DataTypes.STRING(50), allowNull: true, comment: '作者名称' },
    discardReason: { type: DataTypes.STRING(500), allowNull: false, comment: '废弃原因' },
    applicantId: { type: DataTypes.INTEGER, allowNull: false, comment: '申请人ID' },
    applicantName: { type: DataTypes.STRING(50), allowNull: false, comment: '申请人名称' },
    applyTime: { type: DataTypes.DATE, allowNull: false, comment: '申请时间' },
    reviewStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      defaultValue: 'pending', allowNull: false, comment: '审核状态'
    },
    reviewerId: { type: DataTypes.INTEGER, allowNull: true, comment: '审核人ID' },
    reviewerName: { type: DataTypes.STRING(50), allowNull: true, comment: '审核人名称' },
    reviewOpinion: { type: DataTypes.STRING(500), allowNull: true, comment: '审核意见' },
    reviewTime: { type: DataTypes.DATE, allowNull: true, comment: '审核时间' },
    offlineDays: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, comment: '已下架天数' },
    relatedWorks: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, comment: '关联作品数量' },
    snapshot: { type: DataTypes.TEXT, allowNull: true, comment: '素材快照(JSON)' },
    expireAt: { type: DataTypes.DATE, allowNull: true, comment: '过期销毁时间' },
    isDestroyed: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false, comment: '是否已销毁' }
  },
  {
    tableName: 'recycles',
    comment: '素材回收站表',
    indexes: [
      { fields: ['resourceId'] },
      { fields: ['reviewStatus'] },
      { fields: ['applicantId'] },
      { fields: ['expireAt'] },
      { fields: ['isDestroyed'] }
    ]
  }
)

module.exports = Recycle

const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const ResourceDataSnapshot = sequelize.define(
  'ResourceDataSnapshot',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '快照ID'
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资源ID'
    },
    resourceTitle: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '资源标题'
    },
    snapshotDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: '快照日期'
    },
    snapshotType: {
      type: DataTypes.ENUM('daily', 'hourly', 'manual', 'batch'),
      defaultValue: 'daily',
      allowNull: false,
      comment: '快照类型'
    },
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '浏览量'
    },
    viewIncrement: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '浏览量日增量'
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '点赞数'
    },
    likeIncrement: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '点赞数日增量'
    },
    favoriteCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '收藏数'
    },
    favoriteIncrement: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '收藏数日增量'
    },
    shareCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '转发数'
    },
    shareIncrement: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '转发数日增量'
    },
    commentCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '评论数'
    },
    commentIncrement: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '评论数日增量'
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '下载量'
    },
    downloadIncrement: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '下载量日增量'
    },
    hotnessScore: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '热度评分'
    },
    hotnessRank: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '热度排名'
    },
    trafficSources: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '流量来源分布'
    },
    integrityCheck: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '数据完整性校验结果'
    },
    isAnomaly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否存在数据异常'
    },
    anomalyDetails: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '异常详情'
    }
  },
  {
    tableName: 'resource_data_snapshots',
    comment: '资源数据快照表',
    indexes: [
      { fields: ['resourceId'] },
      { fields: ['snapshotDate'] },
      { fields: ['snapshotType'] },
      { fields: ['isAnomaly'] },
      { fields: ['resourceId', 'snapshotDate'] },
      { fields: ['resourceId', 'snapshotDate', 'snapshotType'] },
      { fields: ['hotnessRank'] },
      { fields: ['createdAt'] }
    ]
  }
)

module.exports = ResourceDataSnapshot

const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const FilterWeightLog = sequelize.define(
  'FilterWeightLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'ID'
    },
    filterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '滤镜ID'
    },
    filterCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '滤镜编码'
    },
    filterName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '滤镜名称'
    },
    beforeWeight: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '调整前权重'
    },
    afterWeight: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '调整后权重'
    },
    beforeRecommendWeight: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '调整前推荐权重'
    },
    afterRecommendWeight: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: true,
      comment: '调整后推荐权重'
    },
    useHeatAtAdjust: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '调整时使用热度'
    },
    userRatingAtAdjust: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '调整时用户好评率'
    },
    qualityLevelAtAdjust: {
      type: DataTypes.ENUM('poor', 'normal', 'good', 'excellent'),
      defaultValue: 'normal',
      allowNull: false,
      comment: '调整时质量等级'
    },
    changeType: {
      type: DataTypes.ENUM('manual', 'batch', 'auto', 'auto_correct'),
      defaultValue: 'manual',
      allowNull: false,
      comment: '调整方式'
    },
    weightMatchScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '权重匹配度评分'
    },
    matchIssues: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('matchIssues')
        try {
          return rawValue ? JSON.parse(rawValue) : []
        } catch {
          return []
        }
      },
      set(val) {
        this.setDataValue('matchIssues', val ? JSON.stringify(val) : '[]')
      },
      comment: '匹配问题列表(JSON)'
    },
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作人名称'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '调整原因'
    },
    batchId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '批量操作批次ID'
    },
    sortRankBefore: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '调整前推荐排序'
    },
    sortRankAfter: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '调整后推荐排序'
    },
    displayPriorityBefore: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '调整前展示优先级'
    },
    displayPriorityAfter: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '调整后展示优先级'
    }
  },
  {
    tableName: 'filter_weight_logs',
    comment: '滤镜权重调整日志表',
    indexes: [
      { fields: ['filterId'] },
      { fields: ['filterCode'] },
      { fields: ['changeType'] },
      { fields: ['operatorId'] },
      { fields: ['batchId'] },
      { fields: ['filterId', 'createdAt'] },
      { fields: ['createdAt'] }
    ]
  }
)

module.exports = FilterWeightLog

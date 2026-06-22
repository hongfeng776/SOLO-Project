const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const DataQueryLog = sequelize.define(
  'DataQueryLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID'
    },
    queryType: {
      type: DataTypes.ENUM('single', 'batch', 'summary', 'trace'),
      defaultValue: 'single',
      allowNull: false,
      comment: '查询类型：single单条/batch批量/summary汇总/trace溯源'
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
    operatorRole: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '操作人角色'
    },
    queryParams: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '查询参数'
    },
    validationResult: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '前置校验结果'
    },
    resultCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '结果数量'
    },
    affectedResourceIds: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '涉及的资源ID列表'
    },
    summaryData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '汇总统计数据'
    },
    anomalyFound: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否发现数据异常'
    },
    anomalyDetails: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '异常详情'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作IP'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '用户代理'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    }
  },
  {
    tableName: 'data_query_logs',
    comment: '数据查询日志表',
    indexes: [
      { fields: ['operatorId'] },
      { fields: ['queryType'] },
      { fields: ['anomalyFound'] },
      { fields: ['createdAt'] },
      { fields: ['operatorId', 'createdAt'] },
      { fields: ['queryType', 'createdAt'] }
    ]
  }
)

module.exports = DataQueryLog

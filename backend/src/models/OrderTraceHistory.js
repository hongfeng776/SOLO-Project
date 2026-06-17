const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const OrderTraceHistory = sequelize.define('OrderTraceHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '订单号'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人姓名'
  },
  queryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '查询次数'
  },
  traceResult: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '溯源结果摘要'
  },
  dataIntegrity: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '数据完整度(%)'
  },
  missingModules: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '缺失模块，逗号分隔'
  }
}, {
  tableName: 'biz_order_trace_history',
  comment: '订单溯源查询历史表',
  indexes: [
    { fields: ['orderId'] },
    { fields: ['orderNo'] },
    { fields: ['operatorId'] },
    { fields: ['createTime'] }
  ]
})

module.exports = OrderTraceHistory

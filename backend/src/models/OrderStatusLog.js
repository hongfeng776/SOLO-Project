const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const OrderStatusLog = sequelize.define('OrderStatusLog', {
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
  oldStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '原状态'
  },
  newStatus: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '新状态'
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
  operatorType: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '操作人类型：1管理员 2系统 3司机 4乘客'
  },
  changeReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '变更原因'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
  },
  traceId: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '链路追踪ID'
  }
}, {
  tableName: 'biz_order_status_log',
  comment: '订单状态变更日志表',
  indexes: [
    { fields: ['orderId'] },
    { fields: ['orderNo'] },
    { fields: ['operatorId'] },
    { fields: ['createTime'] }
  ]
})

module.exports = OrderStatusLog

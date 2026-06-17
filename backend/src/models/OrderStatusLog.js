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
  operatorIP: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '操作人IP地址'
  },
  changeReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '变更原因'
  },
  cancelType: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '取消类型：1用户主动取消 2司机主动取消 3系统超时取消'
  },
  responsibility: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '责任判定：passenger/driver/platform'
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
    { fields: ['createTime'] },
    { fields: ['orderId', 'oldStatus', 'newStatus'] }
  ]
})

module.exports = OrderStatusLog

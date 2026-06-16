const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const OrderLog = sequelize.define('OrderLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(32),
    comment: '订单编号'
  },
  action: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '操作类型: create/pay/cancel/refund/complete/assign'
  },
  fromStatus: {
    type: DataTypes.TINYINT,
    comment: '变更前状态'
  },
  toStatus: {
    type: DataTypes.TINYINT,
    comment: '变更后状态'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    comment: '操作人姓名'
  },
  remark: {
    type: DataTypes.STRING(500),
    comment: '备注'
  }
}, {
  tableName: 'order_logs',
  comment: '订单流转日志表',
  timestamps: true,
  updatedAt: false,
  paranoid: false
});

module.exports = OrderLog;

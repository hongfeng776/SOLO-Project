const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const TransitionViolation = sequelize.define('TransitionViolation', {
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
  fromStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '尝试的源状态'
  },
  toStatus: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '尝试的目标状态'
  },
  currentStatus: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '订单实际当前状态'
  },
  violationType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '违规类型：cross_state/invalid_transition/missing_prerequisite'
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
  operatorIP: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '操作人IP'
  },
  detail: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '违规详情'
  },
  handled: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '处理状态：0未处理 1已处理'
  }
}, {
  tableName: 'sys_transition_violation',
  comment: '流转违规日志表',
  indexes: [
    { fields: ['orderId'] },
    { fields: ['orderNo'] },
    { fields: ['violationType'] },
    { fields: ['createTime'] },
    { fields: ['handled'] }
  ]
})

module.exports = TransitionViolation

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticketNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '工单号'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '关联订单号'
  },
  passengerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '乘客ID'
  },
  passengerName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '乘客姓名'
  },
  passengerPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '乘客电话'
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '司机ID'
  },
  driverName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '司机姓名'
  },
  type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '工单类型：1投诉 2退款 3异常 4咨询'
  },
  priority: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '优先级：1低 2中 3高 4紧急'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '状态：1待处理 2处理中 3已解决 4已关闭'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '分类'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '内容'
  },
  handleResult: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '处理结果'
  },
  handlerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '处理人ID'
  },
  handlerName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '处理人姓名'
  },
  handleTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处理时间'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'biz_ticket',
  comment: '客服工单表',
  indexes: [
    { fields: ['ticketNo'] },
    { fields: ['orderId'] },
    { fields: ['status'] },
    { fields: ['type'] },
    { fields: ['createTime'] }
  ]
})

module.exports = Ticket

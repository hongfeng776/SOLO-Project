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
  disputeType: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '纠纷类型：1费用争议 2服务投诉 3物品遗失'
  },
  priority: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '优先级：1低 2中 3高 4紧急'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '状态：1待审核 2审核中 3已解决 4已驳回 5已关闭'
  },
  reviewStep: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '审核步骤：1初审 2复核 3终审'
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
  evidences: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '凭证列表，JSON数组'
  },
  evidenceCount: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '凭证数量'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '申请退款金额'
  },
  actualRefundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '实际退款金额'
  },
  reputationImpact: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '信誉分影响值'
  },
  handleResult: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '处理结果'
  },
  rejectReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '驳回原因'
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
  handlerRole: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '处理人角色'
  },
  assigneeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '指派审核专员ID'
  },
  assigneeName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '指派审核专员姓名'
  },
  handleTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处理时间'
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处理截止时间'
  },
  isOverdue: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否超时：0否 1是'
  },
  hasException: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否存在处理异常：0否 1是'
  },
  exceptionType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '异常类型'
  },
  exceptionDetail: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '异常详情'
  },
  isDuplicate: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否重复工单：0否 1是'
  },
  duplicateTicketId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联重复工单ID'
  },
  remark: {
    type: DataTypes.TEXT,
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
    { fields: ['disputeType'] },
    { fields: ['passengerId'] },
    { fields: ['assigneeId'] },
    { fields: ['isOverdue'] },
    { fields: ['createTime'] }
  ]
})

module.exports = Ticket

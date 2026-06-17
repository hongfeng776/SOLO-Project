const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const TicketAuditLog = sequelize.define('TicketAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticketId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '工单ID'
  },
  ticketNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '工单号'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: true,
    comment: '关联订单号'
  },
  operationType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作类型：create/submit/assign/process/resolve/reject/close/urge/review'
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
  oldReviewStep: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '原审核步骤'
  },
  newReviewStep: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '新审核步骤'
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
  operatorRole: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '操作人角色'
  },
  operatorIP: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人IP'
  },
  assigneeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '被指派审核专员ID'
  },
  assigneeName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '被指派审核专员姓名'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '审核内容'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
  },
  rejectReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '驳回原因'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '退款金额'
  },
  reputationImpact: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '信誉分影响值'
  },
  hasException: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常：0否 1是'
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
  validationResult: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '合规校验结果，JSON'
  },
  createTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'biz_ticket_audit_log',
  comment: '工单审核日志表',
  timestamps: false,
  indexes: [
    { fields: ['ticketId'] },
    { fields: ['ticketNo'] },
    { fields: ['orderId'] },
    { fields: ['operationType'] },
    { fields: ['operatorId'] },
    { fields: ['assigneeId'] },
    { fields: ['createTime'] }
  ]
})

module.exports = TicketAuditLog

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const FlightFulfillment = require('./FlightFulfillment');
const Order = require('./Order');

const FlightFulfillmentLog = sequelize.define('FlightFulfillmentLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  fulfillmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: FlightFulfillment,
      key: 'id'
    },
    comment: '履约ID'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    },
    comment: '订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '订单编号'
  },
  operationType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作类型: create-创建履约, audit_pass-审核通过, audit_reject-审核拒绝, issue_ticket-出票, change_ticket-改签, cancel_ticket-退票, flight_change-航班变动处理, mark_abnormal-标记异常, handle_abnormal-处理异常, terminate-终止行程, batch_issue-批量出票, batch_process-批量处理, voucher_generate-生成凭证, voucher_send-发送凭证, update_ledger-更新台账, update_travel_record-更新出行记录'
  },
  operationCategory: {
    type: DataTypes.STRING(30),
    defaultValue: 'audit',
    comment: '操作分类: audit-履约审核, ticket-票务处理, flight-航班变动, abnormal-异常处理, voucher-凭证管理, ledger-台账同步'
  },
  operationDirection: {
    type: DataTypes.STRING(20),
    defaultValue: 'forward',
    comment: '操作方向: forward-正向推进, backward-回退操作, info-信息变更, none-无变化'
  },
  operationStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '操作状态: 1-成功, 2-失败'
  },
  failReason: {
    type: DataTypes.STRING(500),
    comment: '失败原因'
  },
  beforeFulfillmentStage: {
    type: DataTypes.STRING(30),
    comment: '操作前履约阶段'
  },
  afterFulfillmentStage: {
    type: DataTypes.STRING(30),
    comment: '操作后履约阶段'
  },
  beforeFulfillmentStatus: {
    type: DataTypes.TINYINT,
    comment: '操作前履约状态'
  },
  afterFulfillmentStatus: {
    type: DataTypes.TINYINT,
    comment: '操作后履约状态'
  },
  beforeTicketStatus: {
    type: DataTypes.TINYINT,
    comment: '操作前出票状态'
  },
  afterTicketStatus: {
    type: DataTypes.TINYINT,
    comment: '操作后出票状态'
  },
  beforeTicketVoucherStatus: {
    type: DataTypes.TINYINT,
    comment: '操作前凭证状态'
  },
  afterTicketVoucherStatus: {
    type: DataTypes.TINYINT,
    comment: '操作后凭证状态'
  },
  ticketNumbers: {
    type: DataTypes.JSON,
    comment: '变更涉及的票号列表'
  },
  changeFields: {
    type: DataTypes.JSON,
    comment: '变更的字段列表'
  },
  changeContent: {
    type: DataTypes.TEXT,
    comment: '变更详情描述'
  },
  operationAmount: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '操作涉及金额'
  },
  isBatchOperation: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否批量操作: 0-否, 1-是'
  },
  batchId: {
    type: DataTypes.STRING(50),
    comment: '批量操作批次号'
  },
  affectedFulfillmentCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '影响的履约记录数'
  },
  verificationDetails: {
    type: DataTypes.JSON,
    comment: '校验详情: {idValid, passengerInfoValid, flightStatusValid, ticketTimingValid}'
  },
  verificationPassed: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '校验是否通过: 0-否, 1-是'
  },
  relatedOrderIds: {
    type: DataTypes.JSON,
    comment: '关联订单ID列表(改签、退票等操作)'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(100),
    comment: '操作人姓名'
  },
  operatorRole: {
    type: DataTypes.STRING(50),
    comment: '操作人角色'
  },
  operationIp: {
    type: DataTypes.STRING(50),
    comment: '操作IP地址'
  },
  operationRemark: {
    type: DataTypes.STRING(500),
    comment: '操作备注'
  },
  effectScope: {
    type: DataTypes.STRING(100),
    comment: '生效范围: 本订单, 关联订单, 全部行程等'
  },
  createdAt: {
    type: DataTypes.DATE,
    comment: '创建时间'
  }
}, {
  tableName: 'flight_fulfillment_logs',
  comment: '机票订单履约台账日志表',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['fulfillmentId'] },
    { fields: ['orderId'] },
    { fields: ['orderNo'] },
    { fields: ['operationType'] },
    { fields: ['operationCategory'] },
    { fields: ['operationStatus'] },
    { fields: ['isBatchOperation'] },
    { fields: ['operatorId'] },
    { fields: ['createdAt'] }
  ]
});

FlightFulfillmentLog.belongsTo(FlightFulfillment, { foreignKey: 'fulfillmentId', as: 'fulfillment' });
FlightFulfillment.hasMany(FlightFulfillmentLog, { foreignKey: 'fulfillmentId', as: 'logs' });

FlightFulfillmentLog.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Order.hasMany(FlightFulfillmentLog, { foreignKey: 'orderId', as: 'flightFulfillmentLogs' });

module.exports = FlightFulfillmentLog;

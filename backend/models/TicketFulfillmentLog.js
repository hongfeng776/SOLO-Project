const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const TicketFulfillment = require('./TicketFulfillment');

const TicketFulfillmentLog = sequelize.define('TicketFulfillmentLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  fulfillmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联核销记录ID'
  },
  operationType: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '操作类型: create-创建, verify-核销, verify_fail-核销失败, repeat-重复核销, expire-过期, refund-退票, abnormal_mark-标记异常, abnormal_handle-处理异常, batch-批量, sync-数据同步, manual_edit-人工修改'
  },
  stageFrom: {
    type: DataTypes.STRING(20),
    comment: '操作前履约阶段'
  },
  stageTo: {
    type: DataTypes.STRING(20),
    comment: '操作后履约阶段'
  },
  orderId: {
    type: DataTypes.STRING(64),
    comment: '关联订单号（快照）'
  },
  ticketCode: {
    type: DataTypes.STRING(128),
    comment: '票务编码（快照）'
  },
  scenicSpotNameCache: {
    type: DataTypes.STRING(100),
    comment: '景点名称快照'
  },
  userNameCache: {
    type: DataTypes.STRING(50),
    comment: '用户姓名快照'
  },
  sessionDateCache: {
    type: DataTypes.DATEONLY,
    comment: '场次日期快照'
  },
  verifyResult: {
    type: DataTypes.STRING(20),
    comment: '校验结果: pass-通过, repeat-重复, expired-过期, fake-虚假, mismatch-不符'
  },
  verifyMessage: {
    type: DataTypes.STRING(500),
    comment: '校验消息/拦截原因'
  },
  conflictRules: {
    type: DataTypes.JSON,
    comment: '冲突/异常详细信息'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    comment: '操作人姓名'
  },
  operatorRole: {
    type: DataTypes.STRING(50),
    comment: '操作人角色'
  },
  verifyLocation: {
    type: DataTypes.JSON,
    comment: '核销时位置快照'
  },
  verifyDevice: {
    type: DataTypes.STRING(50),
    comment: '核销设备快照'
  },
  verifyGateway: {
    type: DataTypes.STRING(50),
    comment: '闸口快照'
  },
  fakeIndicator: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '本次操作是否标记虚假'
  },
  abnormalType: {
    type: DataTypes.STRING(30),
    comment: '异常类型快照'
  },
  batchId: {
    type: DataTypes.STRING(64),
    comment: '批次号（批量操作）'
  },
  dataIntegrity: {
    type: DataTypes.JSON,
    comment: '数据一致性校验结果快照: { orderConsistent, inventoryConsistent, spotConsistent }'
  },
  reason: {
    type: DataTypes.STRING(500),
    comment: '操作原因/备注'
  },
  ip: {
    type: DataTypes.STRING(50),
    comment: '操作IP'
  },
  userAgent: {
    type: DataTypes.STRING(500),
    comment: '操作UA'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ticket_fulfillment_log',
  comment: '票务核销全流程日志',
  indexes: [
    { fields: ['fulfillmentId', 'createdAt'] },
    { fields: ['operationType', 'createdAt'] },
    { fields: ['orderId'] },
    { fields: ['ticketCode'] },
    { fields: ['batchId'] },
    { fields: ['sessionDateCache', 'scenicSpotNameCache'] }
  ]
});

TicketFulfillmentLog.belongsTo(TicketFulfillment, { foreignKey: 'fulfillmentId', as: 'fulfillment' });

module.exports = TicketFulfillmentLog;

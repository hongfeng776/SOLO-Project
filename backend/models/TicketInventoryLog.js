const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const TicketInventory = require('./TicketInventory');

const TicketInventoryLog = sequelize.define('TicketInventoryLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  inventoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联库存ID'
  },
  operationType: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '操作类型: create-创建, adjust-调整库存, lock-锁定, unlock-解锁, occupy-占用, release-释放, use-核销, expire-过期, close-关闭, batch-批量, verify-校验'
  },
  changeType: {
    type: DataTypes.STRING(20),
    comment: '变更类型: total-总配额, locked-锁定数, per_order-单次限购, advance-预约规则, status-状态'
  },
  oldValue: {
    type: DataTypes.INTEGER,
    comment: '变更前数值'
  },
  newValue: {
    type: DataTypes.INTEGER,
    comment: '变更后数值'
  },
  diffValue: {
    type: DataTypes.INTEGER,
    comment: '变更差值（new - old）'
  },
  orderId: {
    type: DataTypes.STRING(64),
    comment: '关联订单号（占用/释放/核销时）'
  },
  userId: {
    type: DataTypes.STRING(64),
    comment: '关联用户ID'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    comment: '操作人ID（运维操作时）'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    comment: '操作人姓名'
  },
  operatorRole: {
    type: DataTypes.STRING(50),
    comment: '操作人角色'
  },
  sessionTypeCache: {
    type: DataTypes.STRING(20),
    comment: '场次类型快照'
  },
  scenicSpotNameCache: {
    type: DataTypes.STRING(100),
    comment: '景点名称快照'
  },
  sessionDateCache: {
    type: DataTypes.DATEONLY,
    comment: '场次日期快照'
  },
  sessionNameCache: {
    type: DataTypes.STRING(100),
    comment: '场次名称快照'
  },
  verifyResult: {
    type: DataTypes.STRING(20),
    defaultValue: 'pass',
    comment: '校验结果: pass-通过, warning-存疑, block-拦截'
  },
  verifyMessage: {
    type: DataTypes.STRING(500),
    comment: '校验不通过原因'
  },
  conflictRules: {
    type: DataTypes.JSON,
    comment: '冲突规则列表 [{field, message, conflictingId}]'
  },
  reason: {
    type: DataTypes.STRING(500),
    comment: '操作原因/备注'
  },
  batchId: {
    type: DataTypes.STRING(64),
    comment: '批次号（批量操作时）'
  },
  isOverQuota: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '本次操作是否超额'
  },
  reviewRequired: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否需人工复核'
  },
  reviewStatus: {
    type: DataTypes.STRING(20),
    comment: '复核状态: pending-待复核, approved-已通过, rejected-已驳回'
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    comment: '复核人ID'
  },
  reviewerName: {
    type: DataTypes.STRING(50),
    comment: '复核人姓名'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    comment: '复核时间'
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
  tableName: 'ticket_inventory_log',
  comment: '票务库存操作溯源日志',
  indexes: [
    { fields: ['inventoryId', 'createdAt'] },
    { fields: ['operationType', 'createdAt'] },
    { fields: ['orderId'] },
    { fields: ['batchId'] },
    { fields: ['sessionDateCache', 'sessionTypeCache'] }
  ]
});

TicketInventoryLog.belongsTo(TicketInventory, { foreignKey: 'inventoryId', as: 'inventory' });

module.exports = TicketInventoryLog;

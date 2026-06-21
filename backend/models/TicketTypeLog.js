const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const TicketType = require('./TicketType');

const TicketTypeLog = sequelize.define('TicketTypeLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  ticketTypeId: {
    type: DataTypes.INTEGER,
    comment: '票种ID'
  },
  ticketNameCache: {
    type: DataTypes.STRING(100),
    comment: '票种名称冗余'
  },
  ticketCategory: {
    type: DataTypes.STRING(20),
    comment: '票种品类冗余'
  },
  operationType: {
    type: DataTypes.STRING(30),
    comment: '操作类型: create, update, on_shelf, off_shelf, enable, disable, adjust, batch, verify_pass, verify_block, rule_change_notify'
  },
  module: {
    type: DataTypes.STRING(50),
    defaultValue: 'ticket_type',
    comment: '模块名称'
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
  reason: {
    type: DataTypes.STRING(255),
    comment: '操作原因/备注'
  },
  changes: {
    type: DataTypes.JSON,
    comment: '字段变更列表：[{field, fieldLabel, oldValue, newValue}]'
  },
  verifyResult: {
    type: DataTypes.STRING(20),
    comment: '校验结果: pass, warning, block'
  },
  verifyMessage: {
    type: DataTypes.STRING(500),
    comment: '校验不通过原因'
  },
  conflictRules: {
    type: DataTypes.JSON,
    comment: '冲突规则列表：[{field, message, conflictingTicketId}]'
  },
  orderSyncStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    comment: '已下单用户通知同步状态：pending, processing, success, failed'
  },
  orderSyncCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '同步通知的已下单用户数量'
  },
  batchId: {
    type: DataTypes.STRING(50),
    comment: '批量操作批次号'
  },
  ip: {
    type: DataTypes.STRING(50),
    comment: '操作IP'
  },
  userAgent: {
    type: DataTypes.STRING(255),
    comment: '浏览器UA'
  }
}, {
  tableName: 'ticket_type_logs',
  comment: '票种规则操作日志表（全流程溯源）',
  timestamps: true
});

TicketTypeLog.belongsTo(TicketType, { foreignKey: 'ticketTypeId', as: 'ticketType' });
TicketType.hasMany(TicketTypeLog, { foreignKey: 'ticketTypeId', as: 'logs' });

module.exports = TicketTypeLog;

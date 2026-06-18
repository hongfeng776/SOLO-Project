const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const SettlementAuditLog = sequelize.define('SettlementAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  settlementRecordId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '结算记录ID'
  },
  settlementItemId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '单笔收益ID(单条审核时)'
  },
  operationType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '操作类型：1创建结算 2修改规则 3发起结算 4审核通过 5审核驳回 6入账 7异常拦截 8规则变更 9数据修正'
  },
  operationTypeName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作类型名称'
  },
  oldSettleStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更前结算状态'
  },
  newSettleStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更后结算状态'
  },
  oldAuditStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更前审核状态'
  },
  newAuditStatus: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '变更后审核状态'
  },
  incomeChange: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '收益字段变更详情'
  },
  ruleChangeDetail: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '规则变更详情'
  },
  abnormalInterceptDetail: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '异常拦截详情'
  },
  checkResult: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '多维度校验结果'
  },
  rejectReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '驳回原因'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人'
  },
  operatorRole: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人角色'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注'
  },
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'biz_settlement_audit_log',
  comment: '结算审核记录表',
  indexes: [
    { fields: ['settlementRecordId'] },
    { fields: ['settlementItemId'] },
    { fields: ['operationType'] },
    { fields: ['operatorId'] },
    { fields: ['createTime'] }
  ]
})

module.exports = SettlementAuditLog

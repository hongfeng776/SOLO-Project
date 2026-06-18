const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MerchantAuditLog = sequelize.define('MerchantAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  merchantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商家ID',
    references: {
      model: 'merchants',
      key: 'id'
    }
  },
  action: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '操作类型: submit-提交入驻, audit_pass-审核通过, audit_reject-审核驳回, audit_temporary-审核暂存, revise-信息修正, final_pass-终审通过, final_reject-终审驳回, expire-审核过期, auto_reset-自动重置, detect_violation-违规检测'
  },
  actionLabel: {
    type: DataTypes.STRING(30),
    comment: '操作描述'
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
    type: DataTypes.STRING(20),
    comment: '操作人角色'
  },
  oldStatus: {
    type: DataTypes.TINYINT,
    comment: '原审核状态'
  },
  newStatus: {
    type: DataTypes.TINYINT,
    comment: '新审核状态'
  },
  businessType: {
    type: DataTypes.STRING(20),
    comment: '业务品类: flight-机票, hotel-酒店, tourism-文旅, car-租车'
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注/原因/修正说明'
  },
  detectInfo: {
    type: DataTypes.JSON,
    comment: '违规检测信息, 包含虚假资质/重复入驻/过期资质等检测结果',
    defaultValue: null
  },
  qualificationSnapshot: {
    type: DataTypes.JSON,
    comment: '资质材料快照，用于溯源',
    defaultValue: null
  },
  detail: {
    type: DataTypes.TEXT,
    comment: '详细审核内容'
  },
  riskLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '风险等级: 0-正常, 1-低风险, 2-中风险, 3-高风险'
  }
}, {
  tableName: 'merchant_audit_logs',
  comment: '商家审核日志表',
  timestamps: true,
  indexes: [
    { fields: ['merchantId'] },
    { fields: ['action'] },
    { fields: ['operatorId'] },
    { fields: ['businessType'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = MerchantAuditLog;

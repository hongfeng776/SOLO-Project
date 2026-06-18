const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const MerchantInfoChangeLog = sequelize.define('MerchantInfoChangeLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  merchantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商家ID'
  },
  changeType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '变更类型: 1-基础工商信息, 2-经营品类信息, 3-联系方式, 4-结算信息, 5-经营状态, 6-运营状态, 7-商家标签, 8-公示信息, 9-批量更新'
  },
  changeTypeName: {
    type: DataTypes.STRING(50),
    comment: '变更类型名称'
  },
  fieldName: {
    type: DataTypes.STRING(50),
    comment: '变更字段名'
  },
  fieldLabel: {
    type: DataTypes.STRING(50),
    comment: '变更字段显示名'
  },
  oldValue: {
    type: DataTypes.TEXT,
    comment: '变更前值'
  },
  newValue: {
    type: DataTypes.TEXT,
    comment: '变更后值'
  },
  changeContent: {
    type: DataTypes.JSON,
    comment: '完整变更内容(JSON格式)',
    defaultValue: {}
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
  changeReason: {
    type: DataTypes.STRING(500),
    comment: '变更原因'
  },
  changeRemark: {
    type: DataTypes.TEXT,
    comment: '变更备注'
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    comment: '操作IP地址'
  },
  userAgent: {
    type: DataTypes.STRING(500),
    comment: '操作UA'
  },
  riskLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '风险等级: 0-无风险, 1-低风险, 2-中风险, 3-高风险'
  },
  verifyStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '校验状态: 0-未通过, 1-已通过, 2-需复核'
  },
  verifyRemark: {
    type: DataTypes.TEXT,
    comment: '校验备注'
  },
  detectInfo: {
    type: DataTypes.JSON,
    comment: '违规检测信息',
    defaultValue: {}
  },
  batchNo: {
    type: DataTypes.STRING(32),
    comment: '批量操作批次号'
  },
  isReverted: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否已回退: 0-否, 1-是'
  },
  revertTime: {
    type: DataTypes.DATE,
    comment: '回退时间'
  },
  revertOperatorId: {
    type: DataTypes.INTEGER,
    comment: '回退操作人ID'
  },
  revertOperatorName: {
    type: DataTypes.STRING(50),
    comment: '回退操作人姓名'
  }
}, {
  tableName: 'merchant_info_change_logs',
  comment: '商家信息变更日志表',
  timestamps: true,
  indexes: [
    { fields: ['merchantId'] },
    { fields: ['changeType'] },
    { fields: ['operatorId'] },
    { fields: ['batchNo'] },
    { fields: ['createdAt'] }
  ]
});

module.exports = MerchantInfoChangeLog;

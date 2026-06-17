const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PricingChangeLog = sequelize.define('PricingChangeLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: true,
    comment: '订单号'
  },
  ruleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '规则ID'
  },
  ruleName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '规则名称'
  },
  changeType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '变更类型：create/update/delete/apply/cancel/recalculate/batch_adjust'
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
  operatorIP: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: '操作人IP'
  },
  oldValue: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '变更前值'
  },
  newValue: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '变更后值'
  },
  billingDetail: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '计费明细快照'
  },
  priceDiff: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '价格差异'
  },
  appliedRules: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '应用的规则ID列表，逗号分隔'
  },
  validationResult: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '校验结果JSON'
  },
  hasException: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常：0正常 1异常'
  },
  exceptionType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '异常类型：duplicate/over_threshold/invalid_rule/mismatch'
  },
  exceptionDetail: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '异常详情'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'biz_pricing_change_log',
  comment: '计费变更日志表',
  indexes: [
    { fields: ['orderId'] },
    { fields: ['orderNo'] },
    { fields: ['ruleId'] },
    { fields: ['changeType'] },
    { fields: ['operatorId'] },
    { fields: ['hasException'] },
    { fields: ['createTime'] }
  ]
})

module.exports = PricingChangeLog

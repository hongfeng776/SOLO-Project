const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const SettlementRule = sequelize.define('SettlementRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ruleName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '规则名称'
  },
  ruleType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '规则类型：1基础分成比例 2时段加价 3星级补贴 4节假日补贴 5溢价分成 6新人补贴 7优质司机专属'
  },
  applyScope: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '适用范围：1全部司机 2指定等级 3指定城市 4指定车型'
  },
  applyDriverLevels: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '适用司机等级数组'
  },
  applyCities: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '适用城市数组'
  },
  applyVehicleTypes: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '适用车型数组'
  },
  applyOrderTypes: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '适用订单类型数组：1即时单 2预约单 3拼车单'
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 80,
    comment: '司机分成比例(%)'
  },
  minCommissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 70,
    comment: '合规最低分成(%)'
  },
  maxCommissionRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 90,
    comment: '合规最高分成(%)'
  },
  subsidyAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '补贴金额'
  },
  subsidyPercent: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '补贴比例(%)'
  },
  timeStart: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '开始时段 HH:mm'
  },
  timeEnd: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '结束时段 HH:mm'
  },
  isHoliday: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否节假日适用'
  },
  isWeekend: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否周末适用'
  },
  minServiceRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 0,
    comment: '最低服务星级'
  },
  isExclusive: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否互斥规则：1互斥(不可叠加) 0可叠加'
  },
  exclusiveRuleIds: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '互斥的规则ID数组'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '优先级，数值高先应用'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：0禁用 1启用'
  },
  effectiveStart: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '生效开始时间'
  },
  effectiveEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '生效结束时间'
  },
  isDefault: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否默认规则'
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '规则描述'
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '创建人ID'
  },
  creatorName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '创建人'
  },
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  updateTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  }
}, {
  tableName: 'biz_settlement_rule',
  comment: '结算规则表',
  indexes: [
    { fields: ['ruleType'] },
    { fields: ['applyScope'] },
    { fields: ['status'] },
    { fields: ['isExclusive'] },
    { fields: ['priority'] }
  ]
})

module.exports = SettlementRule

const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PricingRule = sequelize.define('PricingRule', {
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
    comment: '规则类型：1基础计费 2时段溢价 3天气溢价 4节假日溢价 5城市标准'
  },
  capacityType: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '适用车型：1快车 2专车 3豪华车 4拼车 5出租车，null表示全部车型'
  },
  cityCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '城市编码，null表示全部城市'
  },
  cityName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '城市名称'
  },
  timePeriod: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '适用时段：daytime/nighttime/peak/null(全天)'
  },
  startTime: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '开始时间 HH:mm'
  },
  endTime: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '结束时间 HH:mm'
  },
  weatherCondition: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '天气条件：normal/rain/snow/fog/hot/null(任意)'
  },
  holidayType: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '节假日类型：workday/weekend/holiday/null(任意)'
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '起步价'
  },
  perKmPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '每公里单价'
  },
  perMinPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '每分钟单价'
  },
  minCharge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '最低消费'
  },
  surgeRatio: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 1,
    comment: '溢价倍数，如1.2表示溢价20%'
  },
  maxSurgeAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '最高溢价金额，0表示不限制'
  },
  maxTotalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '最高总价限制，0表示不限制'
  },
  isMutuallyExclusive: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否互斥：1互斥不可叠加 0可叠加'
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '优先级，数字越大越优先'
  },
  effectiveDateStart: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '生效开始日期'
  },
  effectiveDateEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '生效结束日期'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1启用 0禁用'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '规则描述'
  }
}, {
  tableName: 'biz_pricing_rule',
  comment: '计费规则表',
  indexes: [
    { fields: ['ruleType'] },
    { fields: ['capacityType'] },
    { fields: ['cityCode'] },
    { fields: ['status'] },
    { fields: ['timePeriod'] },
    { fields: ['ruleType', 'capacityType', 'cityCode', 'status'] }
  ]
})

module.exports = PricingRule

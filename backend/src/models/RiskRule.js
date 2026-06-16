const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const RiskRule = sequelize.define('RiskRule', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '规则名称'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '规则编码'
  },
  type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '规则类型：1订单风控 2司机风控 3乘客风控 4车辆风控'
  },
  category: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '风险类别：1刷单 2逃单 3危险驾驶 4虚假信息 5异常价格'
  },
  condition: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '触发条件'
  },
  threshold: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '触发阈值'
  },
  action: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '处置动作：1警告 2拦截 3封禁 4人工审核'
  },
  severity: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '严重等级：1低 2中 3高'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1启用 0禁用'
  },
  hitCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '命中次数'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '描述'
  }
}, {
  tableName: 'biz_risk_rule',
  comment: '风控规则表',
  indexes: [
    { fields: ['code'] },
    { fields: ['type'] },
    { fields: ['status'] },
    { fields: ['category'] }
  ]
})

module.exports = RiskRule

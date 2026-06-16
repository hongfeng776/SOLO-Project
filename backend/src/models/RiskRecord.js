const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const RiskRecord = sequelize.define('RiskRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ruleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '规则ID'
  },
  ruleName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '规则名称'
  },
  ruleCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '规则编码'
  },
  targetType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '对象类型：1订单 2司机 3乘客 4车辆'
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '对象ID'
  },
  targetName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '对象名称'
  },
  riskType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '风险类别'
  },
  severity: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '严重等级：1低 2中 3高'
  },
  action: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '处置动作'
  },
  detail: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '风险详情'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '处理状态：0待处理 1已处理 2已忽略'
  },
  handlerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '处理人ID'
  },
  handlerName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '处理人姓名'
  },
  handleResult: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '处理结果'
  },
  handleTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处理时间'
  }
}, {
  tableName: 'biz_risk_record',
  comment: '风控记录表',
  indexes: [
    { fields: ['ruleId'] },
    { fields: ['targetType'] },
    { fields: ['targetId'] },
    { fields: ['status'] },
    { fields: ['severity'] },
    { fields: ['createTime'] }
  ]
})

module.exports = RiskRecord

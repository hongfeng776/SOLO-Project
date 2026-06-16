const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const CapacityType = sequelize.define('CapacityType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '类型名称'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '类型编码'
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '起步价'
  },
  perKmPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '每公里价格'
  },
  perMinPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '每分钟价格'
  },
  minCharge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '最低消费'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '描述'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1启用 0禁用'
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  }
}, {
  tableName: 'biz_capacity_type',
  comment: '运力类型表'
})

module.exports = CapacityType

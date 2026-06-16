const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const FinanceSettlement = sequelize.define('FinanceSettlement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  settlementNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '结算单号'
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '司机ID'
  },
  driverName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '司机姓名'
  },
  driverPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '司机电话'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '结算总金额'
  },
  orderCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '订单数量'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态：0待结算 1已结算 2结算失败'
  },
  periodStart: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '结算周期开始'
  },
  periodEnd: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '结算周期结束'
  },
  settleTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '结算时间'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'finance_settlement',
  comment: '结算单表',
  indexes: [
    { fields: ['settlementNo'] },
    { fields: ['driverId'] },
    { fields: ['status'] }
  ]
})

module.exports = FinanceSettlement

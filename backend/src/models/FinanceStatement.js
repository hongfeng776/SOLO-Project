const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const FinanceStatement = sequelize.define('FinanceStatement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  statementNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '流水号'
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: true,
    comment: '关联订单号'
  },
  type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '类型：1收入 2支出 3退款 4提现'
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '金额'
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '变动后余额'
  },
  relatedId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联ID'
  },
  relatedType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '关联类型'
  },
  accountType: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '账户类型：1司机 2乘客 3平台'
  },
  accountId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '账户ID'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'finance_statement',
  comment: '财务流水表',
  indexes: [
    { fields: ['statementNo'] },
    { fields: ['orderNo'] },
    { fields: ['type'] },
    { fields: ['accountId', 'accountType'] },
    { fields: ['createTime'] }
  ]
})

module.exports = FinanceStatement

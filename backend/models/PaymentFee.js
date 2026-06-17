const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')
const Order = require('./Order')
const PaymentFlow = require('./PaymentFlow')

const PaymentFee = sequelize.define('PaymentFee', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '手续费明细ID'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    },
    comment: '订单ID'
  },
  flowId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: PaymentFlow,
      key: 'id'
    },
    comment: '支付流水ID'
  },
  feeType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '手续费类型: channel(渠道手续费), service(服务费), installment(分期手续费), withdraw(提现手续费)'
  },
  feeName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '手续费名称'
  },
  feeBase: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '计费基数'
  },
  feeRate: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0,
    comment: '费率'
  },
  fixedFee: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '固定手续费'
  },
  feeAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '手续费金额 = 基数*费率 + 固定费'
  },
  payer: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '承担方: user(用户), merchant(商家), platform(平台)'
  }
}, {
  tableName: 'payment_fees',
  comment: '手续费明细表',
  timestamps: true,
  updatedAt: false
})

PaymentFee.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
Order.hasMany(PaymentFee, { foreignKey: 'orderId', as: 'paymentFees' })

PaymentFee.belongsTo(PaymentFlow, { foreignKey: 'flowId', as: 'flow' })
PaymentFlow.hasMany(PaymentFee, { foreignKey: 'flowId', as: 'fees' })

module.exports = PaymentFee

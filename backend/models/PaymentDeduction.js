const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')
const Order = require('./Order')
const PaymentFlow = require('./PaymentFlow')

const PaymentDeduction = sequelize.define('PaymentDeduction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '抵扣记录ID'
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
  deductionType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '抵扣类型: coupon(优惠券), points(积分), member_discount(会员折扣), activity(活动优惠), voucher(代金券)'
  },
  deductionSource: {
    type: DataTypes.STRING(50),
    comment: '抵扣来源(券码/积分ID等)'
  },
  deductionName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '抵扣名称'
  },
  deductionAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '抵扣金额'
  },
  deductionRate: {
    type: DataTypes.DECIMAL(5, 4),
    comment: '抵扣比例(如0.9表示9折)'
  },
  applicableAmount: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '抵扣适用金额(满减门槛)'
  },
  ruleSnapshot: {
    type: DataTypes.TEXT,
    comment: '抵扣规则快照JSON'
  }
}, {
  tableName: 'payment_deductions',
  comment: '抵扣记录表',
  timestamps: true,
  updatedAt: false
})

PaymentDeduction.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
Order.hasMany(PaymentDeduction, { foreignKey: 'orderId', as: 'paymentDeductions' })

PaymentDeduction.belongsTo(PaymentFlow, { foreignKey: 'flowId', as: 'flow' })
PaymentFlow.hasMany(PaymentDeduction, { foreignKey: 'flowId', as: 'deductions' })

module.exports = PaymentDeduction

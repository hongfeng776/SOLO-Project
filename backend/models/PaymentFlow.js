const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')
const Order = require('./Order')

const PaymentFlow = sequelize.define('PaymentFlow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '流水ID'
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
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '订单编号'
  },
  flowNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '流水编号(FLW+时间戳+随机)'
  },
  payType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '支付类型: instant, installment, difference'
  },
  channel: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '支付渠道'
  },
  transactionId: {
    type: DataTypes.STRING(64),
    comment: '第三方交易号'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '订单总金额'
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '优惠抵扣金额'
  },
  couponId: {
    type: DataTypes.INTEGER,
    comment: '优惠券ID'
  },
  couponAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '优惠券抵扣'
  },
  pointsAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '积分抵扣'
  },
  feeAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '手续费金额'
  },
  feeRate: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0,
    comment: '手续费费率'
  },
  actualAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '实际支付金额 = 总金额-优惠-抵扣+手续费'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '流水状态: 0-待支付, 1-支付成功, 2-支付失败, 3-已退款'
  },
  failCode: {
    type: DataTypes.STRING(50),
    comment: '失败错误码: insufficient_balance(余额不足), channel_error(渠道异常), timeout(超时未支付)'
  },
  failReason: {
    type: DataTypes.STRING(255),
    comment: '失败原因描述'
  },
  isRepeated: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否重复支付: 0-否, 1-是(自动标记)'
  },
  isFake: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否虚假流水: 0-否, 1-是(校验发现)'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常: 0-否, 1-是(风控标记)'
  },
  abnormalReasons: {
    type: DataTypes.TEXT,
    comment: '异常原因JSON数组'
  },
  paidAt: {
    type: DataTypes.DATE,
    comment: '支付完成时间'
  },
  expiredAt: {
    type: DataTypes.DATE,
    comment: '流水过期时间'
  }
}, {
  tableName: 'payment_flows',
  comment: '支付流水表',
  timestamps: true,
  paranoid: true
})

PaymentFlow.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
Order.hasMany(PaymentFlow, { foreignKey: 'orderId', as: 'paymentFlows' })

module.exports = PaymentFlow

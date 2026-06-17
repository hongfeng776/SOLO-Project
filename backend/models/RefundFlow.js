const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')
const AfterSale = require('./AfterSale')
const Order = require('./Order')

const RefundFlow = sequelize.define('RefundFlow', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '退款流水ID'
  },
  afterSaleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: AfterSale,
      key: 'id'
    },
    comment: '售后申请ID'
  },
  afterSaleNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '售后单号'
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
  refundNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '退款流水号(RF+时间戳+随机)'
  },
  refundChannel: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '退款渠道: wechat, alipay, unionpay, credit_card, balance'
  },
  transactionId: {
    type: DataTypes.STRING(64),
    comment: '第三方退款单号'
  },
  orderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '订单原始金额'
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '实际支付金额'
  },
  penaltyAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '违约金扣除金额'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '实际退款金额'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态: 0-处理中, 1-成功, 2-失败, 3-已撤销'
  },
  failCode: {
    type: DataTypes.STRING(50),
    comment: '失败错误码'
  },
  failReason: {
    type: DataTypes.STRING(255),
    comment: '失败原因描述'
  },
  refundTime: {
    type: DataTypes.DATE,
    comment: '退款完成时间'
  },
  isRepeated: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否重复退款: 0-否, 1-是'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常: 0-否, 1-是'
  },
  abnormalReasons: {
    type: DataTypes.TEXT,
    comment: '异常原因JSON数组'
  }
}, {
  tableName: 'refund_flows',
  comment: '退款流水表',
  timestamps: true,
  paranoid: true
})

RefundFlow.belongsTo(AfterSale, { foreignKey: 'afterSaleId', as: 'afterSale' })
AfterSale.hasMany(RefundFlow, { foreignKey: 'afterSaleId', as: 'refundFlows' })

RefundFlow.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
Order.hasMany(RefundFlow, { foreignKey: 'orderId', as: 'refundFlows' })

module.exports = RefundFlow

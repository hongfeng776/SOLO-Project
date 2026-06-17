const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/db')
const Order = require('./Order')
const User = require('./User')

const AfterSale = sequelize.define('AfterSale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '售后申请ID'
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
  afterSaleNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '售后单号(AS+时间戳+随机)'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    comment: '用户ID'
  },
  type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '履约状态: not_fulfilled-未履约, partial_fulfilled-部分履约, full_fulfilled-完全履约'
  },
  refundType: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: '退款类型: full-全额, partial-部分'
  },
  applyAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '申请退款金额'
  },
  applyReason: {
    type: DataTypes.STRING(500),
    allowNull: false,
    comment: '申请退款原因'
  },
  applyImages: {
    type: DataTypes.TEXT,
    comment: '申请凭证图片JSON数组'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态: 0-待审核, 1-审核通过, 2-审核驳回, 3-退款中, 4-已退款, 5-已关闭, 6-暂缓处理'
  },
  rejectReason: {
    type: DataTypes.STRING(500),
    comment: '驳回原因'
  },
  rejectTime: {
    type: DataTypes.DATE,
    comment: '驳回时间'
  },
  rejectOperatorId: {
    type: DataTypes.INTEGER,
    comment: '驳回操作人ID'
  },
  approveTime: {
    type: DataTypes.DATE,
    comment: '审核通过时间'
  },
  approveOperatorId: {
    type: DataTypes.INTEGER,
    comment: '审核通过操作人ID'
  },
  penaltyAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '违约金金额'
  },
  finalRefundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '最终退款金额'
  },
  isLargeAmount: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否大额退款(>=5000): 0-否, 1-是'
  },
  isFrozen: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '资金是否冻结: 0-否, 1-是'
  },
  remark: {
    type: DataTypes.STRING(500),
    comment: '备注'
  }
}, {
  tableName: 'after_sales',
  comment: '售后申请表',
  timestamps: true,
  paranoid: true
})

AfterSale.belongsTo(Order, { foreignKey: 'orderId', as: 'order' })
Order.hasMany(AfterSale, { foreignKey: 'orderId', as: 'afterSales' })

AfterSale.belongsTo(User, { foreignKey: 'userId', as: 'user' })
User.hasMany(AfterSale, { foreignKey: 'userId', as: 'afterSales' })

module.exports = AfterSale

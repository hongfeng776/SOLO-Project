const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Merchant = require('./Merchant');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '订单编号'
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
  category: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '订单分类: flight-机票, hotel-酒店, car-租车, ticket-票务, business_travel-商旅定制'
  },
  productId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '商品ID'
  },
  productName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '商品名称'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '订单金额'
  },
  contactName: {
    type: DataTypes.STRING(50),
    comment: '联系人姓名'
  },
  contactPhone: {
    type: DataTypes.STRING(20),
    comment: '联系电话'
  },
  quantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '数量'
  },
  unitPrice: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '单价'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态: 0-待支付, 1-已支付, 2-已取消, 3-已完成, 4-已入住/已取车/已使用, 5-退款中, 6-已退款'
  },
  payTime: {
    type: DataTypes.DATE,
    comment: '支付时间'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '退款金额'
  },
  refundTime: {
    type: DataTypes.DATE,
    comment: '退款时间'
  },
  refundReason: {
    type: DataTypes.STRING(500),
    comment: '退款原因'
  },
  merchantId: {
    type: DataTypes.INTEGER,
    references: {
      model: Merchant,
      key: 'id'
    },
    comment: '商家ID'
  },
  remark: {
    type: DataTypes.STRING(500),
    comment: '备注'
  },
  source: {
    type: DataTypes.STRING(20),
    comment: '订单来源渠道: app, wechat, web, offline, third_party'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常: 0-正常, 1-异常, 2-作废'
  },
  abnormalReason: {
    type: DataTypes.STRING(500),
    comment: '异常原因'
  },
  isLocked: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否已锁定: 0-未锁定, 1-已锁定'
  },
  lockReason: {
    type: DataTypes.STRING(500),
    comment: '锁定原因'
  },
  lockTime: {
    type: DataTypes.DATE,
    comment: '锁定时间'
  },
  archiveStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '归档状态: 0-未归档, 1-已归档'
  },
  archiveTime: {
    type: DataTypes.DATE,
    comment: '归档时间'
  }
}, {
  tableName: 'orders',
  comment: '订单表',
  timestamps: true,
  paranoid: true
});

Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

Order.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Merchant.hasMany(Order, { foreignKey: 'merchantId', as: 'orders' });

module.exports = Order;

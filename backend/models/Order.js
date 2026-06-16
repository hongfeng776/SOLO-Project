const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

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
    comment: '订单分类: flight-机票, hotel-酒店, car-租车, ticket-票务'
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
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态: 0-待支付, 1-已支付, 2-已取消, 3-已完成'
  },
  payTime: {
    type: DataTypes.DATE,
    comment: '支付时间'
  },
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'orders',
  comment: '订单表',
  timestamps: false
});

Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

module.exports = Order;

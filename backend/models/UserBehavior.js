const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const UserBehavior = sequelize.define('UserBehavior', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '行为记录ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    comment: '用户名'
  },
  behaviorType: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '行为大类: browse-浏览行为, order-下单行为, aftersale-售后行为, marketing-营销参与行为'
  },
  behaviorKey: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '行为小类标识: 如 product_view, order_create, refund_apply, coupon_receive 等'
  },
  behaviorName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '行为名称'
  },
  scene: {
    type: DataTypes.STRING(30),
    comment: '操作场景: app, h5, web, mini_program'
  },
  targetType: {
    type: DataTypes.STRING(30),
    comment: '操作对象类型: order, product, coupon, flight, hotel, car, ticket'
  },
  targetId: {
    type: DataTypes.STRING(50),
    comment: '操作对象ID'
  },
  targetName: {
    type: DataTypes.STRING(200),
    comment: '操作对象摘要'
  },
  content: {
    type: DataTypes.TEXT,
    comment: '行为内容(JSON)'
  },
  amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '涉及金额'
  },
  ip: {
    type: DataTypes.STRING(50),
    comment: 'IP地址'
  },
  deviceId: {
    type: DataTypes.STRING(100),
    comment: '设备标识'
  },
  userAgent: {
    type: DataTypes.STRING(500),
    comment: 'UA信息'
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '行为持续时间(秒)'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常行为: 0-正常, 1-异常'
  },
  abnormalType: {
    type: DataTypes.STRING(30),
    comment: '异常类型: fake-虚假行为, duplicate-重复操作, fraud-刷单, abuse-恶意售后, wool-薅权益'
  },
  abnormalLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '异常等级: 0-正常, 1-轻度, 2-中度, 3-重度'
  },
  abnormalScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '异常评分(0-100)'
  },
  abnormalRemark: {
    type: DataTypes.STRING(500),
    comment: '异常说明'
  },
  sessionId: {
    type: DataTypes.STRING(100),
    comment: '会话ID'
  },
  referId: {
    type: DataTypes.STRING(100),
    comment: '关联行为ID(如退款对应订单行为)'
  },
  geoLocation: {
    type: DataTypes.STRING(200),
    comment: '地理位置信息'
  }
}, {
  tableName: 'user_behaviors',
  comment: '用户行为记录表',
  indexes: [
    { fields: ['userId'] },
    { fields: ['behaviorType'] },
    { fields: ['behaviorKey'] },
    { fields: ['createdAt'] },
    { fields: ['isAbnormal'] },
    { fields: ['ip'] },
    { fields: ['sessionId'] }
  ]
});

UserBehavior.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(UserBehavior, { foreignKey: 'userId', as: 'behaviors' });

module.exports = UserBehavior;

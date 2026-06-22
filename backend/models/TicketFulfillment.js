const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Order = require('./Order');
const ScenicSpot = require('./ScenicSpot');
const TicketType = require('./TicketType');
const TicketInventory = require('./TicketInventory');

const TicketFulfillment = sequelize.define('TicketFulfillment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '核销记录ID'
  },
  orderId: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '关联订单号'
  },
  orderItemId: {
    type: DataTypes.STRING(64),
    comment: '订单子项ID（多票种拆分时）'
  },
  ticketCode: {
    type: DataTypes.STRING(128),
    allowNull: false,
    comment: '票务二维码/凭证编码'
  },
  ticketHash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '票务凭证哈希值（用于验真）'
  },
  scenicSpotId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '所属景点ID'
  },
  ticketTypeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联票种ID'
  },
  inventoryId: {
    type: DataTypes.INTEGER,
    comment: '关联分时库存ID'
  },
  userId: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '用户ID'
  },
  userName: {
    type: DataTypes.STRING(50),
    comment: '用户姓名'
  },
  userPhone: {
    type: DataTypes.STRING(20),
    comment: '用户手机号'
  },
  userIdCard: {
    type: DataTypes.STRING(32),
    comment: '身份证号后6位（用于核销校验）'
  },
  ticketCategory: {
    type: DataTypes.STRING(20),
    comment: '票种品类快照'
  },
  ticketCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '票张数量'
  },
  actualPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '实际成交总价'
  },
  sessionDate: {
    type: DataTypes.DATEONLY,
    comment: '场次日期'
  },
  sessionStartTime: {
    type: DataTypes.TIME,
    comment: '场次开始时间'
  },
  sessionEndTime: {
    type: DataTypes.TIME,
    comment: '场次结束时间'
  },
  validFrom: {
    type: DataTypes.DATE,
    comment: '有效期开始时间'
  },
  validTo: {
    type: DataTypes.DATE,
    comment: '有效期结束时间'
  },
  fulfillStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    comment: '履约状态: pending-待核销, verified-已核销, expired-过期作废, refund-退票失效, abnormal-异常'
  },
  verifyResult: {
    type: DataTypes.STRING(20),
    comment: '核销校验结果: pass-通过, repeat-重复核销, expired-已过期, user_mismatch-用户信息不符, time_mismatch-时段不符, fake-虚假凭证'
  },
  verifiedAt: {
    type: DataTypes.DATE,
    comment: '核销时间'
  },
  verifiedBy: {
    type: DataTypes.INTEGER,
    comment: '核销操作员ID'
  },
  verifiedByName: {
    type: DataTypes.STRING(50),
    comment: '核销操作员姓名'
  },
  verifyDevice: {
    type: DataTypes.STRING(50),
    comment: '核销设备标识（闸机/手持机编号）'
  },
  verifyLocation: {
    type: DataTypes.JSON,
    comment: '核销时位置信息: {lng, lat, locationName}'
  },
  verifyGateway: {
    type: DataTypes.STRING(50),
    comment: '入园闸口/通道编号'
  },
  firstVerifyAt: {
    type: DataTypes.DATE,
    comment: '首次核销时间（用于判断重复）'
  },
  verifyCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '核销尝试次数'
  },
  entryCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '实际入园次数'
  },
  refundAt: {
    type: DataTypes.DATE,
    comment: '退票时间'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '退款金额'
  },
  refundReason: {
    type: DataTypes.STRING(255),
    comment: '退票原因'
  },
  expiredAt: {
    type: DataTypes.DATE,
    comment: '过期作废时间'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常记录（用于异常标记）'
  },
  abnormalType: {
    type: DataTypes.STRING(30),
    comment: '异常类型: repeat-重复核销, fake-虚假票, time-时段异常, location-地点异常, other-其他'
  },
  abnormalReason: {
    type: DataTypes.STRING(500),
    comment: '异常原因/拦截说明'
  },
  abnormalHandled: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '异常是否已处理'
  },
  abnormalHandledAt: {
    type: DataTypes.DATE,
    comment: '异常处理时间'
  },
  abnormalHandledBy: {
    type: DataTypes.INTEGER,
    comment: '异常处理人ID'
  },
  fakeIndicator: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '虚假核销标记（伪造二维码等）'
  },
  dataConsistency: {
    type: DataTypes.STRING(20),
    defaultValue: 'consistent',
    comment: '数据一致性: consistent-一致, inconsistent-不一致, repaired-已修正'
  },
  verifyMessage: {
    type: DataTypes.STRING(500),
    comment: '核销说明（失败原因等）'
  },
  remark: {
    type: DataTypes.STRING(500),
    comment: '备注'
  },
  merchantId: {
    type: DataTypes.INTEGER,
    comment: '商家ID'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'ticket_fulfillment',
  comment: '票务核销履约记录表',
  indexes: [
    { fields: ['orderId'] },
    { fields: ['ticketCode'], unique: true },
    { fields: ['ticketHash'], unique: true },
    { fields: ['scenicSpotId', 'sessionDate'] },
    { fields: ['userId'] },
    { fields: ['fulfillStatus'] },
    { fields: ['verifiedAt'] },
    { fields: ['sessionDate'] },
    { fields: ['isAbnormal'] }
  ]
});

TicketFulfillment.belongsTo(Order, { foreignKey: 'orderId', targetKey: 'orderSn', as: 'order' });
TicketFulfillment.belongsTo(ScenicSpot, { foreignKey: 'scenicSpotId', as: 'scenicSpot' });
TicketFulfillment.belongsTo(TicketType, { foreignKey: 'ticketTypeId', as: 'ticketType' });
TicketFulfillment.belongsTo(TicketInventory, { foreignKey: 'inventoryId', as: 'inventory' });

module.exports = TicketFulfillment;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Hotel = require('./Hotel');
const HotelRoom = require('./HotelRoom');

const HotelFulfillment = sequelize.define('HotelFulfillment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '履约ID'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联订单ID'
  },
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Hotel, key: 'id' },
    comment: '酒店门店ID'
  },
  roomId: {
    type: DataTypes.INTEGER,
    references: { model: HotelRoom, key: 'id' },
    comment: '客房房型ID'
  },
  fulfillmentType: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'pending',
    comment: '履约分支: pending待入住, normal正常入住, delayed延迟入住, cancelled取消入住'
  },
  guestName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '入住人姓名'
  },
  guestIdCard: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '入住人身份证号'
  },
  guestPhone: {
    type: DataTypes.STRING(20),
    comment: '入住人手机号'
  },
  guestCount: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '入住人数'
  },
  checkInDate: {
    type: DataTypes.DATEONLY,
    comment: '计划入住日期'
  },
  checkOutDate: {
    type: DataTypes.DATEONLY,
    comment: '计划退房日期'
  },
  actualCheckInTime: {
    type: DataTypes.DATE,
    comment: '实际入住时间'
  },
  actualCheckOutTime: {
    type: DataTypes.DATE,
    comment: '实际退房时间'
  },
  nights: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '入住晚数'
  },
  actualNights: {
    type: DataTypes.TINYINT,
    comment: '实际入住晚数'
  },
  roomNo: {
    type: DataTypes.STRING(30),
    comment: '分配房号'
  },
  roomTypeName: {
    type: DataTypes.STRING(100),
    comment: '房型名称'
  },
  roomPrice: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '房间单价'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '订单总金额'
  },
  paidAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '已付金额'
  },
  settlementAmount: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '结算金额'
  },
  extraCharge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '额外费用（延迟/加床等）'
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '退款金额'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending_checkin',
    comment: '履约状态: pending_checkin待入住, checked_in已入住, checked_out已退房, delayed延迟入住, early_checkout提前退房, no_show未到, cancelled已取消'
  },
  verifyStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'unverified',
    comment: '核验状态: unverified未核验, verified已核验, rejected核验不通过, fake虚假入住'
  },
  verifyTime: {
    type: DataTypes.DATE,
    comment: '核验时间'
  },
  verifyOperator: {
    type: DataTypes.STRING(50),
    comment: '核验操作人'
  },
  verifyRemark: {
    type: DataTypes.STRING(500),
    comment: '核验备注'
  },
  idCardValid: {
    type: DataTypes.BOOLEAN,
    defaultValue: null,
    comment: '身份证核验结果'
  },
  timelinessValid: {
    type: DataTypes.BOOLEAN,
    defaultValue: null,
    comment: '入住时效核验结果'
  },
  roomMatchValid: {
    type: DataTypes.BOOLEAN,
    defaultValue: null,
    comment: '房型匹配核验结果'
  },
  orderStatusValid: {
    type: DataTypes.BOOLEAN,
    defaultValue: null,
    comment: '订单状态核验结果'
  },
  isFakeCheckIn: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否虚假入住'
  },
  isDuplicateVerify: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否重复核验'
  },
  isIllegalCheckout: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否违规退房'
  },
  isSuite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否高端套房订单'
  },
  checkInVoucher: {
    type: DataTypes.STRING(500),
    comment: '入住凭证URL'
  },
  voucherGenerated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已生成入住凭证'
  },
  roomOccupancySynced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已同步客房占用状态'
  },
  ledgerSynced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已同步门店履约台账'
  },
  ledgerSyncTime: {
    type: DataTypes.DATE,
    comment: '台账同步时间'
  },
  orderProgressSynced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已同步订单履约进度'
  },
  delayReason: {
    type: DataTypes.STRING(500),
    comment: '延迟入住原因'
  },
  cancelReason: {
    type: DataTypes.STRING(500),
    comment: '取消原因'
  },
  earlyCheckoutReason: {
    type: DataTypes.STRING(500),
    comment: '提前退房原因'
  },
  warningFlags: {
    type: DataTypes.TEXT,
    comment: '警告标记JSON'
  },
  createdBy: {
    type: DataTypes.STRING(50),
    comment: '创建人'
  },
  updatedBy: {
    type: DataTypes.STRING(50),
    comment: '更新人'
  }
}, {
  tableName: 'hotel_fulfillments',
  comment: '酒店入住履约表',
  timestamps: true,
  indexes: [
    { fields: ['orderId'] },
    { fields: ['hotelId', 'roomId'] },
    { fields: ['fulfillmentType', 'status'] },
    { fields: ['guestIdCard'] }
  ]
});

HotelFulfillment.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
HotelFulfillment.belongsTo(HotelRoom, { foreignKey: 'roomId', as: 'room' });

module.exports = HotelFulfillment;

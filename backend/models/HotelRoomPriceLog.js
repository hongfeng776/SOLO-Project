const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const HotelRoomPrice = require('./HotelRoomPrice');
const HotelRoom = require('./HotelRoom');
const Hotel = require('./Hotel');

const HotelRoomPriceLog = sequelize.define('HotelRoomPriceLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  priceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: HotelRoomPrice, key: 'id' },
    comment: '价格套餐ID'
  },
  hotelId: {
    type: DataTypes.INTEGER,
    comment: '酒店门店ID'
  },
  roomId: {
    type: DataTypes.INTEGER,
    comment: '房型ID'
  },
  operationType: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '操作类型: create创建, update修改, on_shelf上架, off_shelf下架, adjust_price调价, change_status状态变更, batch_adjust批量调价, exclusive_lock专属锁定, fake_flag虚假标记, over_discount超优惠标记'
  },
  oldValue: {
    type: DataTypes.TEXT,
    comment: '变更前值JSON'
  },
  newValue: {
    type: DataTypes.TEXT,
    comment: '变更后值JSON'
  },
  changeFields: {
    type: DataTypes.STRING(500),
    comment: '变更字段'
  },
  operationReason: {
    type: DataTypes.STRING(500),
    comment: '操作原因'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作人姓名'
  },
  operatorRole: {
    type: DataTypes.STRING(30),
    comment: '操作人角色'
  },
  operationIp: {
    type: DataTypes.STRING(50),
    comment: '操作IP'
  },
  isBatch: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否批量操作'
  },
  batchId: {
    type: DataTypes.STRING(50),
    comment: '批量操作批次号'
  },
  verifyResult: {
    type: DataTypes.STRING(20),
    comment: '校验结果'
  },
  verifyMessages: {
    type: DataTypes.TEXT,
    comment: '校验详情'
  },
  priceChanged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否涉及价格变更'
  },
  oldPriceValue: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '旧价格值'
  },
  newPriceValue: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '新价格值'
  },
  orderSyncCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '同步更新未支付订单数'
  },
  purchaseCountSnapshot: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '购买量快照'
  }
}, {
  tableName: 'hotel_room_price_logs',
  comment: '房价套餐操作日志表',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['priceId'] },
    { fields: ['hotelId', 'roomId'] },
    { fields: ['operationType'] }
  ]
});

HotelRoomPriceLog.belongsTo(HotelRoomPrice, { foreignKey: 'priceId', as: 'price' });
HotelRoomPriceLog.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
HotelRoomPriceLog.belongsTo(HotelRoom, { foreignKey: 'roomId', as: 'room' });
HotelRoomPrice.hasMany(HotelRoomPriceLog, { foreignKey: 'priceId', as: 'logs' });

module.exports = HotelRoomPriceLog;

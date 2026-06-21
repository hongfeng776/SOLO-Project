const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const HotelFulfillment = require('./HotelFulfillment');

const HotelFulfillmentLog = sequelize.define('HotelFulfillmentLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  fulfillmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: HotelFulfillment, key: 'id' },
    comment: '履约ID'
  },
  orderId: {
    type: DataTypes.INTEGER,
    comment: '订单ID'
  },
  hotelId: {
    type: DataTypes.INTEGER,
    comment: '酒店门店ID'
  },
  operationType: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '操作类型: verify核验, checkin入住, checkout退房, delay延迟入住, early_checkout提前退房, extend续住, cancel取消, no_show未到, batch_verify批量核验, batch_noshow批量标记未到, batch_delay批量延迟, fake_flag虚假标记, duplicate_flag重复标记, illegal_checkout违规退房'
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
    comment: '核验结果'
  },
  verifyMessages: {
    type: DataTypes.TEXT,
    comment: '核验详情'
  },
  roomOccupancyUpdated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否更新客房占用'
  },
  orderProgressUpdated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否更新订单进度'
  },
  voucherUpdated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否更新入住凭证'
  },
  ledgerUpdated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否更新门店台账'
  },
  settlementChanged: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否涉及结算变更'
  }
}, {
  tableName: 'hotel_fulfillment_logs',
  comment: '酒店履约操作日志表',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['fulfillmentId'] },
    { fields: ['orderId'] },
    { fields: ['operationType'] }
  ]
});

HotelFulfillmentLog.belongsTo(HotelFulfillment, { foreignKey: 'fulfillmentId', as: 'fulfillment' });
HotelFulfillment.hasMany(HotelFulfillmentLog, { foreignKey: 'fulfillmentId', as: 'logs' });

module.exports = HotelFulfillmentLog;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const HotelRoom = require('./HotelRoom');
const Hotel = require('./Hotel');

const HotelRoomLog = sequelize.define('HotelRoomLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: HotelRoom,
      key: 'id'
    },
    comment: '客房ID'
  },
  hotelId: {
    type: DataTypes.INTEGER,
    comment: '酒店门店ID'
  },
  operationType: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '操作类型: create-创建, update-修改, on_shelf-上架, off_shelf-下架, maintenance-维护中, resume-恢复, sold_out-满房, restock-恢复库存, batch_update-批量更新, facility_change-设施变更, price_adjust-价格调整, fake_flag-虚假标记, duplicate_flag-重复标记'
  },
  oldValue: {
    type: DataTypes.TEXT,
    comment: '变更前值'
  },
  newValue: {
    type: DataTypes.TEXT,
    comment: '变更后值'
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
    comment: '是否批量'
  },
  batchId: {
    type: DataTypes.STRING(50),
    comment: '批次号'
  },
  verifyResult: {
    type: DataTypes.STRING(20),
    comment: '校验结果'
  },
  verifyMessages: {
    type: DataTypes.TEXT,
    comment: '校验消息'
  },
  bookingLocked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否锁定预订权限'
  },
  ledgerSynced: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已同步台账'
  }
}, {
  tableName: 'hotel_room_logs',
  comment: '酒店客房操作日志表',
  timestamps: true,
  updatedAt: false,
  indexes: [
    { fields: ['roomId'] },
    { fields: ['hotelId'] },
    { fields: ['operationType'] }
  ]
});

HotelRoomLog.belongsTo(HotelRoom, { foreignKey: 'roomId', as: 'room' });
HotelRoomLog.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
HotelRoom.hasMany(HotelRoomLog, { foreignKey: 'roomId', as: 'logs' });

module.exports = HotelRoomLog;

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Hotel = require('./Hotel');

const HotelLog = sequelize.define('HotelLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Hotel,
      key: 'id'
    },
    comment: '酒店ID'
  },
  operationType: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '操作类型: create-入驻录入, update-信息变更, on_shelf-上架, off_shelf-下架, suspend-停业, rectification-整改, resume_operation-恢复营业, weight_adjust-权重调整, batch_update-批量更新, qualification_audit-资质审核, fake_flag-虚假标记, duplicate_flag-重复标记'
  },
  operationModule: {
    type: DataTypes.STRING(50),
    comment: '操作模块: basic_info-基础信息, qualification-资质信息, status-经营状态, weight-展示权重, room_resource-客房资源'
  },
  oldValue: {
    type: DataTypes.TEXT,
    comment: '变更前值 JSON'
  },
  newValue: {
    type: DataTypes.TEXT,
    comment: '变更后值 JSON'
  },
  changeFields: {
    type: DataTypes.STRING(500),
    comment: '变更字段列表，逗号分隔'
  },
  operationReason: {
    type: DataTypes.STRING(500),
    comment: '操作原因/备注'
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
    comment: '批量操作ID'
  },
  verifyResult: {
    type: DataTypes.STRING(20),
    comment: '校验结果: pass-通过, warning-警告, block-拦截'
  },
  verifyMessages: {
    type: DataTypes.TEXT,
    comment: '校验消息 JSON'
  },
  orderFreezeFlag: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否冻结订单预订功能'
  }
}, {
  tableName: 'hotel_logs',
  comment: '酒店门店操作日志表',
  timestamps: true,
  updatedAt: false
});

HotelLog.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
Hotel.hasMany(HotelLog, { foreignKey: 'hotelId', as: 'logs' });

module.exports = HotelLog;

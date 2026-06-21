const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const ScenicSpot = require('./ScenicSpot');

const ScenicSpotLog = sequelize.define('ScenicSpotLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '日志ID'
  },
  scenicSpotId: {
    type: DataTypes.INTEGER,
    references: {
      model: ScenicSpot,
      key: 'id'
    },
    comment: '景点ID'
  },
  operationType: {
    type: DataTypes.STRING(30),
    comment: '操作类型: create-创建, update-修改, on_shelf-上架, off_shelf-下架, status_change-状态变更, batch-批量操作, qualification_audit-资质审核, weight_adjust-权重调整, verify_pass-合规校验, verify_block-拦截'
  },
  operationModule: {
    type: DataTypes.STRING(30),
    comment: '操作模块: basic_info-基础信息, qualification-资质信息, status-经营状态, weight-展示权重, performance-展演场次, limit-限流规则'
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
    comment: '变更字段列表'
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
    comment: '操作人姓名'
  },
  operatorRole: {
    type: DataTypes.STRING(50),
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
    comment: '校验信息 JSON'
  },
  ticketFreezeFlag: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否冻结票务售卖'
  },
  notificationSent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否已推送用户通知'
  }
}, {
  tableName: 'scenic_spot_logs',
  comment: '景点资源操作日志表',
  timestamps: true
});

ScenicSpotLog.belongsTo(ScenicSpot, { foreignKey: 'scenicSpotId', as: 'scenicSpot' });
ScenicSpot.hasMany(ScenicSpotLog, { foreignKey: 'scenicSpotId', as: 'logs' });

module.exports = ScenicSpotLog;

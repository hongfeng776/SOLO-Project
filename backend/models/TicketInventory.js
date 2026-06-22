const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const ScenicSpot = require('./ScenicSpot');
const TicketType = require('./TicketType');

const TicketInventory = sequelize.define('TicketInventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '库存ID'
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
  sessionType: {
    type: DataTypes.STRING(20),
    defaultValue: 'daily',
    comment: '场次类型: daily-日常场次, weekend-周末场次, holiday-节假日场次, performance-专属展演场次'
  },
  sessionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '场次日期'
  },
  sessionName: {
    type: DataTypes.STRING(100),
    comment: '场次名称（如"上午场""下午场"）'
  },
  startTime: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: '场次开始时间 HH:mm'
  },
  endTime: {
    type: DataTypes.TIME,
    allowNull: false,
    comment: '场次结束时间 HH:mm'
  },
  totalQuota: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '总配额（可售库存）'
  },
  reservedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已预约/已占用数量'
  },
  usedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已使用/已核销数量'
  },
  cancelledCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已取消/已释放数量'
  },
  lockedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '锁定数量（人工锁定，不参与售卖）'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'active',
    comment: '库存状态: active-开放, locked-锁定, sold_out-售罄, closed-已关闭, expired-已过期'
  },
  perOrderLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: '单次下单限购数量'
  },
  minAdvanceHours: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '最少提前预约小时数'
  },
  maxAdvanceDays: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: '最多可预约天数'
  },
  autoCloseMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '开场前N分钟自动关闭预约（0表示不自动关闭）'
  },
  requiresReview: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否需人工复核（展演类热门场次）'
  },
  isOverQuota: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否超额配置标记（用于预警）'
  },
  conflictFlag: {
    type: DataTypes.STRING(255),
    comment: '冲突标记：记录与其他场次的冲突信息'
  },
  fakeIndicator: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '虚假库存标记：负库存、超景点限流等'
  },
  warningMessage: {
    type: DataTypes.STRING(500),
    comment: '校验警告信息'
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '展示排序权重'
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
  tableName: 'ticket_inventory',
  comment: '票务分时库存表',
  indexes: [
    { fields: ['scenicSpotId', 'sessionDate', 'sessionType'] },
    { fields: ['ticketTypeId', 'sessionDate'] },
    { fields: ['sessionDate', 'status'] },
    { fields: ['sessionType'] }
  ]
});

TicketInventory.belongsTo(ScenicSpot, { foreignKey: 'scenicSpotId', as: 'scenicSpot' });
TicketInventory.belongsTo(TicketType, { foreignKey: 'ticketTypeId', as: 'ticketType' });

module.exports = TicketInventory;

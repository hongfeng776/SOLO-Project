const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const ScenicSpot = require('./ScenicSpot');

const TicketType = sequelize.define('TicketType', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '票种ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '票种名称'
  },
  ticketCategory: {
    type: DataTypes.STRING(20),
    defaultValue: 'adult',
    comment: '票种品类: adult-成人票, child-儿童票, student-学生票, package-特惠套票'
  },
  scenicSpotId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '所属景点ID'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '票价（元）'
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '原价（用于套票展示优惠）'
  },
  applicableAudience: {
    type: DataTypes.JSON,
    comment: '适用人群配置：{ageRange:[min,max], gender, idCardRequired, certType:[student/elder/disabled]}',
  },
  audienceDescription: {
    type: DataTypes.STRING(255),
    comment: '适用人群文字说明，前台展示用'
  },
  useTimeRule: {
    type: DataTypes.JSON,
    comment: '使用时段规则：{dates:["2025-01-01",...], weekdays:[1-7], timeRange:["08:00","17:00"] , advanceDays}',
  },
  timeDescription: {
    type: DataTypes.STRING(255),
    comment: '使用时段文字说明'
  },
  reservationRequired: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否需要预约: 1-是, 0-否'
  },
  reservationRule: {
    type: DataTypes.JSON,
    comment: '预约规则：{advanceHours, realNameRequired, maxPerOrder, verifyMethod, idCardSlots}'
  },
  refundPolicy: {
    type: DataTypes.JSON,
    comment: '退改规则：{refundable:boolean, beforeMinutes, deductRate, changeable, noShowFee}'
  },
  refundDescription: {
    type: DataTypes.STRING(255),
    comment: '退改规则文字说明'
  },
  dailyQuota: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '每日配额，0表示不限'
  },
  perOrderLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: '单次下单限购数量'
  },
  validityDays: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '使用有效期（天）'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '上架状态: 1-上架, 0-下架'
  },
  enabled: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '启用状态: 1-启用, 0-停用（不删除，保留历史数据）'
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '展示排序权重'
  },
  includeItems: {
    type: DataTypes.JSON,
    comment: '套票包含项目：[{name, count, desc}]，仅特惠套票使用'
  },
  exclusionNotes: {
    type: DataTypes.TEXT,
    comment: '费用不含、提示说明等'
  },
  purchaseInstructions: {
    type: DataTypes.TEXT,
    comment: '购买须知，规则变更后同步至已下单用户'
  },
  isFake: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否虚假票种标记: 1-是, 0-否'
  },
  violationFlags: {
    type: DataTypes.JSON,
    comment: '违规配置标记列表：[{type, field, reason}]'
  },
  scenicSpotNameCache: {
    type: DataTypes.STRING(100),
    comment: '景点名称缓存（用于日志与快速展示）'
  },
  merchantId: {
    type: DataTypes.INTEGER,
    comment: '所属商家ID'
  },
  createdBy: {
    type: DataTypes.STRING(50),
    comment: '创建人'
  },
  updatedBy: {
    type: DataTypes.STRING(50),
    comment: '最近修改人'
  }
}, {
  tableName: 'ticket_types',
  comment: '票种规则配置表',
  timestamps: true
});

TicketType.belongsTo(ScenicSpot, { foreignKey: 'scenicSpotId', as: 'scenicSpot' });
ScenicSpot.hasMany(TicketType, { foreignKey: 'scenicSpotId', as: 'ticketTypes' });

module.exports = TicketType;

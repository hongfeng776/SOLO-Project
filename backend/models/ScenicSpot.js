const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Merchant = require('./Merchant');

const ScenicSpot = sequelize.define('ScenicSpot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '景点ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '景点名称'
  },
  spotType: {
    type: DataTypes.STRING(20),
    defaultValue: 'natural',
    comment: '景点类型: natural-自然景区, cultural-人文景点, theme-主题乐园, performance-特色展演'
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '城市'
  },
  province: {
    type: DataTypes.STRING(50),
    comment: '省份'
  },
  country: {
    type: DataTypes.STRING(50),
    defaultValue: '中国',
    comment: '国家'
  },
  address: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '详细地址'
  },
  region: {
    type: DataTypes.STRING(50),
    comment: '区域编码，用于批量操作范围匹配'
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    comment: '经度'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    comment: '纬度'
  },
  level: {
    type: DataTypes.STRING(10),
    comment: '景区等级: A,AA,AAA,AAAA,AAAAA'
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '基础门票价格'
  },
  maxDailyCapacity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '日最大承载量'
  },
  currentLimit: {
    type: DataTypes.INTEGER,
    comment: '限流人数，0表示不限流'
  },
  limitRule: {
    type: DataTypes.STRING(255),
    comment: '限流规则描述'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '上架状态: 1-上架, 0-下架'
  },
  businessStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'operating',
    comment: '经营状态: operating-营业中, closed-闭园, suspended-暂停营业, rectification-整改中, maintenance-维护中'
  },
  openStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '开放状态: 1-开放, 0-关闭'
  },
  displayWeight: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    comment: '前台展示权重 0-100'
  },
  ticketSaleStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '票务售卖权限: 1-可售, 0-禁售'
  },
  phone: {
    type: DataTypes.STRING(30),
    comment: '联系电话'
  },
  email: {
    type: DataTypes.STRING(100),
    comment: '联系邮箱'
  },
  openingHours: {
    type: DataTypes.STRING(255),
    comment: '开放时间，如: 08:00-18:00'
  },
  closingDays: {
    type: DataTypes.STRING(50),
    comment: '闭园日，如: 周一'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '景点描述'
  },
  facilities: {
    type: DataTypes.TEXT,
    comment: '配套设施 JSON'
  },
  images: {
    type: DataTypes.TEXT,
    comment: '图片地址 JSON'
  },
  businessLicenseNo: {
    type: DataTypes.STRING(50),
    comment: '营业执照编号'
  },
  businessLicenseExpire: {
    type: DataTypes.DATE,
    comment: '营业执照有效期'
  },
  tourismLicenseNo: {
    type: DataTypes.STRING(50),
    comment: '文旅经营许可证编号'
  },
  tourismLicenseExpire: {
    type: DataTypes.DATE,
    comment: '文旅经营许可证有效期'
  },
  safetyLicenseNo: {
    type: DataTypes.STRING(50),
    comment: '安全检查合格证编号'
  },
  safetyLicenseExpire: {
    type: DataTypes.DATE,
    comment: '安全检查合格证有效期'
  },
  fireSafetyLicenseNo: {
    type: DataTypes.STRING(50),
    comment: '消防安全合格证编号'
  },
  fireSafetyLicenseExpire: {
    type: DataTypes.DATE,
    comment: '消防安全合格证有效期'
  },
  performanceLicenseNo: {
    type: DataTypes.STRING(50),
    comment: '演出经营许可证编号（展演类专用）'
  },
  performanceLicenseExpire: {
    type: DataTypes.DATE,
    comment: '演出经营许可证有效期'
  },
  qualificationStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    comment: '资质合规状态: compliant-合规, expired-即将过期, pending-待审核, invalid-无效'
  },
  qualificationAuditTime: {
    type: DataTypes.DATE,
    comment: '资质审核时间'
  },
  qualificationAuditor: {
    type: DataTypes.STRING(50),
    comment: '资质审核人'
  },
  isFake: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否虚假景点'
  },
  isDuplicate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否重复景点'
  },
  warningFlags: {
    type: DataTypes.TEXT,
    comment: '警告标记 JSON'
  },
  performanceSchedule: {
    type: DataTypes.TEXT,
    comment: '展演场次安排 JSON（展演类专用）'
  },
  merchantId: {
    type: DataTypes.INTEGER,
    references: {
      model: Merchant,
      key: 'id'
    },
    comment: '商家ID'
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
  tableName: 'scenic_spots',
  comment: '景点资源表',
  timestamps: true
});

ScenicSpot.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Merchant.hasMany(ScenicSpot, { foreignKey: 'merchantId', as: 'scenicSpots' });

module.exports = ScenicSpot;

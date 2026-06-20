const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Merchant = require('./Merchant');

const Hotel = sequelize.define('Hotel', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '酒店ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '酒店名称'
  },
  hotelType: {
    type: DataTypes.STRING(20),
    defaultValue: 'domestic',
    comment: '酒店类型: domestic-国内酒店, overseas-海外酒店, apartment-民宿公寓, featured-特色酒店'
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '城市'
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
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    comment: '经度'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    comment: '纬度'
  },
  star: {
    type: DataTypes.TINYINT,
    comment: '星级: 1-5'
  },
  starLevel: {
    type: DataTypes.STRING(20),
    comment: '星级评级类型: national-国家评定, chain-连锁品牌, user-用户评定'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '起步价格'
  },
  rooms: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总房间数'
  },
  availableRooms: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '可用房间数'
  },
  roomTypeRange: {
    type: DataTypes.STRING(255),
    comment: '客房资源适配范围，如: 标准间,大床房,套房'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '上架状态: 1-上架, 0-下架'
  },
  businessStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'operating',
    comment: '经营状态: operating-营业中, suspended-停业, rectification-整改中, closed-已关闭'
  },
  displayWeight: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    comment: '前台展示权重 0-100'
  },
  phone: {
    type: DataTypes.STRING(30),
    comment: '联系电话'
  },
  email: {
    type: DataTypes.STRING(100),
    comment: '联系邮箱'
  },
  checkInTime: {
    type: DataTypes.STRING(10),
    defaultValue: '14:00',
    comment: '入住时间'
  },
  checkOutTime: {
    type: DataTypes.STRING(10),
    defaultValue: '12:00',
    comment: '退房时间'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '酒店描述'
  },
  facilities: {
    type: DataTypes.TEXT,
    comment: '设施服务 JSON'
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
  specialLicenseNo: {
    type: DataTypes.STRING(50),
    comment: '特种行业许可证编号'
  },
  specialLicenseExpire: {
    type: DataTypes.DATE,
    comment: '特种行业许可证有效期'
  },
  hygieneLicenseNo: {
    type: DataTypes.STRING(50),
    comment: '卫生许可证编号'
  },
  hygieneLicenseExpire: {
    type: DataTypes.DATE,
    comment: '卫生许可证有效期'
  },
  fireSafetyLicenseNo: {
    type: DataTypes.STRING(50),
    comment: '消防安全检查合格证编号'
  },
  fireSafetyLicenseExpire: {
    type: DataTypes.DATE,
    comment: '消防安全检查合格证有效期'
  },
  crossBorderLicense: {
    type: DataTypes.STRING(50),
    comment: '跨境经营许可证编号（海外酒店）'
  },
  crossBorderLicenseExpire: {
    type: DataTypes.DATE,
    comment: '跨境经营许可证有效期'
  },
  qualificationStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'pending',
    comment: '资质合规状态: compliant-合规, expired-已过期, pending-待审核, invalid-无效'
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
    comment: '是否虚假门店'
  },
  isDuplicate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否重复门店'
  },
  warningFlags: {
    type: DataTypes.TEXT,
    comment: '警告标记 JSON，如资质过期警告'
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
  tableName: 'hotels',
  comment: '酒店门店表',
  timestamps: true
});

Hotel.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Merchant.hasMany(Hotel, { foreignKey: 'merchantId', as: 'hotels' });

module.exports = Hotel;

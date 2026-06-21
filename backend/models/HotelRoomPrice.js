const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const HotelRoom = require('./HotelRoom');
const Hotel = require('./Hotel');

const HotelRoomPrice = sequelize.define('HotelRoomPrice', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '价格套餐ID'
  },
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: Hotel, key: 'id' },
    comment: '酒店门店ID'
  },
  roomId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: HotelRoom, key: 'id' },
    comment: '客房房型ID'
  },
  priceType: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'daily',
    comment: '价格类型: daily-日常房价, weekend-周末房价, holiday-节假日房价, exclusive-专属套餐房价'
  },
  packageName: {
    type: DataTypes.STRING(100),
    comment: '套餐名称（专属套餐必填）'
  },
  packageCode: {
    type: DataTypes.STRING(50),
    unique: true,
    comment: '套餐编码'
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '基准售价'
  },
  originalPrice: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '原价（划线价）'
  },
  discountRatio: {
    type: DataTypes.DECIMAL(5, 2),
    comment: '折扣比例 0-10 折'
  },
  memberPrice: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '会员专属价'
  },
  corporatePrice: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '协议企业价'
  },
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '生效开始日期'
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '生效结束日期'
  },
  weekDays: {
    type: DataTypes.STRING(30),
    defaultValue: '1,2,3,4,5,6,7',
    comment: '适用星期几 1-7 逗号分隔'
  },
  minAdvanceDays: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '最小提前预订天数'
  },
  maxAdvanceDays: {
    type: DataTypes.TINYINT,
    defaultValue: 30,
    comment: '最大提前预订天数'
  },
  minNights: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '最小连住晚数'
  },
  maxNights: {
    type: DataTypes.TINYINT,
    defaultValue: 30,
    comment: '最大连住晚数'
  },
  includedServices: {
    type: DataTypes.TEXT,
    comment: '包含服务 JSON数组'
  },
  servicesText: {
    type: DataTypes.STRING(500),
    comment: '包含服务展示文本'
  },
  cancelPolicy: {
    type: DataTypes.STRING(30),
    defaultValue: 'free_before_24h',
    comment: '退改规则: non_refundable不可取消, free_before_24h入住前24h免费取消, free_before_48h入住前48h免费取消, flexible灵活取消'
  },
  penaltyAmount: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '违约金额'
  },
  penaltyPercent: {
    type: DataTypes.DECIMAL(5, 2),
    comment: '违约金比例 %'
  },
  targetGuestTags: {
    type: DataTypes.STRING(200),
    comment: '目标客群标签逗号分隔'
  },
  targetMemberLevels: {
    type: DataTypes.STRING(100),
    comment: '适用会员等级逗号分隔'
  },
  targetCorporateIds: {
    type: DataTypes.STRING(200),
    comment: '适用协议企业ID逗号分隔'
  },
  stockType: {
    type: DataTypes.STRING(20),
    defaultValue: 'unlimited',
    comment: '库存类型: unlimited无限, limited限量, daily_limit每日限量'
  },
  totalStock: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总库存（限量套餐）'
  },
  soldCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已售出数量'
  },
  dailyLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '每日限量'
  },
  perOrderLimit: {
    type: DataTypes.TINYINT,
    defaultValue: 9,
    comment: '每单限购数量'
  },
  perUserLimit: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '每人限购数量（0不限）'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'draft',
    comment: '状态: draft草稿, active生效中, inactive已停用, expired已过期'
  },
  displayOnHome: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '首页展示'
  },
  displayPriority: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '展示优先级'
  },
  isExclusive: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否专属特价套餐（禁止批量修改）'
  },
  isFlashSale: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否限时闪购'
  },
  flashSaleStartTime: {
    type: DataTypes.DATE,
    comment: '闪购开始时间'
  },
  flashSaleEndTime: {
    type: DataTypes.DATE,
    comment: '闪购结束时间'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '套餐描述'
  },
  images: {
    type: DataTypes.TEXT,
    comment: '套餐图片'
  },
  useInstructions: {
    type: DataTypes.STRING(500),
    comment: '使用须知'
  },
  isFake: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否虚假套餐'
  },
  isOverDiscount: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否超范围优惠'
  },
  warningFlags: {
    type: DataTypes.TEXT,
    comment: '警告标记'
  },
  verifyResult: {
    type: DataTypes.STRING(20),
    comment: '校验结果'
  },
  syncToUnpaidOrders: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '价格变更同步至未支付订单'
  },
  lastSyncTime: {
    type: DataTypes.DATE,
    comment: '最后同步订单时间'
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
  tableName: 'hotel_room_prices',
  comment: '酒店房价套餐表',
  timestamps: true,
  indexes: [
    { fields: ['hotelId', 'roomId'] },
    { fields: ['priceType', 'status'] },
    { fields: ['startDate', 'endDate'] },
    { fields: ['packageCode'], unique: true }
  ]
});

HotelRoomPrice.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
HotelRoomPrice.belongsTo(HotelRoom, { foreignKey: 'roomId', as: 'room' });
HotelRoom.hasMany(HotelRoomPrice, { foreignKey: 'roomId', as: 'prices' });

module.exports = HotelRoomPrice;

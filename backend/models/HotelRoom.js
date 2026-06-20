const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Hotel = require('./Hotel');

const HotelRoom = sequelize.define('HotelRoom', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '客房ID'
  },
  hotelId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Hotel,
      key: 'id'
    },
    comment: '所属酒店门店ID'
  },
  roomType: {
    type: DataTypes.STRING(30),
    allowNull: false,
    defaultValue: 'standard',
    comment: '房型分类: standard-标准客房, deluxe-豪华客房, suite-套房, featured-特色房型'
  },
  roomName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '客房名称'
  },
  roomNo: {
    type: DataTypes.STRING(30),
    comment: '物理房号（可空，房型维度时为空）'
  },
  floor: {
    type: DataTypes.STRING(20),
    comment: '楼层'
  },
  area: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    comment: '房型面积（平方米）'
  },
  capacity: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 2,
    comment: '标准容纳人数'
  },
  maxCapacity: {
    type: DataTypes.TINYINT,
    comment: '最大容纳人数（加床后）'
  },
  bedType: {
    type: DataTypes.STRING(50),
    comment: '床型: single-单人床, double-大床, twin-双床, king-特大床, sofa-沙发床'
  },
  bedCount: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '床数量'
  },
  basePrice: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '基准价'
  },
  weekendPrice: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '周末价'
  },
  holidayPrice: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '节假日价'
  },
  extraBedPrice: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '加床价格'
  },
  breakfast: {
    type: DataTypes.STRING(20),
    defaultValue: 'none',
    comment: '早餐: none-无早, single-单早, double-双早, extra-额外加早'
  },
  breakfastPrice: {
    type: DataTypes.DECIMAL(10, 2),
    comment: '加早价格'
  },
  cancelPolicy: {
    type: DataTypes.STRING(30),
    defaultValue: 'free_before_24h',
    comment: '取消政策: non_refundable-不可取消, free_before_24h-入住前24h免费取消, free_before_48h-入住前48h免费取消, flexible-灵活取消'
  },
  facilities: {
    type: DataTypes.TEXT,
    comment: '设施标签 JSON数组'
  },
  facilityText: {
    type: DataTypes.STRING(500),
    comment: '设施展示文本（前台用）'
  },
  targetGuest: {
    type: DataTypes.STRING(100),
    comment: '适配人群: 商务出行/家庭出游/情侣度假/朋友聚会/长住租客等'
  },
  totalCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '该房型总数量'
  },
  availableCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '当前可售数量'
  },
  maintainCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '维护中数量'
  },
  status: {
    type: DataTypes.STRING(20),
    defaultValue: 'on_sale',
    comment: '上下架状态: on_sale-在售, off_sale-下架, sold_out-满房'
  },
  maintainStatus: {
    type: DataTypes.STRING(20),
    defaultValue: 'normal',
    comment: '维护状态: normal-正常, maintenance-维护中, closed-停用, cleaning-清洁中'
  },
  isBookable: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否可预订（锁定后自动设为false）'
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '展示排序值'
  },
  displayOnHome: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否首页展示'
  },
  images: {
    type: DataTypes.TEXT,
    comment: '图片URL JSON数组'
  },
  description: {
    type: DataTypes.TEXT,
    comment: '房型介绍'
  },
  isDuplicate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否重复房型'
  },
  isFake: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否虚假房型'
  },
  warningFlags: {
    type: DataTypes.TEXT,
    comment: '警告标记 JSON'
  },
  orderLedgerSync: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否同步至门店客房台账'
  },
  lastSyncTime: {
    type: DataTypes.DATE,
    comment: '最后同步台账时间'
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
  tableName: 'hotel_rooms',
  comment: '酒店客房资源表',
  timestamps: true,
  indexes: [
    { fields: ['hotelId', 'roomType'] },
    { fields: ['roomNo'] },
    { fields: ['status', 'maintainStatus'] }
  ]
});

HotelRoom.belongsTo(Hotel, { foreignKey: 'hotelId', as: 'hotel' });
Hotel.hasMany(HotelRoom, { foreignKey: 'hotelId', as: 'rooms' });

module.exports = HotelRoom;

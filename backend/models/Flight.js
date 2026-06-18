const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Flight = sequelize.define('Flight', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '航班ID'
  },
  flightNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '航班号'
  },
  airline: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '航空公司'
  },
  airlineCode: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '航空公司二字码'
  },
  flightType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '航班类型: 1-国内航班, 2-国际航班, 3-中转航班, 4-包机航班'
  },
  routeCode: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '航线编码'
  },
  departure: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '出发地'
  },
  departureAirport: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '出发机场'
  },
  departureAirportCode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: '出发机场三字码'
  },
  arrival: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '目的地'
  },
  arrivalAirport: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '到达机场'
  },
  arrivalAirportCode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    comment: '到达机场三字码'
  },
  departureTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '出发时间'
  },
  arrivalTime: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '到达时间'
  },
  aircraftType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '机型'
  },
  aircraftModel: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '机型型号'
  },
  seatCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总座位数'
  },
  seats: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '剩余座位数'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: '价格'
  },
  cabinClass: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '舱位等级: 经济舱/商务舱/头等舱'
  },
  isTransfer: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否中转: 0-否, 1-是'
  },
  transferCity: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '中转城市'
  },
  transferAirport: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '中转机场'
  },
  transferAirportCode: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '中转机场三字码'
  },
  transferDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '中转时长(分钟)'
  },
  isCharter: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否包机: 0-否, 1-是'
  },
  charterContractNo: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '包机合同编号'
  },
  isInternational: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否国际航班: 0-国内, 1-国际'
  },
  departureCountry: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '出发国家(国际航班)'
  },
  arrivalCountry: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '到达国家(国际航班)'
  },
  visaRequired: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否需要签证: 0-否, 1-是'
  },
  flightDuration: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '飞行时长(分钟)'
  },
  flightDistance: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '飞行里程(公里)'
  },
  displayStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '展示状态: 0-下架, 1-上架展示'
  },
  saleStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '可售状态: 0-不可售, 1-可售'
  },
  operationStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '运营状态: 1-正常, 2-延误, 3-取消, 4-备降, 5-返航'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 1-在售, 0-下架'
  },
  delayMinutes: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '延误时长(分钟)'
  },
  cancelReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '取消原因'
  },
  qualificationCode: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '运营资质编码'
  },
  qualificationValidUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '资质有效期至'
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '最后操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '最后操作人姓名'
  },
  createdAt: {
    type: DataTypes.DATE,
    comment: '创建时间'
  },
  updatedAt: {
    type: DataTypes.DATE,
    comment: '更新时间'
  }
}, {
  tableName: 'flights',
  comment: '航班资源表',
  indexes: [
    { fields: ['flightNo'] },
    { fields: ['routeCode'] },
    { fields: ['departureAirportCode', 'arrivalAirportCode'] },
    { fields: ['flightType'] },
    { fields: ['operationStatus'] },
    { fields: ['displayStatus', 'saleStatus'] },
    { fields: ['departureTime'] }
  ]
});

module.exports = Flight;

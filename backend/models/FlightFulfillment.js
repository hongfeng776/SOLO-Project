const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Order = require('./Order');
const Flight = require('./Flight');
const User = require('./User');
const Merchant = require('./Merchant');

const FlightFulfillment = sequelize.define('FlightFulfillment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '履约ID'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Order,
      key: 'id'
    },
    comment: '订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '订单编号'
  },
  flightId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Flight,
      key: 'id'
    },
    comment: '航班ID'
  },
  flightNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '航班号'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    comment: '用户ID'
  },
  merchantId: {
    type: DataTypes.INTEGER,
    references: {
      model: Merchant,
      key: 'id'
    },
    comment: '商家ID'
  },
  fulfillmentCategory: {
    type: DataTypes.STRING(30),
    defaultValue: 'normal',
    comment: '履约分类: normal-普通履约, international-国际机票履约, group-团体履约, vip-VIP履约'
  },
  fulfillmentStage: {
    type: DataTypes.STRING(30),
    defaultValue: 'pending_ticket',
    comment: '履约阶段: pending_ticket-待出票, ticketed-已出票, flight_changed-航班变动, terminated-行程终止'
  },
  fulfillmentStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '履约状态: 0-待处理, 1-处理中, 2-已完成, 3-已异常, 4-已终止'
  },
  passengerInfo: {
    type: DataTypes.JSON,
    comment: '乘机人信息列表: [{name, idCard, idType, phone, birthDate, nationality}]'
  },
  passengerCount: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '乘机人数'
  },
  idValidStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '证件有效期状态: 0-已过期, 1-有效, 2-即将过期(30天内)'
  },
  idExpireCheckTime: {
    type: DataTypes.DATE,
    comment: '证件有效期校验时间'
  },
  ticketNumbers: {
    type: DataTypes.JSON,
    comment: '票号列表: [{ticketNo, passengerName, cabinClass, status}]'
  },
  ticketIssuedTime: {
    type: DataTypes.DATE,
    comment: '出票时间'
  },
  ticketExpireTime: {
    type: DataTypes.DATE,
    comment: '出票时效过期时间'
  },
  ticketIssueTimeout: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否出票超时: 0-否, 1-是'
  },
  pnrCode: {
    type: DataTypes.STRING(50),
    comment: 'PNR编码(订座记录编号)'
  },
  cabinClass: {
    type: DataTypes.STRING(50),
    comment: '舱位等级: economy-经济舱, business-商务舱, first-头等舱'
  },
  fareAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '票价金额'
  },
  taxAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '税费金额'
  },
  fuelSurcharge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '燃油附加费'
  },
  airportTax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '机场建设费'
  },
  flightOperationStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '航班运营状态: 1-正常, 2-延误, 3-取消, 4-备降, 5-返航'
  },
  flightChangeType: {
    type: DataTypes.STRING(30),
    comment: '变动类型: delay-延误, cancel-取消, divert-备降, return-返航, change_route-改航线'
  },
  flightChangeTime: {
    type: DataTypes.DATE,
    comment: '航班变动时间'
  },
  flightChangeReason: {
    type: DataTypes.STRING(500),
    comment: '航班变动原因'
  },
  flightChangeHandlePlan: {
    type: DataTypes.STRING(500),
    comment: '航班变动处理方案: rebook-改签, refund-退票, endorse-签转, wait-等待'
  },
  flightChangeHandled: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '航班变动是否已处理: 0-未处理, 1-已处理'
  },
  flightChangeHandledTime: {
    type: DataTypes.DATE,
    comment: '航班变动处理时间'
  },
  rebookFlightId: {
    type: DataTypes.INTEGER,
    comment: '改签后航班ID'
  },
  rebookFlightNo: {
    type: DataTypes.STRING(50),
    comment: '改签后航班号'
  },
  rebookTime: {
    type: DataTypes.DATE,
    comment: '改签时间'
  },
  isInternational: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否国际机票: 0-国内, 1-国际'
  },
  visaVerified: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '签证是否已核验: 0-未核验, 1-已核验, 2-无需签证'
  },
  baggageInfo: {
    type: DataTypes.JSON,
    comment: '行李信息: [{baggageType, weight, count, extraFee}]'
  },
  seatInfo: {
    type: DataTypes.JSON,
    comment: '座位信息: [{passengerName, seatNo, seatType}]'
  },
  mealInfo: {
    type: DataTypes.STRING(200),
    comment: '餐食信息'
  },
  insuranceInfo: {
    type: DataTypes.JSON,
    comment: '保险信息: [{insuranceType, insurer, policyNo, amount}]'
  },
  ticketVoucherStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '出票凭证状态: 0-未生成, 1-已生成, 2-已发送, 3-用户已确认'
  },
  voucherFileUrl: {
    type: DataTypes.STRING(500),
    comment: '出票凭证文件URL'
  },
  travelRecordUpdated: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '用户出行记录是否已更新: 0-未更新, 1-已更新'
  },
  merchantLedgerUpdated: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '商家履约台账是否已更新: 0-未更新, 1-已更新'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常履约: 0-正常, 1-异常'
  },
  abnormalType: {
    type: DataTypes.STRING(50),
    comment: '异常类型: fake_ticket-虚假出票, duplicate_ticket-重复出票, non_compliance-违规操作, info_mismatch-信息不一致, timeout-超时'
  },
  abnormalReason: {
    type: DataTypes.STRING(500),
    comment: '异常原因'
  },
  abnormalHandled: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '异常是否已处理: 0-未处理, 1-已处理'
  },
  abnormalHandleRemark: {
    type: DataTypes.STRING(500),
    comment: '异常处理备注'
  },
  abnormalHandledTime: {
    type: DataTypes.DATE,
    comment: '异常处理时间'
  },
  terminationReason: {
    type: DataTypes.STRING(500),
    comment: '行程终止原因'
  },
  terminationTime: {
    type: DataTypes.DATE,
    comment: '行程终止时间'
  },
  fulfillmentDeadline: {
    type: DataTypes.DATE,
    comment: '履约完成期限'
  },
  fulfillmentCompletionTime: {
    type: DataTypes.DATE,
    comment: '履约完成时间'
  },
  actualDepartureTime: {
    type: DataTypes.DATE,
    comment: '实际出发时间'
  },
  actualArrivalTime: {
    type: DataTypes.DATE,
    comment: '实际到达时间'
  },
  checkInStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '值机状态: 0-未值机, 1-已值机, 2-已取消值机'
  },
  checkInTime: {
    type: DataTypes.DATE,
    comment: '值机时间'
  },
  boardingStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '登机状态: 0-未登机, 1-已登机, 2-已下机'
  },
  boardingTime: {
    type: DataTypes.DATE,
    comment: '登机时间'
  },
  remark: {
    type: DataTypes.STRING(500),
    comment: '备注'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    comment: '最后操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(100),
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
  tableName: 'flight_fulfillments',
  comment: '机票订单履约表',
  timestamps: true,
  paranoid: true,
  indexes: [
    { fields: ['orderId'], unique: true },
    { fields: ['orderNo'] },
    { fields: ['flightId'] },
    { fields: ['flightNo'] },
    { fields: ['userId'] },
    { fields: ['fulfillmentStage'] },
    { fields: ['fulfillmentStatus'] },
    { fields: ['isAbnormal'] },
    { fields: ['ticketIssuedTime'] },
    { fields: ['fulfillmentCompletionTime'] }
  ]
});

FlightFulfillment.belongsTo(Order, { foreignKey: 'orderId', as: 'order' });
Order.hasOne(FlightFulfillment, { foreignKey: 'orderId', as: 'flightFulfillment' });

FlightFulfillment.belongsTo(Flight, { foreignKey: 'flightId', as: 'flight' });
Flight.hasMany(FlightFulfillment, { foreignKey: 'flightId', as: 'flightFulfillments' });

FlightFulfillment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(FlightFulfillment, { foreignKey: 'userId', as: 'flightFulfillments' });

FlightFulfillment.belongsTo(Merchant, { foreignKey: 'merchantId', as: 'merchant' });
Merchant.hasMany(FlightFulfillment, { foreignKey: 'merchantId', as: 'flightFulfillments' });

module.exports = FlightFulfillment;

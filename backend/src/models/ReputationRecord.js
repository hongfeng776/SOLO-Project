const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const ReputationRecord = sequelize.define('ReputationRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  recordNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '记录编号'
  },
  passengerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '乘客ID'
  },
  passengerName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '乘客姓名'
  },
  passengerPhone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '乘客电话'
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '司机ID'
  },
  driverName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '司机姓名'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(32),
    allowNull: true,
    comment: '关联订单号'
  },
  ticketId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联工单ID'
  },
  ticketNo: {
    type: DataTypes.STRING(32),
    allowNull: true,
    comment: '关联工单号'
  },
  changeType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '变更类型：order_complete/order_cancel/ticket_resolve/ticket_reject/violation/reward'
  },
  changeDirection: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '变更方向：1增加 -1减少'
  },
  beforeScore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '变更前信誉分'
  },
  changeAmount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '变更分值'
  },
  afterScore: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '变更后信誉分'
  },
  minScoreLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '最低信誉分限制'
  },
  maxScoreLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    comment: '最高信誉分限制'
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '变更原因'
  },
  detail: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '详细说明'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人姓名'
  },
  operatorIP: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人IP'
  },
  isReversed: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否已撤销：0否 1是'
  },
  reversedTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '撤销时间'
  },
  reversedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '撤销人ID'
  },
  reversedReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '撤销原因'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
  },
  createTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'biz_reputation_record',
  comment: '信誉分记录表',
  timestamps: false,
  indexes: [
    { fields: ['recordNo'] },
    { fields: ['passengerId'] },
    { fields: ['driverId'] },
    { fields: ['orderId'] },
    { fields: ['ticketId'] },
    { fields: ['changeType'] },
    { fields: ['createTime'] }
  ]
})

module.exports = ReputationRecord

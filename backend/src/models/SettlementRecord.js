const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const SettlementRecord = sequelize.define('SettlementRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  settlementNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '结算单号'
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '司机ID'
  },
  settlementType: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '结算类型：1日结 2周结 3月结 4手动结算'
  },
  settleStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '结算状态：1待结算 2结算中 3已结算 4已入账 5结算异常 6已驳回'
  },
  periodStart: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '结算周期开始'
  },
  periodEnd: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '结算周期结束'
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '订单总数'
  },
  totalOrderAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '订单总金额'
  },
  baseIncome: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '基础收入'
  },
  totalSubsidy: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '补贴合计'
  },
  hourSubsidy: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '时段补贴'
  },
  ratingSubsidy: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '星级补贴'
  },
  holidaySubsidy: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '节假日补贴'
  },
  premiumSubsidy: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '溢价分成'
  },
  excellentSubsidy: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '优质司机专属补贴'
  },
  newDriverSubsidy: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '新人补贴'
  },
  penaltyAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '扣款金额'
  },
  totalIncome: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '司机总收益=基础收入+补贴合计-扣款'
  },
  platformCommission: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '平台抽成'
  },
  actualSettleAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '实际结算金额'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常：0否 1是'
  },
  abnormalType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '异常类型：repeat_settlement重复/over_settlement超额/illegal_subsidy违规补贴/mismatch数据不匹配'
  },
  abnormalReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '异常原因'
  },
  rejectReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '驳回原因'
  },
  isPosted: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否已入账：0否 1是(入账后不可修改)'
  },
  postedTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '入账时间'
  },
  settleTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '结算完成时间'
  },
  voucherNo: {
    type: DataTypes.STRING(64),
    allowNull: true,
    unique: true,
    comment: '结算凭证号(唯一)'
  },
  auditStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '审核状态：0未审核 1审核通过 2审核驳回'
  },
  auditorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '审核人ID'
  },
  auditorName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '审核人'
  },
  auditTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间'
  },
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  },
  updateTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '更新时间'
  }
}, {
  tableName: 'biz_settlement_record',
  comment: '结算记录表',
  indexes: [
    { fields: ['settlementNo'], unique: true },
    { fields: ['driverId'] },
    { fields: ['settleStatus'] },
    { fields: ['isAbnormal'] },
    { fields: ['isPosted'] },
    { fields: ['periodStart', 'periodEnd'] },
    { fields: ['voucherNo'], unique: true }
  ]
})

module.exports = SettlementRecord

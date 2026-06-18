const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const UserBenefit = require('./UserBenefit');

const BenefitLog = sequelize.define('BenefitLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '流水ID'
  },
  benefitId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '权益ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  actionType: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '操作类型: grant发放/reissue补发/void作废/use使用/return退回/extend延期/recycle回收/expire过期/block拦截'
  },
  actionName: {
    type: DataTypes.STRING(64),
    comment: '操作名称'
  },
  beforeValue: {
    type: DataTypes.STRING(256),
    comment: '变更前值'
  },
  afterValue: {
    type: DataTypes.STRING(256),
    comment: '变更后值'
  },
  quantityChange: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '数量变化（正增负减）'
  },
  amountChange: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '金额变化'
  },
  relatedOrderNo: {
    type: DataTypes.STRING(64),
    comment: '关联订单号'
  },
  relatedType: {
    type: DataTypes.STRING(32),
    comment: '关联类型: order/payment/refund/manual'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常操作'
  },
  abnormalType: {
    type: DataTypes.STRING(32),
    comment: '异常类型: duplicate重复/over_limit超额/over_count超量/invalid无效/scene场景不符'
  },
  abnormalDetail: {
    type: DataTypes.TEXT,
    comment: '异常详情说明'
  },
  actionDetail: {
    type: DataTypes.TEXT,
    comment: '操作详情JSON'
  },
  batchNo: {
    type: DataTypes.STRING(64),
    comment: '批次号'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    comment: '操作人ID'
  },
  operatorRole: {
    type: DataTypes.STRING(32),
    comment: '操作人角色'
  },
  operatorName: {
    type: DataTypes.STRING(64),
    comment: '操作人姓名'
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注'
  }
}, {
  tableName: 'benefit_logs',
  updatedAt: false,
  comment: '权益流水表'
});

BenefitLog.belongsTo(UserBenefit, { foreignKey: 'benefitId', as: 'benefit' });
UserBenefit.hasMany(BenefitLog, { foreignKey: 'benefitId', as: 'logs' });
BenefitLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(BenefitLog, { foreignKey: 'userId', as: 'benefitLogs' });

module.exports = BenefitLog;

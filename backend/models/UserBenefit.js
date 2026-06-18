const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const UserBenefit = sequelize.define('UserBenefit', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '权益ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  benefitType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '权益类型: 1-出行优惠券 2-积分权益 3-贵宾权益 4-商旅专属'
  },
  benefitKey: {
    type: DataTypes.STRING(64),
    allowNull: false,
    comment: '权益编码'
  },
  benefitName: {
    type: DataTypes.STRING(128),
    allowNull: false,
    comment: '权益名称'
  },
  benefitDesc: {
    type: DataTypes.TEXT,
    comment: '权益说明'
  },
  totalQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '总数量/额度'
  },
  usedQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已使用数量/额度'
  },
  remainQuantity: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: '剩余数量/额度'
  },
  amountValue: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '面值（元/折扣值）'
  },
  unitType: {
    type: DataTypes.STRING(16),
    defaultValue: 'count',
    comment: '单位: count次/score积分/amount金额/discount折扣'
  },
  minAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '使用门槛'
  },
  applyScenes: {
    type: DataTypes.STRING(256),
    comment: '适用场景(逗号分隔): flight/hotel/car/ticket/business'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 0作废 1未使用 2部分使用 3已用完 4已过期'
  },
  source: {
    type: DataTypes.STRING(32),
    defaultValue: 'manual',
    comment: '来源: manual手动/system系统/batch批量/campaign活动/order订单'
  },
  batchNo: {
    type: DataTypes.STRING(64),
    comment: '批次号'
  },
  relatedId: {
    type: DataTypes.STRING(64),
    comment: '关联单号(订单/活动ID)'
  },
  levelRequired: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '使用等级要求: 1普通 2商旅 3VIP'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常'
  },
  abnormalType: {
    type: DataTypes.STRING(32),
    comment: '异常类型: duplicate重复/over_limit超额/abnormal违规'
  },
  validFrom: {
    type: DataTypes.DATE,
    comment: '生效时间'
  },
  validTo: {
    type: DataTypes.DATE,
    comment: '失效时间'
  },
  usedTime: {
    type: DataTypes.DATE,
    comment: '最近使用时间'
  },
  expireNoticeSent: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '过期通知是否发送'
  },
  remark: {
    type: DataTypes.TEXT,
    comment: '备注'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    comment: '操作人ID'
  }
}, {
  tableName: 'user_benefits',
  comment: '用户权益表'
});

UserBenefit.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(UserBenefit, { foreignKey: 'userId', as: 'benefits' });

module.exports = UserBenefit;

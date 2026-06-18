const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const UserRisk = sequelize.define('UserRisk', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '风险记录ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    comment: '用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    comment: '用户名'
  },
  riskLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '风险等级: 0-正常, 1-轻度预警, 2-中度关注, 3-重度高危'
  },
  riskScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '风险评分(0-100)'
  },
  riskTags: {
    type: DataTypes.STRING(500),
    comment: '风险标签(JSON数组)'
  },
  abnormalCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '累计异常行为次数'
  },
  fakeCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '虚假行为次数'
  },
  fraudCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '刷单次数'
  },
  abuseCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '恶意售后次数'
  },
  woolCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '薅权益次数'
  },
  isRestricted: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否限制操作: 0-否, 1-限制下单, 2-限制售后, 3-全限制'
  },
  isMarked: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否标记为风险用户: 0-否, 1-是'
  },
  warningSent: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已发送风险提醒次数'
  },
  lastWarningTime: {
    type: DataTypes.DATE,
    comment: '最后一次提醒时间'
  },
  lastAbnormalTime: {
    type: DataTypes.DATE,
    comment: '最近异常行为时间'
  },
  remark: {
    type: DataTypes.STRING(500),
    comment: '风控备注'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    comment: '最后操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    comment: '最后操作人'
  }
}, {
  tableName: 'user_risks',
  comment: '用户风险标记表',
  indexes: [
    { fields: ['userId'], unique: true },
    { fields: ['riskLevel'] },
    { fields: ['isMarked'] },
    { fields: ['riskScore'] }
  ]
});

UserRisk.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserRisk, { foreignKey: 'userId', as: 'risk' });

module.exports = UserRisk;

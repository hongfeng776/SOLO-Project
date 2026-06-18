const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const MerchantQualification = require('./MerchantQualification');
const MerchantAuditLog = require('./MerchantAuditLog');

const Merchant = sequelize.define('Merchant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '商家ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商家名称'
  },
  contact: {
    type: DataTypes.STRING(50),
    comment: '联系人'
  },
  phone: {
    type: DataTypes.STRING(20),
    comment: '联系电话'
  },
  address: {
    type: DataTypes.STRING(255),
    comment: '地址'
  },
  auditStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '审核状态: 0-待审核, 1-已通过, 2-已驳回, 3-审核中, 4-暂存, 5-已过期, 6-终审中, 7-已修正待审核'
  },
  businessLicense: {
    type: DataTypes.STRING(255),
    comment: '营业执照图片URL'
  },
  violationLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '违规等级: 0-正常, 1-轻微, 2-一般, 3-严重'
  },
  violationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '违规次数'
  },
  lastViolationTime: {
    type: DataTypes.DATE,
    comment: '最近违规时间'
  },
  businessType: {
    type: DataTypes.STRING(20),
    comment: '业务品类: flight-机票, hotel-酒店, tourism-文旅, car-租车'
  },
  merchantCategory: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '商家类型: 1-普通, 2-高危行业(需要人工专项核验)'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 0-禁用, 1-启用'
  },
  email: {
    type: DataTypes.STRING(100),
    comment: '邮箱'
  },
  scope: {
    type: DataTypes.STRING(255),
    comment: '经营范围'
  },
  settledAt: {
    type: DataTypes.DATE,
    comment: '入驻时间'
  },
  auditSubmitTime: {
    type: DataTypes.DATE,
    comment: '审核提交时间'
  },
  auditExpireTime: {
    type: DataTypes.DATE,
    comment: '审核过期时间'
  },
  auditLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '审核层级: 1-初审, 2-终审'
  },
  rejectReason: {
    type: DataTypes.TEXT,
    comment: '驳回原因'
  },
  businessPermission: {
    type: DataTypes.JSON,
    comment: '经营权限配置',
    defaultValue: {}
  },
  listingPermission: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '资源上架权限: 0-无权限, 1-拥有权限'
  },
  settleStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '入驻流程状态: 0-未开始, 1-信息提交, 2-资质提交, 3-审核中, 4-已完成, 5-已锁定'
  },
  unifiedCreditCode: {
    type: DataTypes.STRING(50),
    comment: '统一社会信用代码'
  },
  legalPersonName: {
    type: DataTypes.STRING(50),
    comment: '法人姓名'
  },
  legalPersonIdCard: {
    type: DataTypes.STRING(50),
    comment: '法人身份证号'
  },
  registeredCapital: {
    type: DataTypes.DECIMAL(15, 2),
    comment: '注册资本'
  },
  establishDate: {
    type: DataTypes.DATE,
    comment: '成立日期'
  },
  businessTermStart: {
    type: DataTypes.DATE,
    comment: '营业期限开始'
  },
  businessTermEnd: {
    type: DataTypes.DATE,
    comment: '营业期限结束'
  },
  reviseCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '资料修正次数'
  }
}, {
  tableName: 'merchants',
  comment: '商家表',
  timestamps: true,
  paranoid: true
});

Merchant.hasMany(MerchantQualification, {
  foreignKey: 'merchantId',
  as: 'qualifications'
});

MerchantQualification.belongsTo(Merchant, {
  foreignKey: 'merchantId',
  as: 'merchant'
});

Merchant.hasMany(MerchantAuditLog, {
  foreignKey: 'merchantId',
  as: 'auditLogs'
});

MerchantAuditLog.belongsTo(Merchant, {
  foreignKey: 'merchantId',
  as: 'merchant'
});

module.exports = Merchant;

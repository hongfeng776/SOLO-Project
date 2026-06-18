const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const MerchantQualification = require('./MerchantQualification');
const MerchantAuditLog = require('./MerchantAuditLog');
const MerchantInfoChangeLog = require('./MerchantInfoChangeLog');

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
  shortName: {
    type: DataTypes.STRING(50),
    comment: '商家简称'
  },
  englishName: {
    type: DataTypes.STRING(150),
    comment: '英文名称'
  },
  brandName: {
    type: DataTypes.STRING(100),
    comment: '品牌名称'
  },
  contact: {
    type: DataTypes.STRING(50),
    comment: '联系人'
  },
  contactPosition: {
    type: DataTypes.STRING(50),
    comment: '联系人职位'
  },
  contactWechat: {
    type: DataTypes.STRING(50),
    comment: '联系人微信'
  },
  contactQq: {
    type: DataTypes.STRING(20),
    comment: '联系人QQ'
  },
  phone: {
    type: DataTypes.STRING(20),
    comment: '联系电话'
  },
  backupPhone: {
    type: DataTypes.STRING(20),
    comment: '备用联系电话'
  },
  serviceHotline: {
    type: DataTypes.STRING(20),
    comment: '客服热线'
  },
  complaintHotline: {
    type: DataTypes.STRING(20),
    comment: '投诉热线'
  },
  address: {
    type: DataTypes.STRING(255),
    comment: '地址'
  },
  province: {
    type: DataTypes.STRING(50),
    comment: '省份'
  },
  city: {
    type: DataTypes.STRING(50),
    comment: '城市'
  },
  district: {
    type: DataTypes.STRING(50),
    comment: '区县'
  },
  addressDetail: {
    type: DataTypes.STRING(500),
    comment: '详细地址'
  },
  longitude: {
    type: DataTypes.DECIMAL(10, 7),
    comment: '经度'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 7),
    comment: '纬度'
  },
  email: {
    type: DataTypes.STRING(100),
    comment: '邮箱'
  },
  officialWebsite: {
    type: DataTypes.STRING(255),
    comment: '官方网站'
  },
  businessType: {
    type: DataTypes.STRING(20),
    comment: '业务品类: flight-机票, hotel-酒店, tourism-文旅, car-租车'
  },
  secondaryBusinessTypes: {
    type: DataTypes.JSON,
    comment: '兼营品类',
    defaultValue: []
  },
  merchantCategory: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '商家类型: 1-普通, 2-高危行业(需要人工专项核验)'
  },
  merchantLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 3,
    comment: '商家评级/星级: 1-一星, 2-二星, 3-三星, 4-四星, 5-五星'
  },
  merchantTags: {
    type: DataTypes.JSON,
    comment: '商家标签: 官方直营/品牌授权/优质商家/新商家等',
    defaultValue: []
  },
  merchantRating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.00,
    comment: '商家综合评分'
  },
  ratingCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '评分次数'
  },
  auditStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '审核状态: 0-待审核, 1-已通过, 2-已驳回, 3-审核中, 4-暂存, 5-已过期, 6-终审中, 7-已修正待审核'
  },
  businessStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '经营状态: 0-停业, 1-营业中, 2-暂停营业, 3-装修中, 4-已结业'
  },
  operationStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '运营状态: 0-异常, 1-正常运营, 2-临时锁定, 3-永久锁定'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 0-禁用, 1-启用'
  },
  businessLicense: {
    type: DataTypes.STRING(255),
    comment: '营业执照图片URL'
  },
  scope: {
    type: DataTypes.STRING(255),
    comment: '经营范围'
  },
  settledAt: {
    type: DataTypes.DATE,
    comment: '入驻时间'
  },
  businessStartTime: {
    type: DataTypes.TIME,
    comment: '营业开始时间'
  },
  businessEndTime: {
    type: DataTypes.TIME,
    comment: '营业结束时间'
  },
  businessDays: {
    type: DataTypes.JSON,
    comment: '营业日: [1,2,3,4,5,6,7] 表示周一到周日',
    defaultValue: [1, 2, 3, 4, 5, 6, 7]
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
  },
  settleAccountName: {
    type: DataTypes.STRING(100),
    comment: '结算账户名称'
  },
  settleBankName: {
    type: DataTypes.STRING(100),
    comment: '结算开户银行'
  },
  settleBankAccount: {
    type: DataTypes.STRING(50),
    comment: '结算银行账号'
  },
  settleBankBranch: {
    type: DataTypes.STRING(100),
    comment: '结算开户支行'
  },
  settleBankCode: {
    type: DataTypes.STRING(20),
    comment: '银行联行号'
  },
  settleAlipayAccount: {
    type: DataTypes.STRING(100),
    comment: '支付宝结算账号'
  },
  settleWechatAccount: {
    type: DataTypes.STRING(100),
    comment: '微信结算账号'
  },
  settleCycle: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '结算周期: 1-日结, 2-周结, 3-半月结, 4-月结, 5-季结'
  },
  settleThreshold: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 1000.00,
    comment: '结算起付金额'
  },
  commissionRate: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0.03,
    comment: '平台佣金比例'
  },
  depositAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    comment: '保证金金额'
  },
  depositStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '保证金状态: 0-未缴纳, 1-已缴纳, 2-部分缴纳, 3-已退还'
  },
  logoUrl: {
    type: DataTypes.STRING(255),
    comment: '商家Logo URL'
  },
  bannerUrl: {
    type: DataTypes.STRING(255),
    comment: '商家Banner URL'
  },
  publicIntroduction: {
    type: DataTypes.TEXT,
    comment: '商家简介-对外展示'
  },
  internalRemark: {
    type: DataTypes.TEXT,
    comment: '内部备注-仅运营可见'
  },
  publicNotice: {
    type: DataTypes.TEXT,
    comment: '公示公告信息'
  },
  operationMode: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '运营模式: 1-自营, 2-联营, 3-纯佣金'
  },
  cooperationStartDate: {
    type: DataTypes.DATE,
    comment: '合作开始日期'
  },
  cooperationEndDate: {
    type: DataTypes.DATE,
    comment: '合作到期日期'
  },
  contractNo: {
    type: DataTypes.STRING(50),
    comment: '合同编号'
  },
  salesManager: {
    type: DataTypes.STRING(50),
    comment: '销售对接人'
  },
  operationManager: {
    type: DataTypes.STRING(50),
    comment: '运营对接人'
  },
  financeManager: {
    type: DataTypes.STRING(50),
    comment: '财务对接人'
  },
  orderCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '历史订单总数'
  },
  orderAmount: {
    type: DataTypes.DECIMAL(15, 2),
    defaultValue: 0.00,
    comment: '历史交易总额'
  },
  refundCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '退款订单数'
  },
  refundRate: {
    type: DataTypes.DECIMAL(5, 4),
    defaultValue: 0.00,
    comment: '退款率'
  },
  complaintCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '投诉次数'
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
  lockReason: {
    type: DataTypes.STRING(500),
    comment: '锁定原因'
  },
  lockTime: {
    type: DataTypes.DATE,
    comment: '锁定时间'
  },
  unlockTime: {
    type: DataTypes.DATE,
    comment: '预计解锁时间'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    comment: '最后操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    comment: '最后操作人姓名'
  },
  infoUpdateTime: {
    type: DataTypes.DATE,
    comment: '信息最后更新时间'
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

Merchant.hasMany(MerchantInfoChangeLog, {
  foreignKey: 'merchantId',
  as: 'infoChangeLogs'
});

MerchantInfoChangeLog.belongsTo(Merchant, {
  foreignKey: 'merchantId',
  as: 'merchant'
});

module.exports = Merchant;

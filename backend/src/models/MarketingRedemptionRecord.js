const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const MarketingRedemptionRecord = sequelize.define('MarketingRedemptionRecord', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '关联活动ID'
  },
  campaignName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '活动名称快照'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  userPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '用户手机号'
  },
  userLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '用户等级 1普通-5钻石'
  },
  orderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '关联订单号'
  },
  couponId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联优惠券ID'
  },
  redemptionCode: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '核销码/券码'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '核销状态：0待核销 1自动通过 2人工复核中 3已驳回 4已撤销 5已核销'
  },
  auditLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '审核层级：0待判定 1自动审核 2人工复核'
  },
  violationType: {
    type: DataTypes.STRING(30),
    defaultValue: 'none',
    comment: '违规类型：none/duplicate/fake/cross_scenario/expired/unqualified/over_limit'
  },
  complianceChecks: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '合规校验明细 [{type,name,passed,message,detail}]'
  },
  complianceScore: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '合规评分 0-100'
  },
  scene: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '核销场景：1新人礼 2节日礼 3出行补贴 4召回福利'
  },
  vehicleType: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '核销时车型'
  },
  city: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '核销时城市'
  },
  redemptionAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '核销金额（补贴金额）'
  },
  orderAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '核销关联订单金额'
  },
  benefitStartTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '权益生效时间'
  },
  benefitEndTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '权益失效时间'
  },
  auditRemark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '审核备注'
  },
  auditorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '审核人ID'
  },
  auditorName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '审核人姓名'
  },
  auditAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间'
  },
  rejectReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '驳回原因'
  },
  participateId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联参与记录ID'
  },
  participateTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '用户参与时间'
  },
  receiveTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '用户领取时间'
  },
  redemptionTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '用户核销时间'
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '核销时IP地址'
  },
  deviceId: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '核销时设备指纹'
  },
  isRevocable: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '是否可撤销：0否 1是'
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '撤销时间'
  },
  revokerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '撤销人ID'
  },
  revokerName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '撤销人姓名'
  },
  revokeReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '撤销原因'
  }
}, {
  tableName: 'biz_marketing_redemption',
  comment: '营销权益核销记录表',
  indexes: [
    { fields: ['campaignId'] },
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['violationType'] },
    { fields: ['auditLevel'] },
    { fields: ['redemptionCode'] },
    { fields: ['orderId'] },
    { fields: ['redemptionTime'] },
    { fields: ['scene'] }
  ]
})

module.exports = MarketingRedemptionRecord

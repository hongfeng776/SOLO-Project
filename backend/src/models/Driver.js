const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Driver = sequelize.define('Driver', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '司机姓名'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '手机号码'
  },
  idCard: {
    type: DataTypes.STRING(18),
    allowNull: true,
    comment: '身份证号'
  },
  idCardImg: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '身份证照片'
  },
  idCardValidDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '身份证有效期'
  },
  avatar: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '头像'
  },
  driverLicenseNo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '驾驶证号'
  },
  driverLicenseImg: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '驾驶证照片'
  },
  driverLicenseValidDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '驾驶证有效期'
  },
  driverLicenseType: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '驾驶证类型'
  },
  vehicleLicenseNo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '行驶证号'
  },
  vehicleLicenseImg: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '行驶证照片'
  },
  vehicleLicenseValidDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '行驶证有效期'
  },
  faceImg: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '人脸照片'
  },
  faceVerifyResult: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '人脸核验结果：0未核验 1核验通过 2核验不通过'
  },
  faceVerifyScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: '人脸核验相似度分数'
  },
  criminalRecordImg: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '无违法犯罪记录证明'
  },
  criminalRecordValidDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '无违法犯罪记录证明有效期'
  },
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '入驻城市'
  },
  vehicleType: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '车型类别'
  },
  driverLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '司机等级：1新手 2老司机'
  },
  reputationScore: {
    type: DataTypes.INTEGER,
    defaultValue: 80,
    comment: '信誉分数'
  },
  reputationLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    comment: '信誉等级：1低信誉 2中信誉 3高信誉'
  },
  canAcceptOrder: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否可接单：0否 1是'
  },
  isUrgent: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否加急审核：0否 1是'
  },
  qualificationStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '资质校验状态：0未校验 1校验通过 2校验不通过'
  },
  qualificationResult: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '资质校验结果详情'
  },
  uploadProgress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '资料上传进度百分比'
  },
  violationPoints: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '违规点位标注'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '账号状态：0正常 1限制接单 2临时封禁 3永久封禁'
  },
  accountRiskLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    comment: '账号风险等级：1低风险 2中风险 3高风险'
  },
  violationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '违规次数'
  },
  complaintCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '投诉次数'
  },
  complaintRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '投诉率（%）'
  },
  serviceScore: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.0,
    comment: '服务评分'
  },
  onlineHours: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    comment: '累计在线时长（小时）'
  },
  todayOnlineHours: {
    type: DataTypes.DECIMAL(6, 2),
    defaultValue: 0,
    comment: '今日在线时长（小时）'
  },
  trafficWeight: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 1.0,
    comment: '流量分配权重'
  },
  canWithdraw: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '提现权限：0否 1是'
  },
  canGoOnline: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '上线权限：0否 1是'
  },
  statusBanReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封禁原因'
  },
  statusBanStartTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '封禁开始时间'
  },
  statusBanEndTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '封禁结束时间'
  },
  abnormalStatusAlert: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '异常状态告警：0否 1是'
  },
  abnormalStatusReason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '异常状态原因'
  },
  auditStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '审核状态：0待审核 1已通过 2已拒绝 3审核异常 4资质过期 5待复核'
  },
  auditRemark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '审核备注'
  },
  auditTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间'
  },
  auditorId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '审核人ID'
  },
  totalOrders: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总订单数'
  },
  totalIncome: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '总收入'
  },
  balance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '账户余额'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.0,
    comment: '评分'
  },
  vehicleId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '绑定车辆ID'
  },
  registerTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '注册时间'
  }
}, {
  tableName: 'biz_driver',
  comment: '司机表',
  indexes: [
    { fields: ['phone'] },
    { fields: ['status'] },
    { fields: ['auditStatus'] },
    { fields: ['city'] },
    { fields: ['reputationLevel'] },
    { fields: ['qualificationStatus'] },
    { fields: ['accountRiskLevel'] },
    { fields: ['serviceScore'] },
    { fields: ['complaintRate'] },
    { fields: ['violationCount'] }
  ]
})

module.exports = Driver

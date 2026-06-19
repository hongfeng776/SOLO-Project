const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  plateNumber: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    comment: '车牌号'
  },
  vin: {
    type: DataTypes.STRING(17),
    allowNull: true,
    unique: true,
    comment: '车架号（车辆识别代码）'
  },
  engineNo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '发动机号'
  },
  brand: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '品牌'
  },
  model: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '型号'
  },
  color: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '颜色'
  },
  capacityType: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '运力类型：1快车 2专车 3豪华车 4拼车 5出租车'
  },
  seats: {
    type: DataTypes.INTEGER,
    defaultValue: 5,
    comment: '座位数'
  },
  displacement: {
    type: DataTypes.DECIMAL(3, 1),
    allowNull: true,
    comment: '排量（L）'
  },
  emissionStandard: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '排放标准：1国一 2国二 3国三 4国四 5国五 6国六'
  },
  vehicleType: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '车辆类型：轿车 SUV 面包车 货车'
  },
  vehicleImg: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '车辆照片'
  },
  drivingLicenseImg: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '行驶证照片'
  },
  insuranceImg: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '保险单照片'
  },
  inspectionImg: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '年检合格标志照片'
  },
  registrationDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '注册日期'
  },
  inspectionDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '年检有效期'
  },
  insuranceDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '保险有效期'
  },
  drivingLicenseDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '行驶证有效期'
  },
  operationLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 3,
    comment: '运营等级：1S级 2A级 3B级 4C级'
  },
  orderScope: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '接单范围配置'
  },
  premiumPermission: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '溢价权限（%）'
  },
  operationTimeLimit: {
    type: DataTypes.INTEGER,
    defaultValue: 12,
    comment: '运营时效（小时/天）'
  },
  operationStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '运营状态：1正常运营 2停运检修 3证件过期 4违规封禁'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态：0空闲 1运营中 2维修中 3已报废 4已锁定'
  },
  mileage: {
    type: DataTypes.DECIMAL(10, 1),
    defaultValue: 0,
    comment: '行驶里程（km）'
  },
  maintenanceCycle: {
    type: DataTypes.INTEGER,
    defaultValue: 50000,
    comment: '检修周期（km）'
  },
  lastMaintenanceMileage: {
    type: DataTypes.DECIMAL(10, 1),
    defaultValue: 0,
    comment: '上次检修时里程（km）'
  },
  lastMaintenanceDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '上次检修日期'
  },
  nextMaintenanceDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '下次检修日期'
  },
  violationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '违规次数'
  },
  bannedType: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '封禁类型：0未封禁 1临时封禁 2永久封禁'
  },
  bannedReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '封禁原因'
  },
  bannedExpireDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '临时封禁到期日期'
  },
  currentLatitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '当前纬度'
  },
  currentLongitude: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: true,
    comment: '当前经度'
  },
  lastLocationTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后定位时间'
  },
  maintenanceWarningLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '检修预警等级：0无预警 1临近 2紧急 3过期'
  },
  complianceLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '合规等级：0未评定 1A级 2B级 3C级 4D级'
  },
  complianceScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '合规评分'
  },
  complianceStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '合规状态：1合规 2待校验 3已预警 4已锁定'
  },
  lastComplianceCheckDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '上次合规校验日期'
  },
  nextComplianceCheckDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '下次合规校验日期'
  },
  complianceCheckCycle: {
    type: DataTypes.INTEGER,
    defaultValue: 30,
    comment: '合规校验周期(天)'
  },
  complianceTags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '合规标签列表'
  },
  complianceRiskCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '合规风险项数量'
  },
  rectificationCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '待整改数量'
  },
  lastInsuranceCheckDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '上次保险校验日期'
  },
  lastInspectionCheckDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '上次年检校验日期'
  },
  lastViolationCheckDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '上次违章校验日期'
  },
  trafficDataMatchRate: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 100,
    comment: '交管数据匹配率(%)'
  },
  trafficDataSyncTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '交管数据同步时间'
  },
  complianceWarning: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '合规预警：0无预警 1临近校验 2校验超期 3合规风险'
  },
  fakeComplianceDetected: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '虚假合规检测：0未检测 1疑似虚假 2已确认虚假'
  },
  missedCheckCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '漏审次数'
  },
  cityTier: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    comment: '城市分级：1一线城市 2二线城市 3三线及以下'
  },
  auditStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '审核状态：0待审核 1已备案 2已驳回 3已过期'
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
  city: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '备案城市'
  },
  isLocked: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否锁定：0否 1是'
  },
  lockReason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '锁定原因'
  },
  validationResult: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '校验结果详情'
  },
  riskLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    comment: '风险等级：1低风险 2中风险 3高风险'
  },
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '绑定司机ID'
  },
  driverName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '绑定司机姓名'
  },
  ownerName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '车主姓名'
  },
  ownerIdCard: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '车主身份证号'
  },
  ownerPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '车主联系电话'
  },
  manufactureDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '出厂日期'
  },
  totalScore: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '运营等级综合得分'
  },
  trafficDataVerified: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '交管数据核验：0未核验 1核验一致 2核验不一致'
  }
}, {
  tableName: 'biz_vehicle',
  comment: '车辆表',
  indexes: [
    { fields: ['plateNumber'] },
    { fields: ['vin'] },
    { fields: ['status'] },
    { fields: ['auditStatus'] },
    { fields: ['capacityType'] },
    { fields: ['operationLevel'] },
    { fields: ['city'] },
    { fields: ['isLocked'] },
    { fields: ['operationStatus'] },
    { fields: ['bannedType'] },
    { fields: ['maintenanceWarningLevel'] },
    { fields: ['complianceLevel'] },
    { fields: ['complianceStatus'] },
    { fields: ['complianceWarning'] },
    { fields: ['cityTier'] },
    { fields: ['nextComplianceCheckDate'] },
    { fields: ['fakeComplianceDetected'] }
  ]
})

module.exports = Vehicle

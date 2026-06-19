const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const VehicleComplianceCheck = sequelize.define('VehicleComplianceCheck', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  vehicleId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '车辆ID'
  },
  plateNumber: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '车牌号'
  },
  vin: {
    type: DataTypes.STRING(17),
    allowNull: true,
    comment: '车架号'
  },
  checkType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '校验类型：1保险校验 2年检校验 3违章校验 4综合校验'
  },
  checkLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    allowNull: true,
    comment: '校验等级：1常规校验 2严格校验 3深度校验'
  },
  checkStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
    comment: '校验状态：0待校验 1校验中 2校验通过 3校验不通过 4校验异常'
  },
  complianceLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
    comment: '合规等级：0未评定 1A级(优秀) 2B级(良好) 3C级(合格) 4D级(不合格)'
  },
  cityTier: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    allowNull: true,
    comment: '城市分级：1一线城市 2二线城市 3三线及以下'
  },
  checkPeriodDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '校验周期(天)'
  },
  insuranceCheck: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '保险校验结果'
  },
  inspectionCheck: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '年检校验结果'
  },
  violationCheck: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '违章校验结果'
  },
  parameterCheck: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '参数校验结果'
  },
  dataComparison: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '平台与交管数据比对结果'
  },
  abnormalItems: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '异常项列表'
  },
  highlightedFields: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '高亮异常字段列表'
  },
  trafficDataVerified: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
    comment: '交管数据核验：0未核验 1核验一致 2核验不一致'
  },
  checkScore: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: '校验得分'
  },
  checkRemark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '校验备注'
  },
  checkStartTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '校验开始时间'
  },
  checkEndTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '校验完成时间'
  },
  isAsync: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
    comment: '是否异步：0否 1是'
  },
  asyncTaskId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '异步任务ID'
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
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'biz_vehicle_compliance_check',
  comment: '车辆合规校验记录表',
  indexes: [
    { fields: ['vehicleId'] },
    { fields: ['checkType'] },
    { fields: ['checkStatus'] },
    { fields: ['complianceLevel'] },
    { fields: ['cityTier'] },
    { fields: ['checkStartTime'] }
  ]
})

module.exports = VehicleComplianceCheck

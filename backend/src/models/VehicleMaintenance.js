const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const VehicleMaintenance = sequelize.define('VehicleMaintenance', {
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
  maintenanceType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '检修类型：1常规保养 2年检 3大修 4事故维修 5更换零件'
  },
  maintenanceStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
    comment: '检修状态：0待检修 1检修中 2已完成 3已取消'
  },
  mileageAtMaintenance: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: true,
    comment: '检修时里程数'
  },
  maintenanceItems: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '检修项目列表'
  },
  maintenanceCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '检修费用'
  },
  maintenanceStation: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '检修站点'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '检修开始日期'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '检修完成日期'
  },
  nextMaintenanceDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '下次检修日期'
  },
  nextMaintenanceMileage: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: true,
    comment: '下次检修里程'
  },
  result: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '检修结果描述'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
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
  priority: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    allowNull: true,
    comment: '检修优先级：1紧急 2一般 3低优先'
  },
  faultCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: true,
    comment: '故障次数'
  },
  faultDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '故障描述'
  },
  faultCategory: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '故障分类：1发动机 2变速箱 3制动系统 4电气系统 5悬挂系统 6车身 7其他'
  },
  rectificationResult: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '整改结果'
  },
  ledgerNo: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '检修台账编号'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
    comment: '是否异常：0否 1疑似虚假检修 2漏检 3错检'
  },
  abnormalDescription: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '异常描述'
  },
  verifiedBy: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '核验人'
  },
  verifiedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '核验时间'
  },
  isVerified: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
    comment: '是否已核验：0未核验 1已核验'
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '预约检修日期'
  },
  partsReplaced: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '更换零件列表'
  },
  laborCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '工时费'
  },
  partsCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '配件费'
  },
  otherCost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '其他费用'
  },
  mileageThreshold: {
    type: DataTypes.DECIMAL(10, 1),
    allowNull: true,
    comment: '录入时里程阈值'
  },
  lastMaintenanceTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '上次检修时间（录入时快照）'
  },
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '审核人ID'
  },
  reviewerName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '审核人姓名'
  },
  reviewTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间'
  },
  reviewRemark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '审核备注'
  },
  updateTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '更新时间'
  },
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'biz_vehicle_maintenance',
  comment: '车辆检修记录表',
  indexes: [
    { fields: ['vehicleId'] },
    { fields: ['maintenanceType'] },
    { fields: ['maintenanceStatus'] },
    { fields: ['startDate'] },
    { fields: ['priority'] },
    { fields: ['faultCategory'] },
    { fields: ['isAbnormal'] },
    { fields: ['isVerified'] },
    { fields: ['scheduledDate'] },
    { fields: ['ledgerNo'] }
  ]
})

module.exports = VehicleMaintenance

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
    { fields: ['startDate'] }
  ]
})

module.exports = VehicleMaintenance

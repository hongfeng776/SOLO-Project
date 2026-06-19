const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const VehicleViolation = sequelize.define('VehicleViolation', {
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
  driverId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '司机ID'
  },
  driverName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '司机姓名'
  },
  violationType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '违规类型：1超速 2违规接单 3虚假运营 4拒载 5绕路 6其他'
  },
  violationLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    allowNull: true,
    comment: '违规等级：1轻微 2一般 3严重'
  },
  violationStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
    comment: '处理状态：0待处理 1处理中 2已处理 3已申诉'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '违规描述'
  },
  evidence: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '违规证据'
  },
  penaltyType: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '处罚类型：1警告 2罚款 3暂停运营 4临时封禁 5永久封禁'
  },
  penaltyAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '罚款金额'
  },
  penaltyDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '封禁天数'
  },
  penaltyStartDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处罚开始日期'
  },
  penaltyEndDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '处罚结束日期'
  },
  appealReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '申诉理由'
  },
  appealResult: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '申诉结果'
  },
  appealTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '申诉时间'
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
  tableName: 'biz_vehicle_violation',
  comment: '车辆违规记录表',
  indexes: [
    { fields: ['vehicleId'] },
    { fields: ['driverId'] },
    { fields: ['violationType'] },
    { fields: ['violationLevel'] },
    { fields: ['violationStatus'] }
  ]
})

module.exports = VehicleViolation

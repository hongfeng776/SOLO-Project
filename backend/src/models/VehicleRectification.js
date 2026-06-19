const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const VehicleRectification = sequelize.define('VehicleRectification', {
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
  checkId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '关联校验记录ID'
  },
  rectificationType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '整改类型：1保险整改 2年检整改 3违章整改 4参数整改 5综合整改'
  },
  rectificationStatus: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    allowNull: true,
    comment: '整改状态：0待整改 1整改中 2已整改 3已复核 4已驳回'
  },
  violationType: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '违规类型'
  },
  violationDescription: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '违规描述'
  },
  violationEvidence: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '违规证据'
  },
  rectificationDeadline: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '整改截止日期'
  },
  rectificationContent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '整改内容'
  },
  rectificationEvidence: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '整改证据'
  },
  rectificationRemark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '整改备注'
  },
  reviewResult: {
    type: DataTypes.TINYINT,
    allowNull: true,
    comment: '复核结果：1通过 2驳回'
  },
  reviewRemark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '复核备注'
  },
  rectificationDays: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '整改用时(天)'
  },
  remindCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: true,
    comment: '提醒次数'
  },
  lastRemindTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后提醒时间'
  },
  penaltyAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: '处罚金额'
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
  reviewerId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '复核人ID'
  },
  reviewerName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '复核人姓名'
  },
  createTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: '创建时间'
  }
}, {
  tableName: 'biz_vehicle_rectification',
  comment: '车辆整改记录表',
  indexes: [
    { fields: ['vehicleId'] },
    { fields: ['checkId'] },
    { fields: ['rectificationType'] },
    { fields: ['rectificationStatus'] },
    { fields: ['rectificationDeadline'] }
  ]
})

module.exports = VehicleRectification

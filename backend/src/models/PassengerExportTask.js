const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const PassengerExportTask = sequelize.define('PassengerExportTask', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskNo: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '任务编号'
  },
  taskName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '任务名称'
  },
  exportType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '导出类型：travel_records-出行记录 risk_records-风险记录 passenger_info-乘客信息'
  },
  creatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '创建人ID'
  },
  creatorName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '创建人姓名'
  },
  filterConditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '筛选条件'
  },
  selectedIds: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '选中的乘客ID列表'
  },
  sortRules: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '排序规则：[{field, order}]'
  },
  exportFields: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '导出字段列表'
  },
  desensitizeConfig: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '脱敏配置：{phone, idCard, name, address}'
  },
  totalCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总记录数'
  },
  exportedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已导出记录数'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态：0待处理 1处理中 2已完成 3已失败 4已取消'
  },
  progress: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '进度百分比：0-100'
  },
  filePath: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '导出文件路径'
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '文件名'
  },
  fileSize: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '文件大小(bytes)'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '错误信息'
  },
  expireTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '文件过期时间'
  },
  startTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '开始时间'
  },
  endTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '结束时间'
  }
}, {
  tableName: 'biz_passenger_export_task',
  comment: '乘客数据导出任务表',
  indexes: [
    { fields: ['taskNo'] },
    { fields: ['creatorId'] },
    { fields: ['exportType'] },
    { fields: ['status'] },
    { fields: ['createTime'] }
  ]
})

module.exports = PassengerExportTask

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
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作人姓名'
  },
  exportType: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '导出类型：1出行行为 2风险记录 3用户画像'
  },
  filterParams: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '筛选参数'
  },
  sortRules: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '排序规则'
  },
  fieldList: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '导出字段列表'
  },
  isDesensitized: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: '是否脱敏'
  },
  desensitizeRules: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '脱敏规则'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '状态：0待处理 1处理中 2已完成 3已失败'
  },
  totalCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '总记录数'
  },
  exportedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '已导出数'
  },
  failedCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '失败数'
  },
  filePath: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '文件路径'
  },
  fileName: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '文件名'
  },
  fileSize: {
    type: DataTypes.BIGINT,
    defaultValue: 0,
    comment: '文件大小(字节)'
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '错误信息'
  },
  expireTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期时间'
  }
}, {
  tableName: 'biz_passenger_export_task',
  comment: '乘客数据导出任务表',
  indexes: [
    { fields: ['taskNo'] },
    { fields: ['operatorId'] },
    { fields: ['status'] },
    { fields: ['exportType'] },
    { fields: ['createTime'] }
  ]
})

module.exports = PassengerExportTask

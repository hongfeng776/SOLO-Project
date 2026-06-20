const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const FilterEditLog = sequelize.define(
  'FilterEditLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID'
    },
    filterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '滤镜ID'
    },
    filterCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '滤镜编码'
    },
    filterName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '滤镜名称'
    },
    editStep: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      comment: '编辑步骤'
    },
    changeType: {
      type: DataTypes.ENUM('create', 'edit', 'edit_limited', 'status_change', 'status_blocked', 'batch_submit', 'trace_verify', 'batch_status', 'status_hf_blocked'),
      allowNull: false,
      comment: '变更类型(status_blocked=前置拦截,status_hf_blocked=高频拦截)'
    },
    changedFields: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('changedFields')
        try {
          return rawValue ? JSON.parse(rawValue) : []
        } catch {
          return []
        }
      },
      set(val) {
        this.setDataValue('changedFields', val ? JSON.stringify(val) : '[]')
      },
      comment: '变更字段列表(JSON)'
    },
    beforeData: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('beforeData')
        try {
          return rawValue ? JSON.parse(rawValue) : null
        } catch {
          return null
        }
      },
      set(val) {
        this.setDataValue('beforeData', val ? JSON.stringify(val) : null)
      },
      comment: '变更前数据(JSON)'
    },
    afterData: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('afterData')
        try {
          return rawValue ? JSON.parse(rawValue) : null
        } catch {
          return null
        }
      },
      set(val) {
        this.setDataValue('afterData', val ? JSON.stringify(val) : null)
      },
      comment: '变更后数据(JSON)'
    },
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作人名称'
    },
    operatorRole: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作人角色'
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP地址'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '操作原因'
    },
    batchId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '批量操作批次ID'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    }
  },
  {
    tableName: 'filter_edit_logs',
    comment: '滤镜编辑日志表',
    indexes: [
      { fields: ['filterId'] },
      { fields: ['filterCode'] },
      { fields: ['changeType'] },
      { fields: ['operatorId'] },
      { fields: ['batchId'] },
      { fields: ['filterId', 'createdAt'] }
    ]
  }
)

module.exports = FilterEditLog

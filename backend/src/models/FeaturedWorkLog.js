const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const FeaturedWorkLog = sequelize.define(
  'FeaturedWorkLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID'
    },
    featuredId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '收录记录ID'
    },
    featuredCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '收录编号'
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资源ID'
    },
    resourceTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '资源标题'
    },
    resourceType: {
      type: DataTypes.ENUM('image', 'video', 'audio', 'template'),
      allowNull: false,
      comment: '资源类型'
    },
    operationType: {
      type: DataTypes.ENUM(
        'pre_validate',
        'verify_pass',
        'verify_reject',
        'featured',
        'adjust_weight',
        'adjust_position',
        'adjust_level',
        'cancel_featured',
        'batch_featured',
        'batch_cancel',
        'trace_verify',
        'auto_expire',
        'compliance_recheck',
        'quality_recheck'
      ),
      allowNull: false,
      comment: '操作类型'
    },
    beforeStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作前状态'
    },
    afterStatus: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作后状态'
    },
    beforeWeight: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作前权重'
    },
    afterWeight: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作后权重'
    },
    beforeLevel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作前等级'
    },
    afterLevel: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作后等级'
    },
    beforePosition: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作前展示位置'
    },
    afterPosition: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作后展示位置'
    },
    changeFields: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '变更字段列表'
    },
    beforeData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '操作前快照'
    },
    afterData: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '操作后快照'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '操作原因/说明'
    },
    verifyBasis: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '核验依据详情'
    },
    validationResult: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '校验结果详情'
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
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作IP'
    },
    batchId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '批量操作ID'
    },
    step: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      comment: '步骤序号'
    },
    duration: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '操作耗时(毫秒)'
    },
    result: {
      type: DataTypes.ENUM('success', 'fail', 'warning', 'blocked', 'filtered'),
      defaultValue: 'success',
      allowNull: false,
      comment: '操作结果'
    },
    failReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '失败/拦截原因'
    },
    warnings: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '警告信息列表'
    },
    traceId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '操作追踪ID'
    },
    riskLevel: {
      type: DataTypes.ENUM('none', 'low', 'medium', 'high', 'critical'),
      defaultValue: 'none',
      allowNull: false,
      comment: '风险等级'
    },
    recheckIssues: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '复核检出问题列表'
    }
  },
  {
    tableName: 'featured_work_logs',
    comment: '作品收录操作日志表',
    indexes: [
      { fields: ['featuredId'] },
      { fields: ['resourceId'] },
      { fields: ['operationType'] },
      { fields: ['operatorId'] },
      { fields: ['batchId'] },
      { fields: ['result'] },
      { fields: ['createdAt'] },
      { fields: ['featuredId', 'operationType'] },
      { fields: ['resourceId', 'createdAt'] }
    ]
  }
)

module.exports = FeaturedWorkLog

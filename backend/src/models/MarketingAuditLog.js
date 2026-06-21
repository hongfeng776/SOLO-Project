const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const MarketingAuditLog = sequelize.define('MarketingAuditLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  campaignId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '营销活动ID'
  },
  campaignName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '活动名称'
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作类型：create创建 update修改 online上线 offline下线 copy复制 delete删除 validate校验'
  },
  actionDetail: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '操作详情描述'
  },
  operatorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '操作人ID'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作人昵称'
  },
  beforeData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '修改前数据'
  },
  afterData: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '修改后数据'
  },
  diffFields: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '变更字段列表'
  },
  validateResult: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '校验结果（含拦截原因）'
  },
  ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作IP地址'
  },
  riskLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '风险等级：0正常 1低风险 2中风险 3高风险（拦截）'
  },
  remark: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '备注'
  }
}, {
  tableName: 'biz_marketing_audit_log',
  comment: '营销活动操作审计日志表',
  indexes: [
    { fields: ['campaignId'] },
    { fields: ['action'] },
    { fields: ['operatorId'] },
    { fields: ['riskLevel'] },
    { fields: ['createTime'] }
  ]
})

module.exports = MarketingAuditLog

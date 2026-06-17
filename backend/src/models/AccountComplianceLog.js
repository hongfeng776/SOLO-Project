const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const AccountComplianceLog = sequelize.define(
  'AccountComplianceLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '合规校验记录ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '关联用户ID'
    },
    uid: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: '用户UID'
    },
    checkType: {
      type: DataTypes.ENUM('create', 'edit', 'trace', 'batch', 'manual'),
      allowNull: false,
      comment: '校验类型: create-创建 edit-编辑 trace-溯源 batch-批量 manual-手动'
    },
    checkResult: {
      type: DataTypes.ENUM('pass', 'fail', 'warning'),
      allowNull: false,
      comment: '校验结果: pass-通过 fail-不通过 warning-警告'
    },
    checkItems: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '校验项详情'
    },
    inconsistencies: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      comment: '不一致项列表'
    },
    operatorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作人ID'
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作人用户名'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    }
  },
  {
    tableName: 'account_compliance_logs',
    comment: '账号合规校验记录表',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['uid'] },
      { fields: ['checkType'] },
      { fields: ['checkResult'] },
      { fields: ['createdAt'] }
    ]
  }
)

module.exports = AccountComplianceLog

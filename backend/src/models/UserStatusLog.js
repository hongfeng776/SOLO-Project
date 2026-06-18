const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const UserStatusLog = sequelize.define(
  'UserStatusLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '状态变更日志ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    uid: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: '用户UID'
    },
    oldStatus: {
      type: DataTypes.ENUM('active', 'frozen', 'temp_banned', 'permanent_banned'),
      allowNull: true,
      comment: '原状态'
    },
    newStatus: {
      type: DataTypes.ENUM('active', 'frozen', 'temp_banned', 'permanent_banned'),
      allowNull: false,
      comment: '新状态'
    },
    statusExpireAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '状态到期时间'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '变更原因'
    },
    linkedViolationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '关联违规记录ID'
    },
    linkedAppealId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '关联申诉ID'
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
    operatorRole: {
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: '操作人角色'
    },
    syncPermissions: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '同步的权限变更详情'
    },
    changeType: {
      type: DataTypes.ENUM('manual', 'auto_expire', 'auto_appeal', 'batch'),
      defaultValue: 'manual',
      allowNull: false,
      comment: '变更类型: manual-手动 auto_expire-自动到期 auto_appeal-申诉通过 batch-批量'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作IP'
    },
    batchId: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: '批量操作ID'
    }
  },
  {
    tableName: 'user_status_logs',
    comment: '用户状态变更历史日志表',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['uid'] },
      { fields: ['oldStatus'] },
      { fields: ['newStatus'] },
      { fields: ['operatorId'] },
      { fields: ['changeType'] },
      { fields: ['batchId'] },
      { fields: ['createdAt'] }
    ]
  }
)

module.exports = UserStatusLog

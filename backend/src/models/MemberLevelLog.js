const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const MemberLevelLog = sequelize.define(
  'MemberLevelLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '用户ID'
    },
    uid: {
      type: DataTypes.STRING(32),
      allowNull: false,
      comment: '用户UID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '用户名'
    },
    oldLevel: {
      type: DataTypes.ENUM('normal', 'bronze', 'silver', 'gold', 'platinum'),
      allowNull: true,
      comment: '原层级'
    },
    newLevel: {
      type: DataTypes.ENUM('normal', 'bronze', 'silver', 'gold', 'platinum'),
      allowNull: false,
      comment: '新层级'
    },
    oldDisplayLevel: {
      type: DataTypes.ENUM('normal', 'vip', 'premium_vip'),
      allowNull: true,
      comment: '原显示层级(3级语义)'
    },
    newDisplayLevel: {
      type: DataTypes.ENUM('normal', 'vip', 'premium_vip'),
      allowNull: false,
      comment: '新显示层级(3级语义)'
    },
    changeType: {
      type: DataTypes.ENUM('upgrade', 'downgrade', 'manual'),
      defaultValue: 'manual',
      allowNull: false,
      comment: '变更类型: upgrade-升级 downgrade-降级 manual-手动'
    },
    criteriaSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '达标校验快照: {totalConsume, totalActiveHours, totalCreateCount}'
    },
    criteriaResult: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '达标校验结果: {consumePass, activePass, createPass, allPass, missing}'
    },
    unlockedBenefits: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
      comment: '解锁权益列表'
    },
    recoveredBenefits: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
      comment: '回收权益列表'
    },
    autoSyncedTags: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
      comment: '自动同步的用户标签'
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
      type: DataTypes.STRING(30),
      allowNull: true,
      comment: '操作人角色'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '变更原因'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作IP'
    }
  },
  {
    tableName: 'member_level_logs',
    comment: '会员层级变更日志表'
  }
)

module.exports = MemberLevelLog

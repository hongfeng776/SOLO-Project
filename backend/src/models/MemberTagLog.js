const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const MemberTagLog = sequelize.define(
  'MemberTagLog',
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
    changeType: {
      type: DataTypes.ENUM('add', 'remove', 'replace', 'batch_add', 'batch_remove', 'auto_clean', 'auto_sync'),
      defaultValue: 'add',
      allowNull: false,
      comment: '变更类型'
    },
    oldTags: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
      comment: '变更前标签数组'
    },
    newTags: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
      comment: '变更后标签数组'
    },
    addedTags: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
      comment: '新增的标签'
    },
    removedTags: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
      comment: '移除的标签'
    },
    matchValidation: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: '标签-用户匹配校验结果'
    },
    duplicates: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
      comment: '重复标签拦截列表'
    },
    mismatches: {
      type: DataTypes.JSON,
      defaultValue: [],
      allowNull: false,
      comment: '错配标签拦截列表'
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
    batchId: {
      type: DataTypes.STRING(32),
      allowNull: true,
      comment: '批量操作ID'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '操作原因'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作IP'
    }
  },
  {
    tableName: 'member_tag_logs',
    comment: '会员标签变更日志表'
  }
)

module.exports = MemberTagLog

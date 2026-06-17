const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const UserEditLog = sequelize.define(
  'UserEditLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '编辑日志ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '被编辑的用户ID'
    },
    editorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作人ID'
    },
    editorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作人用户名'
    },
    field: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '修改字段'
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '原值'
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '新值'
    },
    editStep: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '编辑步骤(分步编辑)'
    },
    verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否经过二次身份校验'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作IP'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    }
  },
  {
    tableName: 'user_edit_logs',
    comment: '用户编辑变更记录表',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['editorId'] },
      { fields: ['createdAt'] }
    ]
  }
)

module.exports = UserEditLog

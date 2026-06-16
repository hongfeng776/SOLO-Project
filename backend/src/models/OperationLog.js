const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const OperationLog = sequelize.define(
  'OperationLog',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '操作用户ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '操作用户名'
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作模块'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '操作动作'
    },
    target: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '操作目标'
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '目标ID'
    },
    detail: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '操作详情(JSON)'
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'IP地址'
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '浏览器UA'
    },
    result: {
      type: DataTypes.ENUM('success', 'fail'),
      defaultValue: 'success',
      allowNull: false,
      comment: '操作结果'
    }
  },
  {
    tableName: 'operation_logs',
    comment: '操作日志表',
    timestamps: true,
    updatedAt: false,
    indexes: [
      { fields: ['userId'] },
      { fields: ['module'] },
      { fields: ['action'] },
      { fields: ['createdAt'] }
    ]
  }
)

module.exports = OperationLog

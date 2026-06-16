const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Role = sequelize.define('Role', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '角色名称'
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '角色编码'
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '角色描述'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1启用 0禁用'
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  }
}, {
  tableName: 'sys_role',
  comment: '系统角色表'
})

module.exports = Role

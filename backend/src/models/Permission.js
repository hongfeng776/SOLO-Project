const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Permission = sequelize.define('Permission', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '权限ID'
  },
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '权限名称'
  },
  code: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    comment: '权限编码'
  },
  type: {
    type: DataTypes.ENUM('menu', 'button'),
    defaultValue: 'menu',
    comment: '权限类型：menu-菜单，button-按钮'
  },
  path: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '路由路径'
  },
  component: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '组件路径'
  },
  icon: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '图标'
  },
  sort: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '排序'
  },
  parent_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '父级权限ID'
  }
}, {
  tableName: 'permissions',
  comment: '权限表'
});

Permission.hasMany(Permission, {
  as: 'children',
  foreignKey: 'parent_id',
  sourceKey: 'id'
});

Permission.belongsTo(Permission, {
  as: 'parent',
  foreignKey: 'parent_id',
  targetKey: 'id'
});

module.exports = Permission;

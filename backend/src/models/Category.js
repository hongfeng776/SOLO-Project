const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const Category = sequelize.define(
  'Category',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '分类ID'
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '分类名称'
    },
    icon: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '分类图标'
    },
    type: {
      type: DataTypes.ENUM('image', 'video', 'template'),
      defaultValue: 'image',
      allowNull: false,
      comment: '分类类型'
    },
    parentId: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '父级分类ID'
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '排序'
    },
    status: {
      type: DataTypes.ENUM('active', 'disabled'),
      defaultValue: 'active',
      allowNull: false,
      comment: '状态'
    }
  },
  {
    tableName: 'categories',
    comment: '分类表'
  }
)

module.exports = Category

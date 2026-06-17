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
    },
    resourceCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '关联素材数量'
    },
    maxCapacity: {
      type: DataTypes.INTEGER,
      defaultValue: 1000,
      allowNull: false,
      comment: '最大容量'
    },
    tags: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '分类适配标签(逗号分隔)'
    },
    bindTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '最近绑定时间'
    },
    bindOperator: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '最近绑定操作人员'
    }
  },
  {
    tableName: 'categories',
    comment: '分类表',
    indexes: [
      { fields: ['parentId'] },
      { fields: ['type'] }
    ]
  }
)

module.exports = Category

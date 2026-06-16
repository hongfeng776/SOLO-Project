const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const Template = sequelize.define(
  'Template',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '模板ID'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '模板名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '模板描述'
    },
    coverUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '封面图URL'
    },
    previewUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '预览图URL'
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '文件URL'
    },
    fileSize: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: false,
      comment: '文件大小(字节)'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '分类ID'
    },
    categoryName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '分类名称'
    },
    tags: {
      type: DataTypes.STRING(500),
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('tags')
        return rawValue ? rawValue.split(',') : []
      },
      set(val) {
        if (Array.isArray(val)) {
          this.setDataValue('tags', val.join(','))
        } else {
          this.setDataValue('tags', val || '')
        }
      },
      comment: '标签(逗号分隔)'
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '价格'
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'published', 'offline'),
      defaultValue: 'draft',
      allowNull: false,
      comment: '状态'
    },
    useCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '使用次数'
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '作者ID'
    },
    authorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '作者名称'
    },
    software: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '适用软件'
    },
    version: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '版本号'
    }
  },
  {
    tableName: 'templates',
    comment: '模板表'
  }
)

module.exports = Template

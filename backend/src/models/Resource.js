const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const Resource = sequelize.define(
  'Resource',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '资源ID'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '资源标题'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '资源描述'
    },
    coverUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '封面图URL'
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '文件URL'
    },
    fileType: {
      type: DataTypes.ENUM('image', 'video', 'audio', 'template'),
      defaultValue: 'image',
      allowNull: false,
      comment: '文件类型'
    },
    fileSize: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: false,
      comment: '文件大小(字节)'
    },
    width: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '宽度(像素)'
    },
    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '高度(像素)'
    },
    duration: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '时长(秒)'
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'published', 'offline'),
      defaultValue: 'draft',
      allowNull: false,
      comment: '状态'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '分类ID'
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
    viewCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '浏览量'
    },
    downloadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '下载量'
    },
    likeCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '点赞数'
    },
    auditLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      allowNull: false,
      comment: '审核层级'
    },
    auditOpinion: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '审核意见'
    },
    violationCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '违规次数'
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否被风控拦截'
    },
    blockReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '风控拦截原因'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '发布时间'
    },
    offlineAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '下架时间'
    },
    offlineReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '下架原因'
    }
  },
  {
    tableName: 'resources',
    comment: '资源表',
    indexes: [
      { fields: ['status'] },
      { fields: ['categoryId'] },
      { fields: ['fileType'] },
      { fields: ['authorId'] },
      { fields: ['status', 'createdAt'] },
      { fields: ['status', 'fileType'] },
      { fields: ['authorId', 'status'] }
    ]
  }
)

module.exports = Resource

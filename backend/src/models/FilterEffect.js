const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const FilterEffect = sequelize.define(
  'FilterEffect',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '滤镜ID'
    },
    filterCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '滤镜编码(唯一)'
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '滤镜名称'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '介绍文案'
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
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '分类ID'
    },
    categoryName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '分类名称'
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      comment: '特效文件URL'
    },
    fileFormat: {
      type: DataTypes.ENUM('glsl', 'json', 'lut_3d', 'lut_1d', 'custom'),
      allowNull: false,
      defaultValue: 'glsl',
      comment: '文件格式'
    },
    fileSize: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
      allowNull: false,
      comment: '文件大小(字节)'
    },
    coverUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '预览封面URL'
    },
    previewUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '动态预览URL'
    },
    resolution: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: '分辨率(如1920x1080)'
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
    adaptScene: {
      type: DataTypes.STRING(200),
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('adaptScene')
        return rawValue ? rawValue.split(',') : []
      },
      set(val) {
        if (Array.isArray(val)) {
          this.setDataValue('adaptScene', val.join(','))
        } else {
          this.setDataValue('adaptScene', val || '')
        }
      },
      comment: '适配场景(逗号分隔)'
    },
    adaptDevice: {
      type: DataTypes.STRING(500),
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('adaptDevice')
        return rawValue ? rawValue.split(',') : []
      },
      set(val) {
        if (Array.isArray(val)) {
          this.setDataValue('adaptDevice', val.join(','))
        } else {
          this.setDataValue('adaptDevice', val || '')
        }
      },
      comment: '适配机型(逗号分隔)'
    },
    coreParams: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('coreParams')
        try {
          return rawValue ? JSON.parse(rawValue) : {}
        } catch {
          return {}
        }
      },
      set(val) {
        this.setDataValue('coreParams', val ? JSON.stringify(val) : '{}')
      },
      comment: '核心特效参数(JSON)'
    },
    sortWeight: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '展示权重'
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'approved', 'rejected', 'published', 'offline'),
      defaultValue: 'draft',
      allowNull: false,
      comment: '状态'
    },
    copyrightLicense: {
      type: DataTypes.STRING(200),
      allowNull: true,
      comment: '版权资质'
    },
    copyrightExpiredAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '版权过期时间'
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '素材来源'
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '录入人ID'
    },
    authorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '录入人名称'
    },
    integrityHash: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: '素材完整性哈希'
    },
    isCompliant: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: '版权是否合规'
    },
    complianceIssues: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('complianceIssues')
        try {
          return rawValue ? JSON.parse(rawValue) : []
        } catch {
          return []
        }
      },
      set(val) {
        this.setDataValue('complianceIssues', val ? JSON.stringify(val) : '[]')
      },
      comment: '合规问题列表(JSON)'
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '备注'
    },
    publishedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '上架时间'
    },
    offlineAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '下架时间'
    }
  },
  {
    tableName: 'filter_effects',
    comment: '特效滤镜表',
    indexes: [
      { fields: ['filterCode'], unique: true },
      { fields: ['status'] },
      { fields: ['categoryId'] },
      { fields: ['status', 'createdAt'] },
      { fields: ['sortWeight'] },
      { fields: ['authorId'] },
      { fields: ['fileFormat'] },
      { fields: ['name'] }
    ]
  }
)

module.exports = FilterEffect

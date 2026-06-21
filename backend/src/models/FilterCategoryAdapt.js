const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const FilterCategoryAdapt = sequelize.define(
  'FilterCategoryAdapt',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: 'ID'
    },
    filterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '滤镜ID'
    },
    filterCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '滤镜编码'
    },
    filterName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '滤镜名称'
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '分类ID'
    },
    categoryName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '分类名称'
    },
    adaptScore: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '适配度评分(0-100)'
    },
    adaptIssues: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('adaptIssues')
        try {
          return rawValue ? JSON.parse(rawValue) : []
        } catch {
          return []
        }
      },
      set(val) {
        this.setDataValue('adaptIssues', val ? JSON.stringify(val) : '[]')
      },
      comment: '适配问题列表(JSON)'
    },
    isMatched: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: '是否适配匹配'
    },
    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
      comment: '是否核心分类绑定'
    },
    filterScenes: {
      type: DataTypes.STRING(200),
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('filterScenes')
        return rawValue ? rawValue.split(',') : []
      },
      set(val) {
        if (Array.isArray(val)) {
          this.setDataValue('filterScenes', val.join(','))
        } else {
          this.setDataValue('filterScenes', val || '')
        }
      },
      comment: '滤镜适配场景'
    },
    categorySceneRule: {
      type: DataTypes.STRING(200),
      allowNull: true,
      get() {
        const rawValue = this.getDataValue('categorySceneRule')
        return rawValue ? rawValue.split(',') : []
      },
      set(val) {
        if (Array.isArray(val)) {
          this.setDataValue('categorySceneRule', val.join(','))
        } else {
          this.setDataValue('categorySceneRule', val || '')
        }
      },
      comment: '分类场景规则'
    },
    useCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '使用次数'
    },
    useHeat: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '使用热度'
    },
    bindType: {
      type: DataTypes.ENUM('primary', 'auto', 'manual', 'migration'),
      defaultValue: 'primary',
      allowNull: false,
      comment: '绑定类型(primary=核心,auto=自动,manual=手动,migration=迁移)'
    },
    changeType: {
      type: DataTypes.ENUM('bind', 'adjust', 'migrate', 'unbind', 'auto_correct'),
      defaultValue: 'bind',
      allowNull: false,
      comment: '变更类型'
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
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '变更原因'
    },
    batchId: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '批量操作批次ID'
    },
    beforeCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '变更前分类ID'
    },
    beforeCategoryName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: '变更前分类名称'
    }
  },
  {
    tableName: 'filter_category_adapts',
    comment: '滤镜分类适配记录表',
    indexes: [
      { fields: ['filterId'] },
      { fields: ['categoryId'] },
      { fields: ['filterCode'] },
      { fields: ['isMatched'] },
      { fields: ['isPrimary'] },
      { fields: ['bindType'] },
      { fields: ['changeType'] },
      { fields: ['filterId', 'categoryId'] },
      { fields: ['batchId'] },
      { fields: ['categoryId', 'isPrimary'] },
      { fields: ['createdAt'] }
    ]
  }
)

module.exports = FilterCategoryAdapt

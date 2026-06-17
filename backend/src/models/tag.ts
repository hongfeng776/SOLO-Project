import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class Tag extends Model<InferAttributes<Tag>, InferCreationAttributes<Tag>> {
  declare id: CreationOptional<number>
  declare name: string
  declare type: string
  declare categoryId: CreationOptional<number | null>
  declare parentId: CreationOptional<number | null>
  declare description: CreationOptional<string>
  declare coverImage: CreationOptional<string>
  declare sort: CreationOptional<number>
  declare status: CreationOptional<number>
  declare useCount: CreationOptional<number>
  declare hotLevel: CreationOptional<number>
  declare weight: CreationOptional<number>
  declare isCore: CreationOptional<number>
  declare complianceTags: CreationOptional<string>
  declare lastUsedTime: CreationOptional<Date | null>
  declare color: CreationOptional<string>
  declare icon: CreationOptional<string>
  declare scenes: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

Tag.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'content',
      comment: 'content/product/activity'
    },
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      comment: '所属分类ID, 独立标签无分类'
    },
    parentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      comment: '上级标签ID, 用于层级标签'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: '标签描述'
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: '标签封面图'
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '1启用 2禁用'
    },
    useCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '使用次数(笔记绑定数)'
    },
    hotLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '热度等级 1普通 2热门'
    },
    weight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '分类标签权重(根据内容热度/使用频次)'
    },
    isCore: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否核心品类 0否 1是'
    },
    complianceTags: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      defaultValue: '',
      comment: '关联合规标签库(JSON数组)'
    },
    lastUsedTime: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
      comment: '最后使用时间'
    },
    color: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: '',
      comment: '标签展示颜色'
    },
    icon: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '标签图标'
    },
    scenes: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      defaultValue: '',
      comment: '适配内容场景(JSON数组)'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_tag',
    modelName: 'Tag',
    indexes: [
      { fields: ['category_id', 'status'] },
      { fields: ['parent_id'] },
      { fields: ['use_count', 'status'] },
      { fields: ['name', 'type'], unique: true }
    ]
  }
)

export default Tag

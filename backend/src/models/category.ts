import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class Category extends Model<InferAttributes<Category>, InferCreationAttributes<Category>> {
  declare id: CreationOptional<number>
  declare name: string
  declare code: string
  declare parentId: CreationOptional<number | null>
  declare level: CreationOptional<number>
  declare description: CreationOptional<string>
  declare coverImage: CreationOptional<string>
  declare icon: CreationOptional<string>
  declare color: CreationOptional<string>
  declare sort: CreationOptional<number>
  declare status: CreationOptional<number>
  declare tagCount: CreationOptional<number>
  declare noteCount: CreationOptional<number>
  declare isCore: CreationOptional<number>
  declare weight: CreationOptional<number>
  declare scenes: CreationOptional<string>
  declare creator: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

Category.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '分类名称'
    },
    code: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '分类编码'
    },
    parentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      comment: '上级分类ID, 用于树形结构'
    },
    level: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '层级 1/2/3'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: '分类描述'
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: '封面图'
    },
    icon: {
      type: DataTypes.STRING(200),
      allowNull: false,
      defaultValue: '',
      comment: '图标'
    },
    color: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: '',
      comment: '颜色'
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '排序'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '1启用 2禁用'
    },
    tagCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '下属标签数'
    },
    noteCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '下属笔记数'
    },
    isCore: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否核心品类 0否 1是'
    },
    weight: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '权重'
    },
    scenes: {
      type: DataTypes.STRING(1000),
      allowNull: false,
      defaultValue: '',
      comment: '适配内容场景(JSON)'
    },
    creator: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
      comment: '创建人'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_category',
    modelName: 'Category',
    indexes: [
      { fields: ['parent_id', 'status'] },
      { fields: ['level', 'sort'] },
      { fields: ['name'], unique: true },
      { fields: ['code'], unique: true }
    ]
  }
)

export default Category

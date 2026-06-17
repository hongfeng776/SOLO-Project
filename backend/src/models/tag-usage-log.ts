import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class TagUsageLog extends Model<InferAttributes<TagUsageLog>, InferCreationAttributes<TagUsageLog>> {
  declare id: CreationOptional<number>
  declare tagId: number
  declare tagName: string
  declare noteId: number
  declare noteTitle: string
  declare categoryId: CreationOptional<number | null>
  declare userId: number
  declare userName: string
  declare action: string
  declare reason: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

TagUsageLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    tagId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '标签ID'
    },
    tagName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '标签名'
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '笔记ID'
    },
    noteTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '笔记标题'
    },
    categoryId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: null,
      comment: '分类ID'
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      comment: '操作人ID'
    },
    userName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作人'
    },
    action: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '操作: bind/unbind/create/update/delete'
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: false,
      defaultValue: '',
      comment: '变更原因'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_tag_usage_log',
    modelName: 'TagUsageLog',
    indexes: [
      { fields: ['tag_id', 'create_time'] },
      { fields: ['note_id'] },
      { fields: ['user_id', 'create_time'] }
    ]
  }
)

export default TagUsageLog

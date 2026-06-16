import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class Comment extends Model<InferAttributes<Comment>, InferCreationAttributes<Comment>> {
  declare id: CreationOptional<number>
  declare noteId: number
  declare userId: number
  declare nickname: string
  declare avatar: CreationOptional<string>
  declare content: string
  declare status: CreationOptional<number>
  declare parentId: CreationOptional<number>
  declare replyTo: CreationOptional<string>
  declare likeCount: CreationOptional<number>
  declare violationType: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '0待审核 1已通过 2已拒绝'
    },
    parentId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      defaultValue: 0
    },
    replyTo: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    likeCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    violationType: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_comment',
    modelName: 'Comment',
    indexes: [
      { fields: ['note_id', 'status'] },
      { fields: ['user_id', 'status'] },
      { fields: ['parent_id'] }
    ]
  }
)

export default Comment

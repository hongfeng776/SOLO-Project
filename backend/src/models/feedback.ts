import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class Feedback extends Model<InferAttributes<Feedback>, InferCreationAttributes<Feedback>> {
  declare id: CreationOptional<number>
  declare userId: CreationOptional<number>
  declare nickname: CreationOptional<string>
  declare type: string
  declare title: string
  declare content: string
  declare images: CreationOptional<string>
  declare contact: CreationOptional<string>
  declare status: CreationOptional<number>
  declare handleResult: CreationOptional<string>
  declare handleTime: CreationOptional<Date | null>
  declare handlerId: CreationOptional<number>
  declare handlerName: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

Feedback.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    images: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: ''
    },
    contact: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0待处理 1处理中 2已处理 3已关闭'
    },
    handleResult: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    handleTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    handlerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    handlerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_feedback',
    modelName: 'Feedback',
    indexes: [
      { fields: ['status', 'type'] }
    ]
  }
)

export default Feedback

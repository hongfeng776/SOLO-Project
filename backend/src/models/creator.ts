import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class Creator extends Model<InferAttributes<Creator>, InferCreationAttributes<Creator>> {
  declare id: CreationOptional<number>
  declare name: string
  declare avatar: CreationOptional<string>
  declare platform: string
  declare followers: CreationOptional<number>
  declare likes: CreationOptional<number>
  declare category: string
  declare level: CreationOptional<number>
  declare qualificationStatus: CreationOptional<number>
  declare contactName: string
  declare contactPhone: string
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

Creator.init(
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
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    platform: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: '小红书'
    },
    followers: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    likes: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    level: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    qualificationStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0未提交 1审核中 2已通过 3已拒绝'
    },
    contactName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ''
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_creator',
    modelName: 'Creator'
  }
)

export default Creator

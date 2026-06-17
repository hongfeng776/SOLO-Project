import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<number>
  declare username: string
  declare password: string
  declare nickname: string
  declare avatar: CreationOptional<string>
  declare email: string
  declare phone: string
  declare status: CreationOptional<number>
  declare realNameVerified: CreationOptional<number>
  declare realName: CreationOptional<string>
  declare idCard: CreationOptional<string>
  declare banExpireTime: CreationOptional<Date | null>
  declare flowLimitExpireTime: CreationOptional<Date | null>
  declare reviewLevel: CreationOptional<number>
  declare reviewCount: CreationOptional<number>
  declare isSeniorReviewer: CreationOptional<number>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING(200),
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
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      defaultValue: ''
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ''
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    realNameVerified: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0未认证 1审核中 2已认证 3已拒绝'
    },
    realName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    idCard: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    banExpireTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    flowLimitExpireTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    reviewLevel: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '审核权限等级 0无 1普通 2高级'
    },
    reviewCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '累计审核数'
    },
    isSeniorReviewer: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '是否高级审核员 0否 1是'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'sys_user',
    modelName: 'User'
  }
)

export default User

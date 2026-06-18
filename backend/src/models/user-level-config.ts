import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class UserLevelConfig extends Model<InferAttributes<UserLevelConfig>, InferCreationAttributes<UserLevelConfig>> {
  declare id: CreationOptional<number>
  declare level: number
  declare levelName: string
  declare minScore: number
  declare maxScore: number
  declare weightActivity: number
  declare weightContentQuality: number
  declare weightCompliance: number
  declare weightAccountAge: number
  declare benefits: string
  declare restrictions: CreationOptional<string>
  declare description: CreationOptional<string>
  declare isEnabled: CreationOptional<number>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
}

UserLevelConfig.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    level: {
      type: DataTypes.TINYINT,
      allowNull: false,
      unique: true,
      comment: '等级值'
    },
    levelName: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '等级名称'
    },
    minScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      comment: '最低分值'
    },
    maxScore: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 100,
      comment: '最高分值'
    },
    weightActivity: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 30,
      comment: '活跃度权重 0-100'
    },
    weightContentQuality: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 30,
      comment: '内容质量权重 0-100'
    },
    weightCompliance: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 25,
      comment: '合规记录权重 0-100'
    },
    weightAccountAge: {
      type: DataTypes.TINYINT.UNSIGNED,
      allowNull: false,
      defaultValue: 15,
      comment: '账号时长权重 0-100'
    },
    benefits: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '权益列表JSON'
    },
    restrictions: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '限制列表JSON'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '等级描述'
    },
    isEnabled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '是否启用 0否 1是'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'user_level_config',
    modelName: 'UserLevelConfig'
  }
)

export default UserLevelConfig

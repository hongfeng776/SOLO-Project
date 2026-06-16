import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class Activity extends Model<InferAttributes<Activity>, InferCreationAttributes<Activity>> {
  declare id: CreationOptional<number>
  declare name: string
  declare description: string
  declare coverImage: string
  declare type: string
  declare startTime: Date
  declare endTime: Date
  declare status: CreationOptional<number>
  declare participantCount: CreationOptional<number>
  declare maxParticipants: CreationOptional<number>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

Activity.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    coverImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'promotion',
      comment: 'promotion/delivery/custom'
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0未开始 1进行中 2已结束 3已取消'
    },
    participantCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_activity',
    modelName: 'Activity'
  }
)

export default Activity

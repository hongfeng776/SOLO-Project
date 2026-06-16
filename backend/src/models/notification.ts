import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class Notification extends Model<InferAttributes<Notification>, InferCreationAttributes<Notification>> {
  declare id: CreationOptional<number>
  declare userId: number
  declare type: string
  declare title: string
  declare content: string
  declare status: CreationOptional<number>
  declare relatedId: CreationOptional<number>
  declare relatedType: CreationOptional<string>
  declare readTime: CreationOptional<Date | null>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

Notification.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: 'system/comment/like/violation/settlement'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0未读 1已读'
    },
    relatedId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    relatedType: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: ''
    },
    readTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'sys_notification',
    modelName: 'Notification',
    indexes: [
      { fields: ['status', 'create_time'] },
      { fields: ['user_id', 'status'] }
    ]
  }
)

export default Notification

import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class PublishAbnormalLog extends Model<InferAttributes<PublishAbnormalLog>, InferCreationAttributes<PublishAbnormalLog>> {
  declare id: CreationOptional<number>
  declare userId: number
  declare userName: string
  declare abnormalType: string
  declare abnormalDetail: CreationOptional<string>
  declare targetNoteId: CreationOptional<number | null>
  declare ip: CreationOptional<string>
  declare userAgent: CreationOptional<string>
  declare handled: CreationOptional<number>
  declare handleNote: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

PublishAbnormalLog.init(
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
    userName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    abnormalType: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    abnormalDetail: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: ''
    },
    targetNoteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: ''
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    handled: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0否 1是'
    },
    handleNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_publish_abnormal_log',
    modelName: 'PublishAbnormalLog',
    indexes: [
      { fields: ['user_id', 'abnormal_type'] },
      { fields: ['handled', 'create_time'] },
      { fields: ['target_note_id'] }
    ]
  }
)

export default PublishAbnormalLog

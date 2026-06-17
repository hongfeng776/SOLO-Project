import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class NoteBatchRecord extends Model<InferAttributes<NoteBatchRecord>, InferCreationAttributes<NoteBatchRecord>> {
  declare id: CreationOptional<number>
  declare batchNo: string
  declare userId: number
  declare userName: string
  declare totalCount: CreationOptional<number>
  declare successCount: CreationOptional<number>
  declare failCount: CreationOptional<number>
  declare pendingCount: CreationOptional<number>
  declare status: CreationOptional<number>
  declare failDetails: CreationOptional<string>
  declare notes: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

NoteBatchRecord.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    batchNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    userName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    totalCount: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    successCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    failCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    pendingCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '1处理中 2已完成 3已失败'
    },
    failDetails: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: ''
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: ''
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_note_batch_record',
    modelName: 'NoteBatchRecord',
    indexes: [
      { fields: ['user_id', 'status'] },
      { fields: ['batch_no'], unique: true }
    ]
  }
)

export default NoteBatchRecord

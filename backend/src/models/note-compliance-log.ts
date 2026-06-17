import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class NoteComplianceLog extends Model<InferAttributes<NoteComplianceLog>, InferCreationAttributes<NoteComplianceLog>> {
  declare id: CreationOptional<number>
  declare noteId: CreationOptional<number | null>
  declare userId: number
  declare userName: string
  declare checkType: string
  declare checkResult: number
  declare violationDetails: CreationOptional<string>
  declare similarNoteId: CreationOptional<number | null>
  declare similarityScore: CreationOptional<number>
  declare blocked: CreationOptional<number>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

NoteComplianceLog.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    noteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    userId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    userName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    checkType: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    checkResult: {
      type: DataTypes.TINYINT,
      allowNull: false,
      comment: '1通过 2拦截 3警告'
    },
    violationDetails: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: ''
    },
    similarNoteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true
    },
    similarityScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    blocked: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0否 1是'
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'biz_note_compliance_log',
    modelName: 'NoteComplianceLog',
    indexes: [
      { fields: ['note_id', 'check_type'] },
      { fields: ['user_id', 'check_type'] },
      { fields: ['check_result', 'create_time'] }
    ]
  }
)

export default NoteComplianceLog

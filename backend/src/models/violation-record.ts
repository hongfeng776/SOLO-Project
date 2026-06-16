import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ViolationRecord extends Model<InferAttributes<ViolationRecord>, InferCreationAttributes<ViolationRecord>> {
  declare id: CreationOptional<number>
  declare targetType: string
  declare targetId: number
  declare targetTitle: string
  declare violationType: string
  declare violationLevel: number
  declare description: CreationOptional<string>
  declare evidence: CreationOptional<string>
  declare handlerId: number
  declare handlerName: string
  declare handleResult: number
  declare handleNote: CreationOptional<string>
  declare status: CreationOptional<number>
  declare appealContent: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

ViolationRecord.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    targetType: {
      type: DataTypes.STRING(20),
      allowNull: false
    },
    targetId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    targetTitle: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    violationType: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    violationLevel: {
      type: DataTypes.TINYINT,
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    evidence: {
      type: DataTypes.STRING(1000),
      allowNull: true,
      defaultValue: ''
    },
    handlerId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    handlerName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    handleResult: {
      type: DataTypes.TINYINT,
      allowNull: false
    },
    handleNote: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    appealContent: {
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
    tableName: 'biz_violation_record',
    modelName: 'ViolationRecord',
    indexes: [
      { fields: ['target_type', 'status'] },
      { fields: ['violation_level', 'status'] }
    ]
  }
)

export default ViolationRecord

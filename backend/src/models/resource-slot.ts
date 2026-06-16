import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class ResourceSlot extends Model<InferAttributes<ResourceSlot>, InferCreationAttributes<ResourceSlot>> {
  declare id: CreationOptional<number>
  declare code: string
  declare name: string
  declare description: CreationOptional<string>
  declare type: CreationOptional<string>
  declare status: CreationOptional<number>
  declare sort: CreationOptional<number>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

ResourceSlot.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: ''
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
      comment: '0禁用 1启用'
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    createTime: DataTypes.DATE,
    updateTime: DataTypes.DATE,
    deleteTime: DataTypes.DATE
  },
  {
    sequelize,
    tableName: 'sys_resource_slot',
    modelName: 'ResourceSlot'
  }
)

export default ResourceSlot

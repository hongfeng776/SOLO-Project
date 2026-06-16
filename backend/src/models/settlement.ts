import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class Settlement extends Model<InferAttributes<Settlement>, InferCreationAttributes<Settlement>> {
  declare id: CreationOptional<number>
  declare settlementNo: string
  declare creatorId: number
  declare creatorName: string
  declare type: CreationOptional<string>
  declare amount: number
  declare status: CreationOptional<number>
  declare settlementPeriod: string
  declare orderIds: CreationOptional<string>
  declare remark: CreationOptional<string>
  declare settleTime: CreationOptional<Date | null>
  declare rejectReason: CreationOptional<string>
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

Settlement.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    settlementNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    creatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    creatorName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'order',
      comment: 'order/activity/bonus'
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0待结算 1已结算 2已驳回'
    },
    settlementPeriod: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    orderIds: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
      defaultValue: ''
    },
    settleTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejectReason: {
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
    tableName: 'biz_settlement',
    modelName: 'Settlement',
    indexes: [
      { fields: ['creator_id', 'status'] },
      { fields: ['settlement_period', 'status'] }
    ]
  }
)

export default Settlement

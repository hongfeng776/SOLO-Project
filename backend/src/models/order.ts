import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize'
import sequelize from '@config/database'

class Order extends Model<InferAttributes<Order>, InferCreationAttributes<Order>> {
  declare id: CreationOptional<number>
  declare orderNo: string
  declare type: string
  declare status: CreationOptional<number>
  declare activityId: number
  declare activityName: string
  declare creatorId: number
  declare creatorName: string
  declare amount: number
  declare paymentTime: CreationOptional<Date | null>
  declare completeTime: CreationOptional<Date | null>
  declare cancelTime: CreationOptional<Date | null>
  declare refundTime: CreationOptional<Date | null>
  declare remark: string
  declare createTime: CreationOptional<Date>
  declare updateTime: CreationOptional<Date>
  declare deleteTime: CreationOptional<Date | null>
}

Order.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true
    },
    orderNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    type: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'promotion',
      comment: 'promotion/delivery/custom'
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
      comment: '0待支付 1进行中 2已完成 3已取消 4已退款'
    },
    activityId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    activityName: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    creatorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    creatorName: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0
    },
    paymentTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    completeTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    cancelTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refundTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    remark: {
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
    tableName: 'biz_order',
    modelName: 'Order',
    indexes: [
      { fields: ['status', 'create_time'] },
      { fields: ['creator_id', 'status'] }
    ]
  }
)

export default Order

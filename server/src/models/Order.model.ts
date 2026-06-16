import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { OrderStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface OrderAttributes {
  id: string;
  orderNo: string;
  channelId?: string;
  promoterId?: string;
  userId?: string;
  productName: string;
  productSku?: string;
  productImage?: string;
  unitPrice: number;
  quantity: number;
  totalAmount: number;
  discountAmount?: number;
  payAmount: number;
  commissionRate?: number;
  commissionAmount?: number;
  status: OrderStatus;
  payTime?: Date;
  shipTime?: Date;
  completeTime?: Date;
  cancelTime?: Date;
  cancelReason?: string;
  refundAmount?: number;
  remark?: string;
  receiverName?: string;
  receiverPhone?: string;
  receiverAddress?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface OrderCreationAttributes extends Optional<OrderAttributes, 'id' | 'discountAmount' | 'commissionRate' | 'commissionAmount' | 'status' | 'refundAmount' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Order extends Model<OrderAttributes, OrderCreationAttributes> implements OrderAttributes {
  public id!: string;
  public orderNo!: string;
  public channelId?: string;
  public promoterId?: string;
  public userId?: string;
  public productName!: string;
  public productSku?: string;
  public productImage?: string;
  public unitPrice!: number;
  public quantity!: number;
  public totalAmount!: number;
  public discountAmount?: number;
  public payAmount!: number;
  public commissionRate?: number;
  public commissionAmount?: number;
  public status!: OrderStatus;
  public payTime?: Date;
  public shipTime?: Date;
  public completeTime?: Date;
  public cancelTime?: Date;
  public cancelReason?: string;
  public refundAmount?: number;
  public remark?: string;
  public receiverName?: string;
  public receiverPhone?: string;
  public receiverAddress?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Order.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    orderNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    channelId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'channels',
        key: 'id',
      },
    },
    promoterId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'promoters',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    productName: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    productSku: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    productImage: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    discountAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    payAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    commissionAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: OrderStatus.PENDING_PAY,
    },
    payTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    shipTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completeTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelReason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    refundAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receiverName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    receiverPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    receiverAddress: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'orders',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_order_no',
        fields: ['order_no'],
      },
      {
        name: 'idx_channel_id',
        fields: ['channel_id'],
      },
      {
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
      {
        name: 'idx_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
      {
        name: 'idx_pay_time',
        fields: ['pay_time'],
      },
    ],
  }
);

export { Order, OrderAttributes, OrderCreationAttributes };
export default Order;

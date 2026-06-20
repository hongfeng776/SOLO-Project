import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { OrderStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface OrderStatusChangeLogAttributes {
  id: string;
  orderId: string;
  orderNo: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  reason?: string;
  operatorId: string;
  operatorName: string;
  commissionAffected: boolean;
  commissionChangeAmount?: number;
  promoterId?: string;
  channelId?: string;
  relatedDataChanges?: object;
  ip?: string;
  userAgent?: string;
  createdAt: Date;
}

interface OrderStatusChangeLogCreationAttributes extends Optional<OrderStatusChangeLogAttributes, 'id' | 'reason' | 'commissionAffected' | 'commissionChangeAmount' | 'promoterId' | 'channelId' | 'relatedDataChanges' | 'ip' | 'userAgent' | 'createdAt'> {}

class OrderStatusChangeLog extends Model<OrderStatusChangeLogAttributes, OrderStatusChangeLogCreationAttributes> implements OrderStatusChangeLogAttributes {
  public id!: string;
  public orderId!: string;
  public orderNo!: string;
  public fromStatus!: OrderStatus;
  public toStatus!: OrderStatus;
  public reason?: string;
  public operatorId!: string;
  public operatorName!: string;
  public commissionAffected!: boolean;
  public commissionChangeAmount?: number;
  public promoterId?: string;
  public channelId?: string;
  public relatedDataChanges?: object;
  public ip?: string;
  public userAgent?: string;
  public readonly createdAt!: Date;
}

OrderStatusChangeLog.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    orderId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    orderNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    fromStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    toStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    operatorId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    commissionAffected: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    commissionChangeAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    promoterId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'promoters',
        key: 'id',
      },
    },
    channelId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'channels',
        key: 'id',
      },
    },
    relatedDataChanges: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'order_status_change_logs',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_order_id',
        fields: ['order_id'],
      },
      {
        name: 'idx_order_no',
        fields: ['order_no'],
      },
      {
        name: 'idx_operator_id',
        fields: ['operator_id'],
      },
      {
        name: 'idx_from_status',
        fields: ['from_status'],
      },
      {
        name: 'idx_to_status',
        fields: ['to_status'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
      {
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
    ],
  }
);

export { OrderStatusChangeLog, OrderStatusChangeLogAttributes, OrderStatusChangeLogCreationAttributes };
export default OrderStatusChangeLog;

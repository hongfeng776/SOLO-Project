import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { CommissionStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface CommissionAttributes {
  id: string;
  orderId?: string;
  orderNo?: string;
  promoterId: string;
  channelId?: string;
  type: number;
  amount: number;
  rate?: number;
  status: CommissionStatus;
  settleTime?: Date;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface CommissionCreationAttributes extends Optional<CommissionAttributes, 'id' | 'type' | 'amount' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Commission extends Model<CommissionAttributes, CommissionCreationAttributes> implements CommissionAttributes {
  public id!: string;
  public orderId?: string;
  public orderNo?: string;
  public promoterId!: string;
  public channelId?: string;
  public type!: number;
  public amount!: number;
  public rate?: number;
  public status!: CommissionStatus;
  public settleTime?: Date;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Commission.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    orderId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    orderNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    promoterId: {
      type: DataTypes.STRING(36),
      allowNull: false,
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
    type: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    rate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: CommissionStatus.PENDING,
    },
    settleTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
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
    tableName: 'commissions',
    timestamps: true,
    paranoid: true,
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
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
      {
        name: 'idx_channel_id',
        fields: ['channel_id'],
      },
      {
        name: 'idx_type',
        fields: ['type'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
    ],
  }
);

export { Commission, CommissionAttributes, CommissionCreationAttributes };
export default Commission;

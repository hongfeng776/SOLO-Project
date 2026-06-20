import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface DistributionOrderQueryLogAttributes {
  id: string;
  userId: string;
  userName: string;
  queryConditions: any;
  resultCount: number;
  queryDuration: number;
  ip: string;
  userAgent?: string;
  createdAt: Date;
}

interface DistributionOrderQueryLogCreationAttributes
  extends Optional<DistributionOrderQueryLogAttributes, 'id' | 'userAgent' | 'createdAt'> {}

class DistributionOrderQueryLog
  extends Model<DistributionOrderQueryLogAttributes, DistributionOrderQueryLogCreationAttributes>
  implements DistributionOrderQueryLogAttributes
{
  public id!: string;
  public userId!: string;
  public userName!: string;
  public queryConditions!: any;
  public resultCount!: number;
  public queryDuration!: number;
  public ip!: string;
  public userAgent?: string;
  public readonly createdAt!: Date;
}

DistributionOrderQueryLog.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    userName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    queryConditions: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    resultCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    queryDuration: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    ip: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'distribution_order_query_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      { name: 'idx_user_id', fields: ['user_id'] },
      { name: 'idx_created_at', fields: ['created_at'] },
      { name: 'idx_ip', fields: ['ip'] },
    ],
  }
);

export { DistributionOrderQueryLog, DistributionOrderQueryLogAttributes, DistributionOrderQueryLogCreationAttributes };
export default DistributionOrderQueryLog;

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { MarketingStatus, MarketingType } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface MarketingAttributes {
  id: string;
  name: string;
  code: string;
  type: MarketingType;
  status: MarketingStatus;
  startTime?: Date;
  endTime?: Date;
  rules?: any;
  budget?: number;
  usedAmount?: number;
  maxCommissionRate?: number;
  channels?: any;
  description?: string;
  coverImage?: string;
  sort?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface MarketingCreationAttributes extends Optional<MarketingAttributes, 'id' | 'type' | 'status' | 'budget' | 'usedAmount' | 'sort' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Marketing extends Model<MarketingAttributes, MarketingCreationAttributes> implements MarketingAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public type!: MarketingType;
  public status!: MarketingStatus;
  public startTime?: Date;
  public endTime?: Date;
  public rules?: any;
  public budget?: number;
  public usedAmount?: number;
  public maxCommissionRate?: number;
  public channels?: any;
  public description?: string;
  public coverImage?: string;
  public sort?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Marketing.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM(MarketingType.COUPON, MarketingType.DISCOUNT, MarketingType.CASHBACK, MarketingType.REBATE, MarketingType.BONUS),
      allowNull: false,
      defaultValue: MarketingType.COUPON,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: MarketingStatus.DRAFT,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rules: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    budget: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    usedAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    maxCommissionRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    channels: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'marketings',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_code',
        fields: ['code'],
      },
      {
        name: 'idx_type',
        fields: ['type'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
      {
        name: 'idx_start_time',
        fields: ['start_time'],
      },
      {
        name: 'idx_end_time',
        fields: ['end_time'],
      },
    ],
  }
);

export { Marketing, MarketingAttributes, MarketingCreationAttributes };
export default Marketing;

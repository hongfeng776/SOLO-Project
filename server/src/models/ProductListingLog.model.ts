import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import {
  ProductListingAction,
  ProductListingTrigger,
  ProductStatus,
} from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ProductListingLogAttributes {
  id: string;
  productId: string;
  action: ProductListingAction;
  trigger: ProductListingTrigger;
  fromStatus: ProductStatus;
  toStatus: ProductStatus;
  operatorId?: string;
  operatorName?: string;
  reason?: string;
  activeOrderCount?: number;
  forceDelist?: boolean;
  scheduleRuleId?: string;
  scheduleRuleName?: string;
  batchId?: string;
  batchTotalCount?: number;
  batchSuccessCount?: number;
  batchFailedCount?: number;
  ipAddress?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface ProductListingLogCreationAttributes
  extends Optional<
    ProductListingLogAttributes,
    | 'id'
    | 'operatorId'
    | 'operatorName'
    | 'reason'
    | 'activeOrderCount'
    | 'forceDelist'
    | 'scheduleRuleId'
    | 'scheduleRuleName'
    | 'batchId'
    | 'batchTotalCount'
    | 'batchSuccessCount'
    | 'batchFailedCount'
    | 'ipAddress'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

class ProductListingLog
  extends Model<ProductListingLogAttributes, ProductListingLogCreationAttributes>
  implements ProductListingLogAttributes
{
  public id!: string;
  public productId!: string;
  public action!: ProductListingAction;
  public trigger!: ProductListingTrigger;
  public fromStatus!: ProductStatus;
  public toStatus!: ProductStatus;
  public operatorId?: string;
  public operatorName?: string;
  public reason?: string;
  public activeOrderCount?: number;
  public forceDelist?: boolean;
  public scheduleRuleId?: string;
  public scheduleRuleName?: string;
  public batchId?: string;
  public batchTotalCount?: number;
  public batchSuccessCount?: number;
  public batchFailedCount?: number;
  public ipAddress?: string;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

ProductListingLog.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    productId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'products',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    trigger: {
      type: DataTypes.STRING(30),
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
    operatorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    operatorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    activeOrderCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    forceDelist: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    scheduleRuleId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    scheduleRuleName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    batchId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    batchTotalCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    batchSuccessCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    batchFailedCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('metadata') as unknown as string | null;
        return raw ? JSON.parse(raw) : null;
      },
      set(value: any) {
        this.setDataValue('metadata', value ? JSON.stringify(value) : (null as any));
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'product_listing_logs',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_product_id',
        fields: ['product_id'],
      },
      {
        name: 'idx_action',
        fields: ['action'],
      },
      {
        name: 'idx_trigger',
        fields: ['trigger'],
      },
      {
        name: 'idx_operator_id',
        fields: ['operator_id'],
      },
      {
        name: 'idx_batch_id',
        fields: ['batch_id'],
      },
      {
        name: 'idx_schedule_rule_id',
        fields: ['schedule_rule_id'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
    ],
  }
);

export {
  ProductListingLog,
  ProductListingLogAttributes,
  ProductListingLogCreationAttributes,
};
export default ProductListingLog;

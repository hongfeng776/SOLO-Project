import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ProductAuditAction, ProductAuditStage, ProductStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ProductAuditLogAttributes {
  id: string;
  productId: string;
  operatorId?: string;
  operatorName?: string;
  action: ProductAuditAction;
  fromStage?: ProductAuditStage;
  toStage: ProductAuditStage;
  fromStatus?: ProductStatus;
  toStatus: ProductStatus;
  fieldName?: string;
  fieldLabel?: string;
  oldValue?: string;
  newValue?: string;
  remark?: string;
  metadata?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductAuditLogCreationAttributes extends Optional<ProductAuditLogAttributes, 'id' | 'operatorId' | 'operatorName' | 'fromStage' | 'fromStatus' | 'fieldName' | 'fieldLabel' | 'oldValue' | 'newValue' | 'remark' | 'metadata' | 'ipAddress' | 'userAgent' | 'createdAt' | 'updatedAt'> {}

class ProductAuditLog extends Model<ProductAuditLogAttributes, ProductAuditLogCreationAttributes> implements ProductAuditLogAttributes {
  public id!: string;
  public productId!: string;
  public operatorId?: string;
  public operatorName?: string;
  public action!: ProductAuditAction;
  public fromStage?: ProductAuditStage;
  public toStage!: ProductAuditStage;
  public fromStatus?: ProductStatus;
  public toStatus!: ProductStatus;
  public fieldName?: string;
  public fieldLabel?: string;
  public oldValue?: string;
  public newValue?: string;
  public remark?: string;
  public metadata?: any;
  public ipAddress?: string;
  public userAgent?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ProductAuditLog.init(
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
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    fromStage: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    toStage: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    fromStatus: {
      type: DataTypes.TINYINT,
      allowNull: true,
    },
    toStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    fieldName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    fieldLabel: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('metadata');
        return raw ? JSON.parse(raw) : null;
      },
      set(value: any) {
        this.setDataValue('metadata', value ? JSON.stringify(value) : undefined as any);
      },
    },
    ipAddress: {
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
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'product_audit_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_product_id',
        fields: ['product_id'],
      },
      {
        name: 'idx_operator_id',
        fields: ['operator_id'],
      },
      {
        name: 'idx_action',
        fields: ['action'],
      },
      {
        name: 'idx_to_stage',
        fields: ['to_stage'],
      },
      {
        name: 'idx_to_status',
        fields: ['to_status'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
    ],
  }
);

export { ProductAuditLog, ProductAuditLogAttributes, ProductAuditLogCreationAttributes };
export default ProductAuditLog;

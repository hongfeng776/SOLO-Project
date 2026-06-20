import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import {
  ProductRiskStatus,
  ProductRiskType,
  ProductRiskTrigger,
  ProductRiskSeverity,
  ProductRiskAction,
} from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ProductRiskRecordAttributes {
  id: string;
  productId: string;
  riskType: ProductRiskType;
  riskSeverity: ProductRiskSeverity;
  riskTrigger: ProductRiskTrigger;
  riskAction: ProductRiskAction;
  riskStatus: ProductRiskStatus;
  triggerData?: any;
  abnormalData?: any;
  reason?: string;
  triggeredBy?: string;
  triggeredByName?: string;
  triggeredAt: Date;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedByName?: string;
  resolvedAt?: Date;
  resolveRemark?: string;
  isFalseAlarm?: boolean;
  affectedOrderCount?: number;
  affectedPromotionCount?: number;
  expireAt?: Date;
  ruleId?: string;
  ruleName?: string;
  batchId?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface ProductRiskRecordCreationAttributes
  extends Optional<
    ProductRiskRecordAttributes,
    | 'id'
    | 'riskSeverity'
    | 'riskTrigger'
    | 'riskAction'
    | 'riskStatus'
    | 'triggerData'
    | 'abnormalData'
    | 'reason'
    | 'triggeredBy'
    | 'triggeredByName'
    | 'triggeredAt'
    | 'resolved'
    | 'resolvedBy'
    | 'resolvedByName'
    | 'resolvedAt'
    | 'resolveRemark'
    | 'isFalseAlarm'
    | 'affectedOrderCount'
    | 'affectedPromotionCount'
    | 'expireAt'
    | 'ruleId'
    | 'ruleName'
    | 'batchId'
    | 'metadata'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

class ProductRiskRecord
  extends Model<ProductRiskRecordAttributes, ProductRiskRecordCreationAttributes>
  implements ProductRiskRecordAttributes
{
  public id!: string;
  public productId!: string;
  public riskType!: ProductRiskType;
  public riskSeverity!: ProductRiskSeverity;
  public riskTrigger!: ProductRiskTrigger;
  public riskAction!: ProductRiskAction;
  public riskStatus!: ProductRiskStatus;
  public triggerData?: any;
  public abnormalData?: any;
  public reason?: string;
  public triggeredBy?: string;
  public triggeredByName?: string;
  public triggeredAt!: Date;
  public resolved?: boolean;
  public resolvedBy?: string;
  public resolvedByName?: string;
  public resolvedAt?: Date;
  public resolveRemark?: string;
  public isFalseAlarm?: boolean;
  public affectedOrderCount?: number;
  public affectedPromotionCount?: number;
  public expireAt?: Date;
  public ruleId?: string;
  public ruleName?: string;
  public batchId?: string;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

ProductRiskRecord.init(
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
    riskType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    riskSeverity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ProductRiskSeverity.MEDIUM,
    },
    riskTrigger: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: ProductRiskTrigger.AUTO,
    },
    riskAction: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: ProductRiskAction.WARNING_NOTICE,
    },
    riskStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: ProductRiskStatus.WARNING,
    },
    triggerData: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('triggerData') as unknown as string | null;
        return raw ? JSON.parse(raw) : null;
      },
      set(value: any) {
        this.setDataValue(
          'triggerData',
          value ? (JSON.stringify(value) as any) : (null as any)
        );
      },
    },
    abnormalData: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('abnormalData') as unknown as string | null;
        return raw ? JSON.parse(raw) : null;
      },
      set(value: any) {
        this.setDataValue(
          'abnormalData',
          value ? (JSON.stringify(value) as any) : (null as any)
        );
      },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    triggeredBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    triggeredByName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    triggeredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    resolved: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    resolvedBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    resolvedByName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resolveRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isFalseAlarm: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    affectedOrderCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    affectedPromotionCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    expireAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    ruleId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    ruleName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    batchId: {
      type: DataTypes.STRING(36),
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
        this.setDataValue(
          'metadata',
          value ? (JSON.stringify(value) as any) : (null as any)
        );
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
    tableName: 'product_risk_records',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_product_id',
        fields: ['product_id'],
      },
      {
        name: 'idx_risk_type',
        fields: ['risk_type'],
      },
      {
        name: 'idx_risk_status',
        fields: ['risk_status'],
      },
      {
        name: 'idx_risk_severity',
        fields: ['risk_severity'],
      },
      {
        name: 'idx_risk_trigger',
        fields: ['risk_trigger'],
      },
      {
        name: 'idx_resolved',
        fields: ['resolved'],
      },
      {
        name: 'idx_triggered_at',
        fields: ['triggered_at'],
      },
      {
        name: 'idx_expire_at',
        fields: ['expire_at'],
      },
      {
        name: 'idx_batch_id',
        fields: ['batch_id'],
      },
      {
        name: 'idx_rule_id',
        fields: ['rule_id'],
      },
    ],
  }
);

export {
  ProductRiskRecord,
  ProductRiskRecordAttributes,
  ProductRiskRecordCreationAttributes,
};
export default ProductRiskRecord;

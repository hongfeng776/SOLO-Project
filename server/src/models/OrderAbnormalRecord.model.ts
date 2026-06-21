import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import {
  OrderAbnormalType,
  OrderAbnormalSeverity,
  OrderAbnormalStatus,
  OrderAbnormalSource,
  OrderAbnormalReviewAction,
  AbnormalRootCause,
} from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface OrderAbnormalRecordAttributes {
  id: string;
  orderId: string;
  orderNo: string;
  abnormalTypes: OrderAbnormalType[];
  severity: OrderAbnormalSeverity;
  status: OrderAbnormalStatus;
  source: OrderAbnormalSource;
  title: string;
  description?: string;
  evidence?: any;
  isLocked: boolean;
  autoSettleBlocked: boolean;
  promoterId?: string;
  channelId?: string;
  commissionAmount?: number;
  commissionBlocked?: boolean;
  detectedAt: Date;
  detectedBy?: string;
  rootCauses?: AbnormalRootCause[];
  reviewAction?: OrderAbnormalReviewAction;
  reviewConclusion?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewedAt?: Date;
  relatedDataChanges?: any;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface OrderAbnormalRecordCreationAttributes
  extends Optional<
    OrderAbnormalRecordAttributes,
    | 'id'
    | 'description'
    | 'evidence'
    | 'isLocked'
    | 'autoSettleBlocked'
    | 'promoterId'
    | 'channelId'
    | 'commissionAmount'
    | 'commissionBlocked'
    | 'detectedBy'
    | 'rootCauses'
    | 'reviewAction'
    | 'reviewConclusion'
    | 'reviewerId'
    | 'reviewerName'
    | 'reviewedAt'
    | 'relatedDataChanges'
    | 'remark'
    | 'createdAt'
    | 'updatedAt'
  > {}

class OrderAbnormalRecord
  extends Model<OrderAbnormalRecordAttributes, OrderAbnormalRecordCreationAttributes>
  implements OrderAbnormalRecordAttributes
{
  public id!: string;
  public orderId!: string;
  public orderNo!: string;
  public abnormalTypes!: OrderAbnormalType[];
  public severity!: OrderAbnormalSeverity;
  public status!: OrderAbnormalStatus;
  public source!: OrderAbnormalSource;
  public title!: string;
  public description?: string;
  public evidence?: any;
  public isLocked!: boolean;
  public autoSettleBlocked!: boolean;
  public promoterId?: string;
  public channelId?: string;
  public commissionAmount?: number;
  public commissionBlocked?: boolean;
  public detectedAt!: Date;
  public detectedBy?: string;
  public rootCauses?: AbnormalRootCause[];
  public reviewAction?: OrderAbnormalReviewAction;
  public reviewConclusion?: string;
  public reviewerId?: string;
  public reviewerName?: string;
  public reviewedAt?: Date;
  public relatedDataChanges?: any;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

OrderAbnormalRecord.init(
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
    abnormalTypes: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue('abnormalTypes') as unknown as string;
        return raw ? JSON.parse(raw) : [];
      },
      set(value: OrderAbnormalType[]) {
        this.setDataValue('abnormalTypes', JSON.stringify(value) as unknown as OrderAbnormalType[]);
      },
    },
    severity: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: OrderAbnormalSeverity.MEDIUM,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: OrderAbnormalStatus.PENDING_REVIEW,
    },
    source: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: OrderAbnormalSource.RULE_ENGINE,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    evidence: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('evidence');
        return raw ? JSON.parse(raw) : null;
      },
      set(value: any) {
        this.setDataValue('evidence', value ? JSON.stringify(value) : undefined as any);
      },
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    autoSettleBlocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    commissionAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
      defaultValue: 0,
    },
    commissionBlocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    detectedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    detectedBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    rootCauses: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('rootCauses') as unknown as string;
        return raw ? JSON.parse(raw) : null;
      },
      set(value: AbnormalRootCause[]) {
        this.setDataValue('rootCauses', value ? JSON.stringify(value) : undefined as any);
      },
    },
    reviewAction: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    reviewConclusion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    reviewerId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    reviewerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    reviewedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    relatedDataChanges: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('relatedDataChanges');
        return raw ? JSON.parse(raw) : null;
      },
      set(value: any) {
        this.setDataValue('relatedDataChanges', value ? JSON.stringify(value) : undefined as any);
      },
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
    tableName: 'order_abnormal_records',
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'idx_order_id', fields: ['order_id'] },
      { name: 'idx_order_no', fields: ['order_no'] },
      { name: 'idx_severity', fields: ['severity'] },
      { name: 'idx_status', fields: ['status'] },
      { name: 'idx_source', fields: ['source'] },
      { name: 'idx_promoter_id', fields: ['promoter_id'] },
      { name: 'idx_channel_id', fields: ['channel_id'] },
      { name: 'idx_is_locked', fields: ['is_locked'] },
      { name: 'idx_detected_at', fields: ['detected_at'] },
      { name: 'idx_reviewed_at', fields: ['reviewed_at'] },
    ],
  }
);

export {
  OrderAbnormalRecord,
  OrderAbnormalRecordAttributes,
  OrderAbnormalRecordCreationAttributes,
};
export default OrderAbnormalRecord;

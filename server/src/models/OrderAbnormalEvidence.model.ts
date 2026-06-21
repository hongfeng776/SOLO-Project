import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface OrderAbnormalEvidenceAttributes {
  id: string;
  abnormalRecordId: string;
  orderId: string;
  orderNo: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploaderId?: string;
  uploaderName?: string;
  description?: string;
  createdAt: Date;
}

interface OrderAbnormalEvidenceCreationAttributes
  extends Optional<
    OrderAbnormalEvidenceAttributes,
    'id' | 'uploaderId' | 'uploaderName' | 'description' | 'createdAt'
  > {}

class OrderAbnormalEvidence
  extends Model<OrderAbnormalEvidenceAttributes, OrderAbnormalEvidenceCreationAttributes>
  implements OrderAbnormalEvidenceAttributes
{
  public id!: string;
  public abnormalRecordId!: string;
  public orderId!: string;
  public orderNo!: string;
  public fileName!: string;
  public fileUrl!: string;
  public fileSize!: number;
  public fileType!: string;
  public uploaderId?: string;
  public uploaderName?: string;
  public description?: string;
  public readonly createdAt!: Date;
}

OrderAbnormalEvidence.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    abnormalRecordId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'order_abnormal_records',
        key: 'id',
      },
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
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0,
    },
    fileType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    uploaderId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    uploaderName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'order_abnormal_evidences',
    timestamps: false,
    underscored: true,
    indexes: [
      { name: 'idx_abnormal_record_id', fields: ['abnormal_record_id'] },
      { name: 'idx_order_id', fields: ['order_id'] },
      { name: 'idx_order_no', fields: ['order_no'] },
      { name: 'idx_uploader_id', fields: ['uploader_id'] },
      { name: 'idx_created_at', fields: ['created_at'] },
    ],
  }
);

export {
  OrderAbnormalEvidence,
  OrderAbnormalEvidenceAttributes,
  OrderAbnormalEvidenceCreationAttributes,
};
export default OrderAbnormalEvidence;

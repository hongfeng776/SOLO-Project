import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ProductEditApprovalStatus, ProductAuditAction } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ProductEditApprovalAttributes {
  id: string;
  productId: string;
  applicantId: string;
  applicantName?: string;
  applyReason: string;
  editFields: string[];
  oldValues: any;
  newValues: any;
  diffSummary: string;
  status: ProductEditApprovalStatus;
  approverId?: string;
  approverName?: string;
  approveRemark?: string;
  approveAt?: Date;
  effectiveTime?: Date;
  affectedOrderCount?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface ProductEditApprovalCreationAttributes
  extends Optional<
    ProductEditApprovalAttributes,
    | 'id'
    | 'applicantName'
    | 'status'
    | 'approverId'
    | 'approverName'
    | 'approveRemark'
    | 'approveAt'
    | 'effectiveTime'
    | 'affectedOrderCount'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
  > {}

class ProductEditApproval
  extends Model<ProductEditApprovalAttributes, ProductEditApprovalCreationAttributes>
  implements ProductEditApprovalAttributes
{
  public id!: string;
  public productId!: string;
  public applicantId!: string;
  public applicantName?: string;
  public applyReason!: string;
  public editFields!: string[];
  public oldValues!: any;
  public newValues!: any;
  public diffSummary!: string;
  public status!: ProductEditApprovalStatus;
  public approverId?: string;
  public approverName?: string;
  public approveRemark?: string;
  public approveAt?: Date;
  public effectiveTime?: Date;
  public affectedOrderCount?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

ProductEditApproval.init(
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
    applicantId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    applicantName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    applyReason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    editFields: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue('editFields') as unknown as string | null;
        return raw ? JSON.parse(raw) : [];
      },
      set(value: string[] | string) {
        const strValue = Array.isArray(value) ? JSON.stringify(value) : value;
        this.setDataValue('editFields', strValue as unknown as string[]);
      },
    },
    oldValues: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue('oldValues');
        return raw ? JSON.parse(raw) : {};
      },
      set(value: any) {
        this.setDataValue('oldValues', value ? JSON.stringify(value) : {} as any);
      },
    },
    newValues: {
      type: DataTypes.TEXT,
      allowNull: false,
      get() {
        const raw = this.getDataValue('newValues');
        return raw ? JSON.parse(raw) : {};
      },
      set(value: any) {
        this.setDataValue('newValues', value ? JSON.stringify(value) : {} as any);
      },
    },
    diffSummary: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: ProductEditApprovalStatus.PENDING,
    },
    approverId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approverName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    approveRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approveAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    effectiveTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    affectedOrderCount: {
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
    tableName: 'product_edit_approvals',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_product_id',
        fields: ['product_id'],
      },
      {
        name: 'idx_applicant_id',
        fields: ['applicant_id'],
      },
      {
        name: 'idx_approver_id',
        fields: ['approver_id'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
    ],
  }
);

export { ProductEditApproval, ProductEditApprovalAttributes, ProductEditApprovalCreationAttributes };
export default ProductEditApproval;

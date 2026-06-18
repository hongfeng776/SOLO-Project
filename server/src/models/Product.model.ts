import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import {
  ProductStatus,
  ProductAuditStage,
  ProductCategory,
  ProductMaterial,
} from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ProductAttributes {
  id: string;
  sku: string;
  name: string;
  category: ProductCategory;
  brand?: string;
  description?: string;
  mainImage?: string;
  images?: string;
  originalPrice: number;
  salePrice: number;
  costPrice?: number;
  stock: number;
  lockedStock?: number;
  commissionRate: number;
  minCommission?: number;
  maxCommission?: number;
  status: ProductStatus;
  auditStage: ProductAuditStage;
  qualificationVerified?: boolean;
  qualificationImgs?: string;
  qualificationExpireAt?: Date;
  qualificationRemark?: string;
  promotionMaterials?: any;
  commissionRuleId?: string;
  promoteEnabled?: boolean;
  listStartTime?: Date;
  listEndTime?: Date;
  limitedPromotion?: boolean;
  promotionStartTime?: Date;
  promotionEndTime?: Date;
  isHot?: boolean;
  isRecommended?: boolean;
  sort?: number;
  channelId?: string;
  auditorId?: string;
  auditAt?: Date;
  auditRemark?: string;
  rejectIssueType?: string;
  rejectCustomRemark?: string;
  rejectedAt?: Date;
  submitterId?: string;
  submitAt?: Date;
  listerId?: string;
  listAt?: Date;
  delisterId?: string;
  delistAt?: string;
  salesCount?: number;
  salesAmount?: number;
  promoteCount?: number;
  fakeProductFlag?: boolean;
  fakeProductReason?: string;
  complianceScore?: number;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'brand' | 'description' | 'mainImage' | 'images' | 'costPrice' | 'lockedStock' | 'minCommission' | 'maxCommission' | 'status' | 'auditStage' | 'qualificationVerified' | 'qualificationImgs' | 'qualificationExpireAt' | 'qualificationRemark' | 'promotionMaterials' | 'commissionRuleId' | 'promoteEnabled' | 'listStartTime' | 'listEndTime' | 'limitedPromotion' | 'promotionStartTime' | 'promotionEndTime' | 'isHot' | 'isRecommended' | 'sort' | 'channelId' | 'auditorId' | 'auditAt' | 'auditRemark' | 'rejectIssueType' | 'rejectCustomRemark' | 'rejectedAt' | 'submitterId' | 'submitAt' | 'listerId' | 'listAt' | 'delisterId' | 'delistAt' | 'salesCount' | 'salesAmount' | 'promoteCount' | 'fakeProductFlag' | 'fakeProductReason' | 'complianceScore' | 'remark' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Product extends Model<ProductAttributes, ProductCreationAttributes> implements ProductAttributes {
  public id!: string;
  public sku!: string;
  public name!: string;
  public category!: ProductCategory;
  public brand?: string;
  public description?: string;
  public mainImage?: string;
  public images?: string;
  public originalPrice!: number;
  public salePrice!: number;
  public costPrice?: number;
  public stock!: number;
  public lockedStock?: number;
  public commissionRate!: number;
  public minCommission?: number;
  public maxCommission?: number;
  public status!: ProductStatus;
  public auditStage!: ProductAuditStage;
  public qualificationVerified?: boolean;
  public qualificationImgs?: string;
  public qualificationExpireAt?: Date;
  public qualificationRemark?: string;
  public promotionMaterials?: any;
  public commissionRuleId?: string;
  public promoteEnabled?: boolean;
  public listStartTime?: Date;
  public listEndTime?: Date;
  public limitedPromotion?: boolean;
  public promotionStartTime?: Date;
  public promotionEndTime?: Date;
  public isHot?: boolean;
  public isRecommended?: boolean;
  public sort?: number;
  public channelId?: string;
  public auditorId?: string;
  public auditAt?: Date;
  public auditRemark?: string;
  public rejectIssueType?: string;
  public rejectCustomRemark?: string;
  public rejectedAt?: Date;
  public submitterId?: string;
  public submitAt?: Date;
  public listerId?: string;
  public listAt?: Date;
  public delisterId?: string;
  public delistAt?: string;
  public salesCount?: number;
  public salesAmount?: number;
  public promoteCount?: number;
  public fakeProductFlag?: boolean;
  public fakeProductReason?: string;
  public complianceScore?: number;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Product.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    sku: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mainImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    images: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('images');
        return raw ? JSON.parse(raw) : [];
      },
      set(value: string[]) {
        this.setDataValue('images', value ? JSON.stringify(value) : undefined as any);
      },
    },
    originalPrice: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    salePrice: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
    },
    costPrice: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    lockedStock: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(5, 4),
      allowNull: false,
    },
    minCommission: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    maxCommission: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: ProductStatus.DRAFT,
    },
    auditStage: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: ProductAuditStage.PENDING_SUBMIT,
    },
    qualificationVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    qualificationImgs: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('qualificationImgs');
        return raw ? JSON.parse(raw) : [];
      },
      set(value: string[]) {
        this.setDataValue('qualificationImgs', value ? JSON.stringify(value) : undefined as any);
      },
    },
    qualificationExpireAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    qualificationRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    promotionMaterials: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('promotionMaterials');
        return raw ? JSON.parse(raw) : null;
      },
      set(value: ProductMaterial[]) {
        this.setDataValue('promotionMaterials', value ? JSON.stringify(value) : undefined as any);
      },
    },
    commissionRuleId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'commission_rules',
        key: 'id',
      },
    },
    promoteEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    listStartTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    listEndTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    limitedPromotion: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    promotionStartTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    promotionEndTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isHot: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isRecommended: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    channelId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'channels',
        key: 'id',
      },
    },
    auditorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    auditAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    auditRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectIssueType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    rejectCustomRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    submitterId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    submitAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    listerId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    listAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    delisterId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    delistAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    salesCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    salesAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    promoteCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    fakeProductFlag: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    fakeProductReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    complianceScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 100,
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
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'products',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_sku',
        fields: ['sku'],
        unique: true,
      },
      {
        name: 'idx_name',
        fields: ['name'],
      },
      {
        name: 'idx_category',
        fields: ['category'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
      {
        name: 'idx_audit_stage',
        fields: ['audit_stage'],
      },
      {
        name: 'idx_channel_id',
        fields: ['channel_id'],
      },
      {
        name: 'idx_submitter_id',
        fields: ['submitter_id'],
      },
      {
        name: 'idx_auditor_id',
        fields: ['auditor_id'],
      },
      {
        name: 'idx_list_start_time',
        fields: ['list_start_time'],
      },
      {
        name: 'idx_list_end_time',
        fields: ['list_end_time'],
      },
      {
        name: 'idx_promotion_end_time',
        fields: ['promotion_end_time'],
      },
      {
        name: 'idx_fake_product_flag',
        fields: ['fake_product_flag'],
      },
      {
        name: 'idx_is_hot',
        fields: ['is_hot'],
      },
      {
        name: 'idx_is_recommended',
        fields: ['is_recommended'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
    ],
  }
);

export { Product, ProductAttributes, ProductCreationAttributes };
export default Product;

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { PromoterLevel, ManualLevelAdjustStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface MetricsSnapshot {
  monthlyOrders?: number;
  monthlyAmount?: number;
  activeDays?: number;
  reputationScore?: number;
}

interface PromoterLevelAdjustRequestAttributes {
  id: string;
  promoterId: string;
  applicantId?: string;
  applicantName?: string;
  fromLevel?: PromoterLevel;
  toLevel?: PromoterLevel;
  adjustReason: string;
  metricsSnapshot?: MetricsSnapshot;
  meetsThreshold?: boolean;
  approveStatus: ManualLevelAdjustStatus;
  approverId?: string;
  approverName?: string;
  approveRemark?: string;
  approvedAt?: Date;
  syncedToFrontend?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface PromoterLevelAdjustRequestCreationAttributes extends Optional<PromoterLevelAdjustRequestAttributes, 'id' | 'applicantId' | 'applicantName' | 'fromLevel' | 'toLevel' | 'metricsSnapshot' | 'meetsThreshold' | 'approveStatus' | 'approverId' | 'approverName' | 'approveRemark' | 'approvedAt' | 'syncedToFrontend' | 'createdAt' | 'updatedAt'> {}

class PromoterLevelAdjustRequest extends Model<PromoterLevelAdjustRequestAttributes, PromoterLevelAdjustRequestCreationAttributes> implements PromoterLevelAdjustRequestAttributes {
  public id!: string;
  public promoterId!: string;
  public applicantId?: string;
  public applicantName?: string;
  public fromLevel?: PromoterLevel;
  public toLevel?: PromoterLevel;
  public adjustReason!: string;
  public metricsSnapshot?: MetricsSnapshot;
  public meetsThreshold?: boolean;
  public approveStatus!: ManualLevelAdjustStatus;
  public approverId?: string;
  public approverName?: string;
  public approveRemark?: string;
  public approvedAt?: Date;
  public syncedToFrontend?: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PromoterLevelAdjustRequest.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    promoterId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'promoters',
        key: 'id',
      },
    },
    applicantId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    applicantName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    fromLevel: {
      type: DataTypes.ENUM(PromoterLevel.L1, PromoterLevel.L2, PromoterLevel.L3, PromoterLevel.L4, PromoterLevel.L5),
      allowNull: true,
    },
    toLevel: {
      type: DataTypes.ENUM(PromoterLevel.L1, PromoterLevel.L2, PromoterLevel.L3, PromoterLevel.L4, PromoterLevel.L5),
      allowNull: true,
    },
    adjustReason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metricsSnapshot: {
      type: DataTypes.TEXT,
      allowNull: true,
      get(): MetricsSnapshot | undefined {
        const value = this.getDataValue('metricsSnapshot') as unknown as string | undefined;
        if (!value) return undefined;
        try {
          return JSON.parse(value) as MetricsSnapshot;
        } catch {
          return undefined;
        }
      },
      set(value: MetricsSnapshot | undefined): void {
        this.setDataValue('metricsSnapshot', value ? (JSON.stringify(value) as unknown as MetricsSnapshot) : (undefined as unknown as MetricsSnapshot));
      },
    },
    meetsThreshold: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    approveStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: ManualLevelAdjustStatus.PENDING,
    },
    approverId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    approverName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    approveRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    syncedToFrontend: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    tableName: 'promoter_level_adjust_requests',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
      {
        name: 'idx_approve_status',
        fields: ['approve_status'],
      },
      {
        name: 'idx_from_level',
        fields: ['from_level'],
      },
      {
        name: 'idx_to_level',
        fields: ['to_level'],
      },
    ],
  }
);

export { PromoterLevelAdjustRequest, PromoterLevelAdjustRequestAttributes, PromoterLevelAdjustRequestCreationAttributes, MetricsSnapshot };
export default PromoterLevelAdjustRequest;

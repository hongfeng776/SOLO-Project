import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { PromoterLevel, LevelChangeSource } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface MetricsAtChange {
  monthlyOrders?: number;
  monthlyAmount?: number;
  activeDays?: number;
  reputationScore?: number;
}

interface ComplianceCheck {
  passed?: boolean;
  checks?: {
    name: string;
    passed: boolean;
    message?: string;
  }[];
}

interface PromoterLevelChangeLogAttributes {
  id: string;
  promoterId: string;
  changeSource?: LevelChangeSource;
  fromLevel?: PromoterLevel;
  toLevel?: PromoterLevel;
  operatorId?: string;
  operatorName?: string;
  metricsAtChange?: MetricsAtChange;
  meetsThreshold?: boolean;
  adjustRequestId?: string;
  changeReason?: string;
  complianceCheck?: ComplianceCheck;
  anomalyFlagged?: boolean;
  anomalyReason?: string;
  iterationCount?: number;
  createdAt: Date;
}

interface PromoterLevelChangeLogCreationAttributes extends Optional<PromoterLevelChangeLogAttributes, 'id' | 'changeSource' | 'fromLevel' | 'toLevel' | 'operatorId' | 'operatorName' | 'metricsAtChange' | 'meetsThreshold' | 'adjustRequestId' | 'changeReason' | 'complianceCheck' | 'anomalyFlagged' | 'anomalyReason' | 'iterationCount' | 'createdAt'> {}

class PromoterLevelChangeLog extends Model<PromoterLevelChangeLogAttributes, PromoterLevelChangeLogCreationAttributes> implements PromoterLevelChangeLogAttributes {
  public id!: string;
  public promoterId!: string;
  public changeSource?: LevelChangeSource;
  public fromLevel?: PromoterLevel;
  public toLevel?: PromoterLevel;
  public operatorId?: string;
  public operatorName?: string;
  public metricsAtChange?: MetricsAtChange;
  public meetsThreshold?: boolean;
  public adjustRequestId?: string;
  public changeReason?: string;
  public complianceCheck?: ComplianceCheck;
  public anomalyFlagged?: boolean;
  public anomalyReason?: string;
  public iterationCount?: number;
  public readonly createdAt!: Date;
}

PromoterLevelChangeLog.init(
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
    changeSource: {
      type: DataTypes.STRING(20),
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
    operatorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    metricsAtChange: {
      type: DataTypes.TEXT,
      allowNull: true,
      get(): MetricsAtChange | undefined {
        const value = this.getDataValue('metricsAtChange') as unknown as string | undefined;
        if (!value) return undefined;
        try {
          return JSON.parse(value) as MetricsAtChange;
        } catch {
          return undefined;
        }
      },
      set(value: MetricsAtChange | undefined): void {
        this.setDataValue('metricsAtChange', value ? (JSON.stringify(value) as unknown as MetricsAtChange) : (undefined as unknown as MetricsAtChange));
      },
    },
    meetsThreshold: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    adjustRequestId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    changeReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    complianceCheck: {
      type: DataTypes.TEXT,
      allowNull: true,
      get(): ComplianceCheck | undefined {
        const value = this.getDataValue('complianceCheck') as unknown as string | undefined;
        if (!value) return undefined;
        try {
          return JSON.parse(value) as ComplianceCheck;
        } catch {
          return undefined;
        }
      },
      set(value: ComplianceCheck | undefined): void {
        this.setDataValue('complianceCheck', value ? (JSON.stringify(value) as unknown as ComplianceCheck) : (undefined as unknown as ComplianceCheck));
      },
    },
    anomalyFlagged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    anomalyReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    iterationCount: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'promoter_level_change_logs',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
      {
        name: 'idx_change_source',
        fields: ['change_source'],
      },
      {
        name: 'idx_anomaly_flagged',
        fields: ['anomaly_flagged'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
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

export { PromoterLevelChangeLog, PromoterLevelChangeLogAttributes, PromoterLevelChangeLogCreationAttributes, MetricsAtChange, ComplianceCheck };
export default PromoterLevelChangeLog;

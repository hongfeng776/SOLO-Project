import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ChannelLevel, ChannelLevelChangeSource } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ChannelMetricsAtChange {
  monthlyOrders?: number;
  monthlyAmount?: number;
  cooperationMonths?: number;
  fulfillmentRate?: number;
  promotionScore?: number;
}

interface ChannelComplianceCheck {
  passed?: boolean;
  checks?: {
    name: string;
    passed: boolean;
    message?: string;
  }[];
}

interface ChannelGradeChangeLogAttributes {
  id: string;
  channelId: string;
  changeSource?: ChannelLevelChangeSource;
  fromLevel?: ChannelLevel;
  toLevel?: ChannelLevel;
  operatorId?: string;
  operatorName?: string;
  metricsAtChange?: ChannelMetricsAtChange;
  meetsThreshold?: boolean;
  adjustRequestId?: string;
  changeReason?: string;
  complianceCheck?: ChannelComplianceCheck;
  anomalyFlagged?: boolean;
  anomalyReason?: string;
  iterationCount?: number;
  createdAt: Date;
}

interface ChannelGradeChangeLogCreationAttributes extends Optional<ChannelGradeChangeLogAttributes, 'id' | 'changeSource' | 'fromLevel' | 'toLevel' | 'operatorId' | 'operatorName' | 'metricsAtChange' | 'meetsThreshold' | 'adjustRequestId' | 'changeReason' | 'complianceCheck' | 'anomalyFlagged' | 'anomalyReason' | 'iterationCount' | 'createdAt'> {}

class ChannelGradeChangeLog extends Model<ChannelGradeChangeLogAttributes, ChannelGradeChangeLogCreationAttributes> implements ChannelGradeChangeLogAttributes {
  public id!: string;
  public channelId!: string;
  public changeSource?: ChannelLevelChangeSource;
  public fromLevel?: ChannelLevel;
  public toLevel?: ChannelLevel;
  public operatorId?: string;
  public operatorName?: string;
  public metricsAtChange?: ChannelMetricsAtChange;
  public meetsThreshold?: boolean;
  public adjustRequestId?: string;
  public changeReason?: string;
  public complianceCheck?: ChannelComplianceCheck;
  public anomalyFlagged?: boolean;
  public anomalyReason?: string;
  public iterationCount?: number;
  public readonly createdAt!: Date;
}

ChannelGradeChangeLog.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    channelId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'channels',
        key: 'id',
      },
    },
    changeSource: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    fromLevel: {
      type: DataTypes.ENUM(ChannelLevel.STAR, ChannelLevel.BRONZE, ChannelLevel.SILVER, ChannelLevel.GOLD, ChannelLevel.PLATINUM, ChannelLevel.DIAMOND),
      allowNull: true,
    },
    toLevel: {
      type: DataTypes.ENUM(ChannelLevel.STAR, ChannelLevel.BRONZE, ChannelLevel.SILVER, ChannelLevel.GOLD, ChannelLevel.PLATINUM, ChannelLevel.DIAMOND),
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
      get(): ChannelMetricsAtChange | undefined {
        const value = this.getDataValue('metricsAtChange') as unknown as string | undefined;
        if (!value) return undefined;
        try {
          return JSON.parse(value) as ChannelMetricsAtChange;
        } catch {
          return undefined;
        }
      },
      set(value: ChannelMetricsAtChange | undefined): void {
        this.setDataValue('metricsAtChange', value ? (JSON.stringify(value) as unknown as ChannelMetricsAtChange) : (undefined as unknown as ChannelMetricsAtChange));
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
      get(): ChannelComplianceCheck | undefined {
        const value = this.getDataValue('complianceCheck') as unknown as string | undefined;
        if (!value) return undefined;
        try {
          return JSON.parse(value) as ChannelComplianceCheck;
        } catch {
          return undefined;
        }
      },
      set(value: ChannelComplianceCheck | undefined): void {
        this.setDataValue('complianceCheck', value ? (JSON.stringify(value) as unknown as ChannelComplianceCheck) : (undefined as unknown as ChannelComplianceCheck));
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
    tableName: 'channel_grade_change_logs',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_channel_id',
        fields: ['channel_id'],
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

export { ChannelGradeChangeLog, ChannelGradeChangeLogAttributes, ChannelGradeChangeLogCreationAttributes, ChannelMetricsAtChange, ChannelComplianceCheck };
export default ChannelGradeChangeLog;

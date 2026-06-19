import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ChannelLevel, ChannelLevelAdjustStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ChannelMetricsSnapshot {
  monthlyOrders?: number;
  monthlyAmount?: number;
  cooperationMonths?: number;
  fulfillmentRate?: number;
  promotionScore?: number;
}

interface ChannelGradeAdjustRequestAttributes {
  id: string;
  channelId: string;
  applicantId?: string;
  applicantName?: string;
  fromLevel?: ChannelLevel;
  toLevel?: ChannelLevel;
  adjustReason: string;
  metricsSnapshot?: ChannelMetricsSnapshot;
  meetsThreshold?: boolean;
  approveStatus: ChannelLevelAdjustStatus;
  approverId?: string;
  approverName?: string;
  approveRemark?: string;
  approvedAt?: Date;
  syncedToFrontend?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ChannelGradeAdjustRequestCreationAttributes extends Optional<ChannelGradeAdjustRequestAttributes, 'id' | 'applicantId' | 'applicantName' | 'fromLevel' | 'toLevel' | 'metricsSnapshot' | 'meetsThreshold' | 'approveStatus' | 'approverId' | 'approverName' | 'approveRemark' | 'approvedAt' | 'syncedToFrontend' | 'createdAt' | 'updatedAt'> {}

class ChannelGradeAdjustRequest extends Model<ChannelGradeAdjustRequestAttributes, ChannelGradeAdjustRequestCreationAttributes> implements ChannelGradeAdjustRequestAttributes {
  public id!: string;
  public channelId!: string;
  public applicantId?: string;
  public applicantName?: string;
  public fromLevel?: ChannelLevel;
  public toLevel?: ChannelLevel;
  public adjustReason!: string;
  public metricsSnapshot?: ChannelMetricsSnapshot;
  public meetsThreshold?: boolean;
  public approveStatus!: ChannelLevelAdjustStatus;
  public approverId?: string;
  public approverName?: string;
  public approveRemark?: string;
  public approvedAt?: Date;
  public syncedToFrontend?: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChannelGradeAdjustRequest.init(
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
    applicantId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    applicantName: {
      type: DataTypes.STRING(50),
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
    adjustReason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metricsSnapshot: {
      type: DataTypes.TEXT,
      allowNull: true,
      get(): ChannelMetricsSnapshot | undefined {
        const value = this.getDataValue('metricsSnapshot') as unknown as string | undefined;
        if (!value) return undefined;
        try {
          return JSON.parse(value) as ChannelMetricsSnapshot;
        } catch {
          return undefined;
        }
      },
      set(value: ChannelMetricsSnapshot | undefined): void {
        this.setDataValue('metricsSnapshot', value ? (JSON.stringify(value) as unknown as ChannelMetricsSnapshot) : (undefined as unknown as ChannelMetricsSnapshot));
      },
    },
    meetsThreshold: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    approveStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: ChannelLevelAdjustStatus.PENDING,
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
    tableName: 'channel_grade_adjust_requests',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_channel_id',
        fields: ['channel_id'],
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

export { ChannelGradeAdjustRequest, ChannelGradeAdjustRequestAttributes, ChannelGradeAdjustRequestCreationAttributes, ChannelMetricsSnapshot };
export default ChannelGradeAdjustRequest;

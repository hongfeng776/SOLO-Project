import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ParticipationEligibilityStatus, ParticipationUserType, ParticipationAnomalyType, ValidationSeverity } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface EligibilityCheckResult {
  code: string;
  name: string;
  passed: boolean;
  severity: ValidationSeverity;
  message: string;
}

interface ActivityParticipationAttributes {
  id: string;
  marketingId: string;
  userId: string;
  userType: ParticipationUserType;
  eligibilityStatus: ParticipationEligibilityStatus;
  registeredAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedAt?: Date;
  rejectedReason?: string;
  revokedAt?: Date;
  revokedBy?: string;
  revokeReason?: string;
  participantOrders?: number;
  participantAmount?: number;
  participantReward?: number;
  lastDataChangedAt?: Date;
  isAnomaly?: boolean;
  anomalyTypes?: ParticipationAnomalyType[];
  anomalyMarkedAt?: Date;
  anomalyMarkedBy?: string;
  anomalyMarkedReason?: string;
  isRestricted?: boolean;
  restrictedAt?: Date;
  restrictedReason?: string;
  eligibilityCheckResults?: EligibilityCheckResult[];
  ipAddress?: string;
  deviceFingerprint?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface ActivityParticipationCreationAttributes extends Optional<ActivityParticipationAttributes, 'id' | 'approvedAt' | 'approvedBy' | 'rejectedAt' | 'rejectedReason' | 'revokedAt' | 'revokedBy' | 'revokeReason' | 'participantOrders' | 'participantAmount' | 'participantReward' | 'lastDataChangedAt' | 'isAnomaly' | 'anomalyTypes' | 'anomalyMarkedAt' | 'anomalyMarkedBy' | 'anomalyMarkedReason' | 'isRestricted' | 'restrictedAt' | 'restrictedReason' | 'eligibilityCheckResults' | 'ipAddress' | 'deviceFingerprint' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class ActivityParticipation extends Model<ActivityParticipationAttributes, ActivityParticipationCreationAttributes> implements ActivityParticipationAttributes {
  public id!: string;
  public marketingId!: string;
  public userId!: string;
  public userType!: ParticipationUserType;
  public eligibilityStatus!: ParticipationEligibilityStatus;
  public registeredAt!: Date;
  public approvedAt?: Date;
  public approvedBy?: string;
  public rejectedAt?: Date;
  public rejectedReason?: string;
  public revokedAt?: Date;
  public revokedBy?: string;
  public revokeReason?: string;
  public participantOrders?: number;
  public participantAmount?: number;
  public participantReward?: number;
  public lastDataChangedAt?: Date;
  public isAnomaly?: boolean;
  public anomalyTypes?: ParticipationAnomalyType[];
  public anomalyMarkedAt?: Date;
  public anomalyMarkedBy?: string;
  public anomalyMarkedReason?: string;
  public isRestricted?: boolean;
  public restrictedAt?: Date;
  public restrictedReason?: string;
  public eligibilityCheckResults?: EligibilityCheckResult[];
  public ipAddress?: string;
  public deviceFingerprint?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

ActivityParticipation.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    marketingId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'marketings',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    userType: {
      type: DataTypes.ENUM(...Object.values(ParticipationUserType)),
      allowNull: false,
    },
    eligibilityStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: ParticipationEligibilityStatus.PENDING,
    },
    registeredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approvedBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    rejectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    rejectedReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    revokedBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    revokeReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    participantOrders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    participantAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    participantReward: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    lastDataChangedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isAnomaly: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    anomalyTypes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    anomalyMarkedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    anomalyMarkedBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    anomalyMarkedReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isRestricted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    restrictedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    restrictedReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    eligibilityCheckResults: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    deviceFingerprint: {
      type: DataTypes.STRING(100),
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
    tableName: 'activity_participations',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_marketing_id',
        fields: ['marketing_id'],
      },
      {
        name: 'idx_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_user_type',
        fields: ['user_type'],
      },
      {
        name: 'idx_eligibility_status',
        fields: ['eligibility_status'],
      },
      {
        name: 'idx_marketing_user',
        fields: ['marketing_id', 'user_id'],
        unique: true,
      },
      {
        name: 'idx_is_anomaly',
        fields: ['is_anomaly'],
      },
      {
        name: 'idx_is_restricted',
        fields: ['is_restricted'],
      },
      {
        name: 'idx_registered_at',
        fields: ['registered_at'],
      },
    ],
  }
);

export { ActivityParticipation, ActivityParticipationAttributes, ActivityParticipationCreationAttributes, EligibilityCheckResult };
export default ActivityParticipation;

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ParticipationRecordType, ParticipationAnomalyType } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface DataChangeDetail {
  field: string;
  oldValue?: any;
  newValue?: any;
}

interface ActivityParticipationLogAttributes {
  id: string;
  participationId: string;
  marketingId: string;
  userId: string;
  userType: string;
  recordType: ParticipationRecordType;
  operatorId?: string;
  operatorName?: string;
  beforeData?: object;
  afterData?: object;
  dataChanges?: DataChangeDetail[];
  anomalyType?: ParticipationAnomalyType;
  reason?: string;
  remark?: string;
  ipAddress?: string;
  createdAt: Date;
}

interface ActivityParticipationLogCreationAttributes extends Optional<ActivityParticipationLogAttributes, 'id' | 'operatorId' | 'operatorName' | 'beforeData' | 'afterData' | 'dataChanges' | 'anomalyType' | 'reason' | 'remark' | 'ipAddress' | 'createdAt'> {}

class ActivityParticipationLog extends Model<ActivityParticipationLogAttributes, ActivityParticipationLogCreationAttributes> implements ActivityParticipationLogAttributes {
  public id!: string;
  public participationId!: string;
  public marketingId!: string;
  public userId!: string;
  public userType!: string;
  public recordType!: ParticipationRecordType;
  public operatorId?: string;
  public operatorName?: string;
  public beforeData?: object;
  public afterData?: object;
  public dataChanges?: DataChangeDetail[];
  public anomalyType?: ParticipationAnomalyType;
  public reason?: string;
  public remark?: string;
  public ipAddress?: string;
  public readonly createdAt!: Date;
}

ActivityParticipationLog.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    participationId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'activity_participations',
        key: 'id',
      },
    },
    marketingId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    userType: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    recordType: {
      type: DataTypes.ENUM(...Object.values(ParticipationRecordType)),
      allowNull: false,
    },
    operatorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    operatorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    beforeData: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    afterData: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    dataChanges: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    anomalyType: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'activity_participation_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_participation_id',
        fields: ['participation_id'],
      },
      {
        name: 'idx_marketing_id',
        fields: ['marketing_id'],
      },
      {
        name: 'idx_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_record_type',
        fields: ['record_type'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
    ],
  }
);

export { ActivityParticipationLog, ActivityParticipationLogAttributes, ActivityParticipationLogCreationAttributes, DataChangeDetail };
export default ActivityParticipationLog;

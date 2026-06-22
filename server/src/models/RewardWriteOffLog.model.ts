import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { WriteOffLogType, WriteOffVerificationSeverity } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface RewardWriteOffLogAttributes {
  id: string;
  writeOffId: string;
  writeOffNo: string;
  logType: WriteOffLogType;
  beforeStatus: number;
  afterStatus: number;
  operatorId?: string;
  operatorName?: string;
  beforeAmount?: number;
  afterAmount?: number;
  verificationResults?: any[];
  remark?: string;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

interface RewardWriteOffLogCreationAttributes extends Optional<RewardWriteOffLogAttributes, 'id' | 'operatorId' | 'operatorName' | 'beforeAmount' | 'afterAmount' | 'verificationResults' | 'remark' | 'reason' | 'ipAddress' | 'userAgent' | 'createdAt'> {}

class RewardWriteOffLog extends Model<RewardWriteOffLogAttributes, RewardWriteOffLogCreationAttributes> implements RewardWriteOffLogAttributes {
  public id!: string;
  public writeOffId!: string;
  public writeOffNo!: string;
  public logType!: WriteOffLogType;
  public beforeStatus!: number;
  public afterStatus!: number;
  public operatorId?: string;
  public operatorName?: string;
  public beforeAmount?: number;
  public afterAmount?: number;
  public verificationResults?: any[];
  public remark?: string;
  public reason?: string;
  public ipAddress?: string;
  public userAgent?: string;
  public readonly createdAt!: Date;
}

RewardWriteOffLog.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    writeOffId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'reward_write_offs',
        key: 'id',
      },
    },
    writeOffNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    logType: {
      type: DataTypes.ENUM(...Object.values(WriteOffLogType)),
      allowNull: false,
    },
    beforeStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    afterStatus: {
      type: DataTypes.TINYINT,
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
    beforeAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    afterAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    verificationResults: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    reason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    userAgent: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'reward_write_off_logs',
    timestamps: true,
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_write_off_id',
        fields: ['write_off_id'],
      },
      {
        name: 'idx_write_off_no',
        fields: ['write_off_no'],
      },
      {
        name: 'idx_log_type',
        fields: ['log_type'],
      },
      {
        name: 'idx_operator_id',
        fields: ['operator_id'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
    ],
  }
);

export { RewardWriteOffLog, RewardWriteOffLogAttributes, RewardWriteOffLogCreationAttributes };
export default RewardWriteOffLog;

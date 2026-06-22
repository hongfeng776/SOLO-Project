import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { RewardWriteOffStatus, RewardWriteOffType, WriteOffVerificationSeverity } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface WriteOffVerificationResult {
  code: string;
  name: string;
  passed: boolean;
  severity: WriteOffVerificationSeverity;
  message: string;
}

interface RewardWriteOffAttributes {
  id: string;
  writeOffNo: string;
  marketingId?: string;
  participationId?: string;
  userId: string;
  userType: string;
  type: RewardWriteOffType;
  rewardAmount: number;
  actualAmount: number;
  status: RewardWriteOffStatus;
  rewardRuleId?: string;
  rewardRuleSnapshot?: object;
  participationSnapshot?: object;
  orderId?: string;
  orderNo?: string;
  verificationResults?: WriteOffVerificationResult[];
  verifiedAt?: Date;
  verifiedBy?: string;
  verifiedRemark?: string;
  settledAt?: Date;
  settledBy?: string;
  settleRemark?: string;
  failedReason?: string;
  cancelledAt?: Date;
  cancelledBy?: string;
  cancelReason?: string;
  overriddenAt?: Date;
  overriddenBy?: string;
  overrideReason?: string;
  voucherNo?: string;
  channelId?: string;
  ipAddress?: string;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface RewardWriteOffCreationAttributes extends Optional<RewardWriteOffAttributes, 'id' | 'writeOffNo' | 'actualAmount' | 'status' | 'verificationResults' | 'remark' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class RewardWriteOff extends Model<RewardWriteOffAttributes, RewardWriteOffCreationAttributes> implements RewardWriteOffAttributes {
  public id!: string;
  public writeOffNo!: string;
  public marketingId?: string;
  public participationId?: string;
  public userId!: string;
  public userType!: string;
  public type!: RewardWriteOffType;
  public rewardAmount!: number;
  public actualAmount!: number;
  public status!: RewardWriteOffStatus;
  public rewardRuleId?: string;
  public rewardRuleSnapshot?: object;
  public participationSnapshot?: object;
  public orderId?: string;
  public orderNo?: string;
  public verificationResults?: WriteOffVerificationResult[];
  public verifiedAt?: Date;
  public verifiedBy?: string;
  public verifiedRemark?: string;
  public settledAt?: Date;
  public settledBy?: string;
  public settleRemark?: string;
  public failedReason?: string;
  public cancelledAt?: Date;
  public cancelledBy?: string;
  public cancelReason?: string;
  public overriddenAt?: Date;
  public overriddenBy?: string;
  public overrideReason?: string;
  public voucherNo?: string;
  public channelId?: string;
  public ipAddress?: string;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

RewardWriteOff.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    writeOffNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    marketingId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'marketings',
        key: 'id',
      },
    },
    participationId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'activity_participations',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.STRING(36),
      allowNull: false,
    },
    userType: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(RewardWriteOffType)),
      allowNull: false,
    },
    rewardAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    actualAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: RewardWriteOffStatus.PENDING,
    },
    rewardRuleId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    rewardRuleSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    participationSnapshot: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    orderId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    orderNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    verificationResults: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verifiedBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    verifiedRemark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    settledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    settledBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    settleRemark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    failedReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    cancelledBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    cancelReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    overriddenAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    overriddenBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    overrideReason: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    voucherNo: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    channelId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    remark: {
      type: DataTypes.STRING(500),
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
    tableName: 'reward_write_offs',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_write_off_no',
        fields: ['write_off_no'],
        unique: true,
      },
      {
        name: 'idx_marketing_id',
        fields: ['marketing_id'],
      },
      {
        name: 'idx_participation_id',
        fields: ['participation_id'],
      },
      {
        name: 'idx_user_id',
        fields: ['user_id'],
      },
      {
        name: 'idx_type',
        fields: ['type'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
      {
        name: 'idx_settled_at',
        fields: ['settled_at'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
      {
        name: 'idx_voucher_no',
        fields: ['voucher_no'],
      },
    ],
  }
);

export { RewardWriteOff, RewardWriteOffAttributes, RewardWriteOffCreationAttributes, WriteOffVerificationResult };
export default RewardWriteOff;

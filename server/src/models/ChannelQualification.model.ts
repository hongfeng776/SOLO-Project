import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ChannelQualificationType, VerifyStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ChannelQualificationAttributes {
  id: string;
  channelAuditId: string;
  type: ChannelQualificationType;
  title?: string;
  fileUrl: string;
  expireAt?: Date;
  verifyStatus: VerifyStatus;
  verifyRemark?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface ChannelQualificationCreationAttributes extends Optional<ChannelQualificationAttributes,
  'id' | 'verifyStatus' | 'createdAt' | 'updatedAt'> {}

class ChannelQualification extends Model<ChannelQualificationAttributes, ChannelQualificationCreationAttributes> implements ChannelQualificationAttributes {
  public id!: string;
  public channelAuditId!: string;
  public type!: ChannelQualificationType;
  public title?: string;
  public fileUrl!: string;
  public expireAt?: Date;
  public verifyStatus!: VerifyStatus;
  public verifyRemark?: string;
  public verifiedBy?: string;
  public verifiedAt?: Date;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChannelQualification.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    channelAuditId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: { model: 'channel_audits', key: 'id' },
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    expireAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    verifyStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: VerifyStatus.PENDING,
    },
    verifyRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    verifiedBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
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
  },
  {
    sequelize,
    tableName: 'channel_qualifications',
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'idx_channel_audit_id', fields: ['channel_audit_id'] },
      { name: 'idx_type', fields: ['type'] },
      { name: 'idx_verify_status', fields: ['verify_status'] },
    ],
  }
);

export { ChannelQualification, ChannelQualificationAttributes, ChannelQualificationCreationAttributes };
export default ChannelQualification;

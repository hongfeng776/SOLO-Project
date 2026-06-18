import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { QualificationType, VerifyStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface PromoterQualificationAttributes {
  id: string;
  promoterId: string;
  type: QualificationType;
  title?: string;
  fileUrl: string;
  expireAt?: Date;
  verifyStatus?: number;
  verifyRemark?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PromoterQualificationCreationAttributes extends Optional<PromoterQualificationAttributes, 'id' | 'title' | 'expireAt' | 'verifyStatus' | 'verifyRemark' | 'verifiedBy' | 'verifiedAt' | 'remark' | 'createdAt' | 'updatedAt'> {}

class PromoterQualification extends Model<PromoterQualificationAttributes, PromoterQualificationCreationAttributes> implements PromoterQualificationAttributes {
  public id!: string;
  public promoterId!: string;
  public type!: QualificationType;
  public title?: string;
  public fileUrl!: string;
  public expireAt?: Date;
  public verifyStatus?: number;
  public verifyRemark?: string;
  public verifiedBy?: string;
  public verifiedAt?: Date;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PromoterQualification.init(
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
    type: {
      type: DataTypes.STRING(30),
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
      defaultValue: VerifyStatus.UNVERIFIED,
    },
    verifyRemark: {
      type: DataTypes.STRING(500),
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
    tableName: 'promoter_qualifications',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
      {
        name: 'idx_type',
        fields: ['type'],
      },
      {
        name: 'idx_verify_status',
        fields: ['verify_status'],
      },
    ],
  }
);

export { PromoterQualification, PromoterQualificationAttributes, PromoterQualificationCreationAttributes };
export default PromoterQualification;

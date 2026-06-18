import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { RiskReleaseStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface PromoterRiskReleaseAttributes {
  id: string;
  promoterId: string;
  applicantId?: string;
  applicantName?: string;
  riskRecordId?: string;
  releaseReason: string;
  proofMaterials?: any;
  rectificationDesc?: string;
  abnormalDataCleared?: boolean;
  verifyStatus?: number;
  verifierId?: string;
  verifierName?: string;
  verifyRemark?: string;
  verifiedAt?: Date;
  restoreStage?: number;
  createdAt: Date;
  updatedAt: Date;
}

interface PromoterRiskReleaseCreationAttributes extends Optional<PromoterRiskReleaseAttributes, 'id' | 'applicantId' | 'applicantName' | 'riskRecordId' | 'proofMaterials' | 'rectificationDesc' | 'abnormalDataCleared' | 'verifyStatus' | 'verifierId' | 'verifierName' | 'verifyRemark' | 'verifiedAt' | 'restoreStage' | 'createdAt' | 'updatedAt'> {}

class PromoterRiskRelease extends Model<PromoterRiskReleaseAttributes, PromoterRiskReleaseCreationAttributes> implements PromoterRiskReleaseAttributes {
  public id!: string;
  public promoterId!: string;
  public applicantId?: string;
  public applicantName?: string;
  public riskRecordId?: string;
  public releaseReason!: string;
  public proofMaterials?: any;
  public rectificationDesc?: string;
  public abnormalDataCleared?: boolean;
  public verifyStatus?: number;
  public verifierId?: string;
  public verifierName?: string;
  public verifyRemark?: string;
  public verifiedAt?: Date;
  public restoreStage?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PromoterRiskRelease.init(
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
    riskRecordId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'promoter_risk_records',
        key: 'id',
      },
    },
    releaseReason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    proofMaterials: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('proofMaterials');
        return raw ? JSON.parse(raw) : null;
      },
      set(value: any) {
        this.setDataValue('proofMaterials', value ? JSON.stringify(value) : undefined as any);
      },
    },
    rectificationDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    abnormalDataCleared: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    verifyStatus: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: RiskReleaseStatus.PENDING,
    },
    verifierId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    verifierName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    verifyRemark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    restoreStage: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'promoter_risk_releases',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
      {
        name: 'idx_verify_status',
        fields: ['verify_status'],
      },
      {
        name: 'idx_risk_record_id',
        fields: ['risk_record_id'],
      },
    ],
  }
);

export { PromoterRiskRelease, PromoterRiskReleaseAttributes, PromoterRiskReleaseCreationAttributes };
export default PromoterRiskRelease;

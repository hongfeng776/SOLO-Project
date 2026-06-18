import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { RiskLevel, RiskType, RiskControlStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface PromoterRiskRecordAttributes {
  id: string;
  promoterId: string;
  riskLevel: string;
  riskType: string;
  riskTitle: string;
  riskDescription?: string;
  riskEvidence?: any;
  operatorId?: string;
  operatorName?: string;
  controlStatus?: number;
  permissionsSnapshot?: any;
  expireAt?: Date;
  isActive?: boolean;
  createdAt: Date;
}

interface PromoterRiskRecordCreationAttributes extends Optional<PromoterRiskRecordAttributes, 'id' | 'riskDescription' | 'riskEvidence' | 'operatorId' | 'operatorName' | 'controlStatus' | 'permissionsSnapshot' | 'expireAt' | 'isActive' | 'createdAt'> {}

class PromoterRiskRecord extends Model<PromoterRiskRecordAttributes, PromoterRiskRecordCreationAttributes> implements PromoterRiskRecordAttributes {
  public id!: string;
  public promoterId!: string;
  public riskLevel!: string;
  public riskType!: string;
  public riskTitle!: string;
  public riskDescription?: string;
  public riskEvidence?: any;
  public operatorId?: string;
  public operatorName?: string;
  public controlStatus?: number;
  public permissionsSnapshot?: any;
  public expireAt?: Date;
  public isActive?: boolean;
  public readonly createdAt!: Date;
}

PromoterRiskRecord.init(
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
    riskLevel: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    riskType: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    riskTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    riskDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    riskEvidence: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('riskEvidence');
        return raw ? JSON.parse(raw) : null;
      },
      set(value: any) {
        this.setDataValue('riskEvidence', value ? JSON.stringify(value) : undefined as any);
      },
    },
    operatorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    controlStatus: {
      type: DataTypes.TINYINT,
      allowNull: true,
      defaultValue: RiskControlStatus.NORMAL,
    },
    permissionsSnapshot: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('permissionsSnapshot');
        return raw ? JSON.parse(raw) : null;
      },
      set(value: any) {
        this.setDataValue('permissionsSnapshot', value ? JSON.stringify(value) : undefined as any);
      },
    },
    expireAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'promoter_risk_records',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
      {
        name: 'idx_risk_level',
        fields: ['risk_level'],
      },
      {
        name: 'idx_risk_type',
        fields: ['risk_type'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
      {
        name: 'idx_is_active',
        fields: ['is_active'],
      },
    ],
  }
);

export { PromoterRiskRecord, PromoterRiskRecordAttributes, PromoterRiskRecordCreationAttributes };
export default PromoterRiskRecord;

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { RiskWarningLevel } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface PromoterRiskWarningAttributes {
  id: string;
  promoterId: string;
  warningLevel?: string;
  warningType?: string;
  warningTitle: string;
  warningDesc?: string;
  ruleCode?: string;
  riskScore?: number;
  isHandled?: boolean;
  handledBy?: string;
  handledAt?: Date;
  handleRemark?: string;
  createdAt: Date;
}

interface PromoterRiskWarningCreationAttributes extends Optional<PromoterRiskWarningAttributes, 'id' | 'warningLevel' | 'warningType' | 'warningDesc' | 'ruleCode' | 'riskScore' | 'isHandled' | 'handledBy' | 'handledAt' | 'handleRemark' | 'createdAt'> {}

class PromoterRiskWarning extends Model<PromoterRiskWarningAttributes, PromoterRiskWarningCreationAttributes> implements PromoterRiskWarningAttributes {
  public id!: string;
  public promoterId!: string;
  public warningLevel?: string;
  public warningType?: string;
  public warningTitle!: string;
  public warningDesc?: string;
  public ruleCode?: string;
  public riskScore?: number;
  public isHandled?: boolean;
  public handledBy?: string;
  public handledAt?: Date;
  public handleRemark?: string;
  public readonly createdAt!: Date;
}

PromoterRiskWarning.init(
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
    warningLevel: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    warningType: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    warningTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    warningDesc: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ruleCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    riskScore: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    isHandled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    handledBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    handledAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    handleRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'promoter_risk_warnings',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
      {
        name: 'idx_warning_level',
        fields: ['warning_level'],
      },
      {
        name: 'idx_is_handled',
        fields: ['is_handled'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
    ],
  }
);

export { PromoterRiskWarning, PromoterRiskWarningAttributes, PromoterRiskWarningCreationAttributes };
export default PromoterRiskWarning;

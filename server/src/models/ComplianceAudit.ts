import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class ComplianceAudit extends Model<InferAttributes<ComplianceAudit>, InferCreationAttributes<ComplianceAudit>> {
  declare id: CreationOptional<number>;
  declare audit_no: string;
  declare audit_type: CreationOptional<string>;
  declare audit_status: CreationOptional<string>;
  declare target_type: CreationOptional<string>;
  declare target_id: CreationOptional<number>;
  declare risk_score: CreationOptional<number>;
  declare auditor_id: CreationOptional<number>;
  declare audit_opinion: CreationOptional<string>;
  declare audit_at: CreationOptional<Date>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

ComplianceAudit.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    audit_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    audit_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    audit_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    target_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    target_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    risk_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    auditor_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    audit_opinion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    audit_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'compliance_audit',
    paranoid: true,
  },
);

export default ComplianceAudit;

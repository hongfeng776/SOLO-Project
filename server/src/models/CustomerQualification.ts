import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class CustomerQualification extends Model<InferAttributes<CustomerQualification>, InferCreationAttributes<CustomerQualification>> {
  declare id: CreationOptional<number>;
  declare qualification_no: string;
  declare customer_id: number;
  declare customer_name: string;
  declare customer_type: string;
  declare qualification_status: string;
  declare review_type: string;
  declare qualification_level: string;
  declare documents: any[];
  declare missing_documents: string[];
  declare expired_documents: string[];
  declare fake_suspicious_documents: string[];
  declare issue_types: string[];
  declare issue_reasons: string[];
  declare reviewer_id: CreationOptional<number>;
  declare reviewer_name: CreationOptional<string>;
  declare review_opinion: CreationOptional<string>;
  declare review_at: CreationOptional<Date>;
  declare effective_date: Date;
  declare expiry_date: Date;
  declare expire_warning_sent: CreationOptional<boolean>;
  declare expire_warning_at: CreationOptional<Date>;
  declare permissions: string[];
  declare trading_allowed: CreationOptional<boolean>;
  declare customer_profile_synced: CreationOptional<boolean>;
  declare authenticity_check_passed: CreationOptional<boolean>;
  declare regulatory_compliance_score: CreationOptional<number>;
  declare last_recheck_at: CreationOptional<Date>;
  declare recheck_count: CreationOptional<number>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

CustomerQualification.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    qualification_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customer_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    customer_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    qualification_status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'pending',
    },
    review_type: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    qualification_level: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    documents: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    missing_documents: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    expired_documents: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    fake_suspicious_documents: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    issue_types: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    issue_reasons: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    reviewer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    reviewer_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    review_opinion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    review_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    effective_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    expire_warning_sent: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    expire_warning_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    permissions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    trading_allowed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    customer_profile_synced: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    authenticity_check_passed: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    regulatory_compliance_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
    },
    last_recheck_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    recheck_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
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
    tableName: 'customer_qualification',
    paranoid: true,
  },
);

export default CustomerQualification;

import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class TradeComplianceAudit extends Model<InferAttributes<TradeComplianceAudit>, InferCreationAttributes<TradeComplianceAudit>> {
  declare id: CreationOptional<number>;
  declare audit_no: string;
  declare trade_id: number;
  declare trade_no: string;
  declare customer_id: number;
  declare customer_name: string;
  declare stock_code: string;
  declare stock_name: string;
  declare trade_type: string;
  declare trade_amount: number;
  declare trade_quantity: number;
  declare trade_price: number;
  declare compliance_status: string;
  declare review_type: string;
  declare risk_category: string;
  declare risk_score: number;
  declare violation_types: string[];
  declare violation_reasons: string[];
  declare reviewer_id: CreationOptional<number>;
  declare reviewer_name: CreationOptional<string>;
  declare review_opinion: CreationOptional<string>;
  declare review_at: CreationOptional<Date>;
  declare timeout_flag: CreationOptional<boolean>;
  declare timeout_reminded_at: CreationOptional<Date>;
  declare order_status: string;
  declare compliance_deadline: CreationOptional<Date>;
  declare archive_id: CreationOptional<number>;
  declare synced_to_trade: CreationOptional<boolean>;
  declare synced_to_customer: CreationOptional<boolean>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

TradeComplianceAudit.init(
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
    trade_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    trade_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    customer_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    stock_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    stock_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    trade_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    trade_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    trade_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    trade_price: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true,
    },
    compliance_status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'pending',
    },
    review_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    risk_category: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: 'normal',
    },
    risk_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0,
    },
    violation_types: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    violation_reasons: {
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
    timeout_flag: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    timeout_reminded_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    order_status: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: 'pending',
    },
    compliance_deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    archive_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    synced_to_trade: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    synced_to_customer: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
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
    tableName: 'trade_compliance_audit',
    paranoid: true,
  },
);

export default TradeComplianceAudit;

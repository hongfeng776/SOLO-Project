import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class QuoteAuditTrail extends Model<InferAttributes<QuoteAuditTrail>, InferCreationAttributes<QuoteAuditTrail>> {
  declare id: CreationOptional<number>;
  declare stock_id: number;
  declare stock_code: string;
  declare operation_type: string;
  declare data_period: string;
  declare field_changes: CreationOptional<any>;
  declare previous_snapshot: CreationOptional<any>;
  declare new_snapshot: CreationOptional<any>;
  declare operator_id: number;
  declare operator_name: string;
  declare source_channel: string;
  declare data_source: string;
  declare remark: CreationOptional<string>;
  declare verification_status: CreationOptional<string>;
  declare consistency_score: CreationOptional<number>;
  declare accuracy_violations: CreationOptional<any>;
  declare readonly created_at: CreationOptional<Date>;
}

QuoteAuditTrail.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    stock_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'stock_quote',
        key: 'id',
      },
    },
    stock_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    operation_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    data_period: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    field_changes: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    previous_snapshot: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    new_snapshot: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    operator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    operator_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    source_channel: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    data_source: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    verification_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'pending',
    },
    consistency_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    accuracy_violations: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'quote_audit_trail',
    paranoid: false,
    timestamps: false,
  },
);

export default QuoteAuditTrail;

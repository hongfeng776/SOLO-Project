import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class TradeComplianceAuditLog extends Model<InferAttributes<TradeComplianceAuditLog>, InferCreationAttributes<TradeComplianceAuditLog>> {
  declare id: CreationOptional<number>;
  declare audit_id: number;
  declare audit_no: string;
  declare action: string;
  declare operator_id: number;
  declare operator_name: string;
  declare detail: CreationOptional<Record<string, any>>;
  declare consistency_check: CreationOptional<Record<string, any>>;
  declare violation_intercepted: CreationOptional<boolean>;
  declare violation_message: CreationOptional<string>;
  declare readonly created_at: CreationOptional<Date>;
}

TradeComplianceAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    audit_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    audit_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    operator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    operator_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    detail: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    consistency_check: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    violation_intercepted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    violation_message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'trade_compliance_audit_log',
    timestamps: false,
  },
);

export default TradeComplianceAuditLog;

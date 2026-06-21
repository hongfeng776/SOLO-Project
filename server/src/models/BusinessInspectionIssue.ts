import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class BusinessInspectionIssue extends Model<InferAttributes<BusinessInspectionIssue>, InferCreationAttributes<BusinessInspectionIssue>> {
  declare id: CreationOptional<number>;
  declare inspection_id: number;
  declare inspection_no: string;
  declare issue_no: string;
  declare scope: string;
  declare violation_level: string;
  declare issue_status: string;
  declare business_type: string;
  declare business_id: CreationOptional<number>;
  declare business_no: CreationOptional<string>;
  declare description: CreationOptional<string>;
  declare rule_code: CreationOptional<string>;
  declare rule_name: CreationOptional<string>;
  declare actual_value: CreationOptional<string>;
  declare expected_value: CreationOptional<string>;
  declare processed_by: CreationOptional<string>;
  declare processed_at: CreationOptional<Date>;
  declare process_note: CreationOptional<string>;
  declare rectify_evidence: CreationOptional<string>;
  declare archived: CreationOptional<boolean>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
}

BusinessInspectionIssue.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    inspection_id: { type: DataTypes.INTEGER, allowNull: false },
    inspection_no: { type: DataTypes.STRING(50), allowNull: false },
    issue_no: { type: DataTypes.STRING(50), allowNull: false },
    scope: { type: DataTypes.STRING(20), allowNull: true },
    violation_level: { type: DataTypes.STRING(20), allowNull: true, defaultValue: 'normal' },
    issue_status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
    business_type: { type: DataTypes.STRING(30), allowNull: true },
    business_id: { type: DataTypes.INTEGER, allowNull: true },
    business_no: { type: DataTypes.STRING(50), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    rule_code: { type: DataTypes.STRING(50), allowNull: true },
    rule_name: { type: DataTypes.STRING(100), allowNull: true },
    actual_value: { type: DataTypes.STRING(200), allowNull: true },
    expected_value: { type: DataTypes.STRING(200), allowNull: true },
    processed_by: { type: DataTypes.STRING(50), allowNull: true },
    processed_at: { type: DataTypes.DATE, allowNull: true },
    process_note: { type: DataTypes.TEXT, allowNull: true },
    rectify_evidence: { type: DataTypes.STRING(500), allowNull: true },
    archived: { type: DataTypes.BOOLEAN, allowNull: true, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'business_inspection_issue' },
);

export default BusinessInspectionIssue;

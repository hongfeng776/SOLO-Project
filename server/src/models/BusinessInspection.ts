import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class BusinessInspection extends Model<InferAttributes<BusinessInspection>, InferCreationAttributes<BusinessInspection>> {
  declare id: CreationOptional<number>;
  declare inspection_no: string;
  declare inspection_cycle: string;
  declare inspection_scopes: string[];
  declare inspection_status: string;
  declare config_params: any;
  declare scheduled_at: CreationOptional<Date>;
  declare started_at: CreationOptional<Date>;
  declare completed_at: CreationOptional<Date>;
  declare total_scanned: CreationOptional<number>;
  declare total_issues: CreationOptional<number>;
  declare minor_count: CreationOptional<number>;
  declare normal_count: CreationOptional<number>;
  declare severe_count: CreationOptional<number>;
  declare coverage_score: CreationOptional<number>;
  declare accuracy_score: CreationOptional<number>;
  declare report_id: CreationOptional<number>;
  declare report_url: CreationOptional<string>;
  declare operator_id: CreationOptional<number>;
  declare operator_name: CreationOptional<string>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

BusinessInspection.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    inspection_no: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    inspection_cycle: { type: DataTypes.STRING(20), allowNull: false },
    inspection_scopes: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    inspection_status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'configured' },
    config_params: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    scheduled_at: { type: DataTypes.DATE, allowNull: true },
    started_at: { type: DataTypes.DATE, allowNull: true },
    completed_at: { type: DataTypes.DATE, allowNull: true },
    total_scanned: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    total_issues: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    minor_count: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    normal_count: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    severe_count: { type: DataTypes.INTEGER, allowNull: true, defaultValue: 0 },
    coverage_score: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: 0 },
    accuracy_score: { type: DataTypes.DECIMAL(5, 2), allowNull: true, defaultValue: 0 },
    report_id: { type: DataTypes.INTEGER, allowNull: true },
    report_url: { type: DataTypes.STRING(500), allowNull: true },
    operator_id: { type: DataTypes.INTEGER, allowNull: true },
    operator_name: { type: DataTypes.STRING(50), allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
    updated_at: { type: DataTypes.DATE, allowNull: true },
    deleted_at: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'business_inspection', paranoid: true },
);

export default BusinessInspection;

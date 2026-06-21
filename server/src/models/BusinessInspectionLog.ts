import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class BusinessInspectionLog extends Model<InferAttributes<BusinessInspectionLog>, InferCreationAttributes<BusinessInspectionLog>> {
  declare id: CreationOptional<number>;
  declare inspection_id: number;
  declare inspection_no: string;
  declare action: string;
  declare operator_id: CreationOptional<number>;
  declare operator_name: string;
  declare detail: any;
  declare coverage_check: CreationOptional<any>;
  declare accuracy_check: CreationOptional<any>;
  declare intercept_type: CreationOptional<string>;
  declare intercept_message: CreationOptional<string>;
  declare created_at: CreationOptional<Date>;
}

BusinessInspectionLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    inspection_id: { type: DataTypes.INTEGER, allowNull: false },
    inspection_no: { type: DataTypes.STRING(50), allowNull: false },
    action: { type: DataTypes.STRING(50), allowNull: false },
    operator_id: { type: DataTypes.INTEGER, allowNull: true },
    operator_name: { type: DataTypes.STRING(50), allowNull: false },
    detail: { type: DataTypes.JSON, allowNull: true, defaultValue: {} },
    coverage_check: { type: DataTypes.JSON, allowNull: true },
    accuracy_check: { type: DataTypes.JSON, allowNull: true },
    intercept_type: { type: DataTypes.STRING(50), allowNull: true },
    intercept_message: { type: DataTypes.TEXT, allowNull: true },
    created_at: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'business_inspection_log', timestamps: false },
);

export default BusinessInspectionLog;

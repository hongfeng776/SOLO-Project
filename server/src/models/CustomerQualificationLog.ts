import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class CustomerQualificationLog extends Model<InferAttributes<CustomerQualificationLog>, InferCreationAttributes<CustomerQualificationLog>> {
  declare id: CreationOptional<number>;
  declare qualification_id: number;
  declare qualification_no: string;
  declare action: string;
  declare operator_id: CreationOptional<number>;
  declare operator_name: string;
  declare detail: any;
  declare authenticity_check: CreationOptional<any>;
  declare fake_intercepted: CreationOptional<boolean>;
  declare intercept_message: CreationOptional<string>;
  declare created_at: CreationOptional<Date>;
}

CustomerQualificationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    qualification_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    qualification_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    operator_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    operator_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    detail: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
    authenticity_check: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    fake_intercepted: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
    },
    intercept_message: {
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
    tableName: 'customer_qualification_log',
    timestamps: false,
  },
);

export default CustomerQualificationLog;

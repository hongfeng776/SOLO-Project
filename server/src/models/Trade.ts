import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class Trade extends Model<InferAttributes<Trade>, InferCreationAttributes<Trade>> {
  declare id: CreationOptional<number>;
  declare trade_no: string;
  declare customer_id: number;
  declare stock_id: number;
  declare stock_code: CreationOptional<string>;
  declare stock_name: CreationOptional<string>;
  declare trade_type: string;
  declare direction: string;
  declare price: number;
  declare quantity: number;
  declare trade_amount: CreationOptional<number>;
  declare commission: CreationOptional<number>;
  declare stamp_tax: CreationOptional<number>;
  declare total_fee: CreationOptional<number>;
  declare trade_status: CreationOptional<string>;
  declare need_audit: CreationOptional<boolean>;
  declare auditor_id: CreationOptional<number>;
  declare audit_opinion: CreationOptional<string>;
  declare audit_at: CreationOptional<Date>;
  declare frozen_amount: CreationOptional<number>;
  declare frozen_quantity: CreationOptional<number>;
  declare remark: CreationOptional<string>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

Trade.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    trade_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stock_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
      allowNull: false,
    },
    direction: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: false,
    },
    quantity: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    trade_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    commission: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    stamp_tax: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    total_fee: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    trade_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    need_audit: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false,
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
    frozen_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    frozen_quantity: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    remark: {
      type: DataTypes.STRING(500),
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
    tableName: 'trade',
    paranoid: true,
  },
);

export default Trade;

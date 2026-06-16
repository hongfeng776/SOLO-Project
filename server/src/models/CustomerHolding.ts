import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class CustomerHolding extends Model<InferAttributes<CustomerHolding>, InferCreationAttributes<CustomerHolding>> {
  declare id: CreationOptional<number>;
  declare customer_id: number;
  declare stock_id: CreationOptional<number>;
  declare stock_code: CreationOptional<string>;
  declare stock_name: CreationOptional<string>;
  declare holding_quantity: CreationOptional<number>;
  declare total_quantity: CreationOptional<number>;
  declare available_quantity: CreationOptional<number>;
  declare frozen_quantity: CreationOptional<number>;
  declare cost_price: CreationOptional<number>;
  declare total_cost: CreationOptional<number>;
  declare current_price: CreationOptional<number>;
  declare market_value: CreationOptional<number>;
  declare floating_profit: CreationOptional<number>;
  declare floating_profit_rate: CreationOptional<number>;
  declare last_trade_date: CreationOptional<Date>;
  declare first_buy_date: CreationOptional<string>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

CustomerHolding.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stock_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stock_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    stock_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    holding_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    total_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    available_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    frozen_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    cost_price: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    total_cost: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    current_price: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    market_value: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    floating_profit: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    floating_profit_rate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    last_trade_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    first_buy_date: {
      type: DataTypes.DATEONLY,
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
    tableName: 'customer_holding',
    paranoid: true,
    indexes: [
      {
        unique: true,
        fields: ['customer_id', 'stock_id'],
      },
    ],
  },
);

export default CustomerHolding;

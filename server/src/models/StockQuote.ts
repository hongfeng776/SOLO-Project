import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class StockQuote extends Model<InferAttributes<StockQuote>, InferCreationAttributes<StockQuote>> {
  declare id: CreationOptional<number>;
  declare stock_code: string;
  declare stock_name: string;
  declare market: CreationOptional<string>;
  declare status: CreationOptional<string>;
  declare sector: CreationOptional<string>;
  declare data_source: CreationOptional<string>;
  declare current_price: CreationOptional<number>;
  declare change_amount: CreationOptional<number>;
  declare change_rate: CreationOptional<number>;
  declare open_price: CreationOptional<number>;
  declare close_price: CreationOptional<number>;
  declare high_price: CreationOptional<number>;
  declare low_price: CreationOptional<number>;
  declare volume: CreationOptional<number>;
  declare turnover: CreationOptional<number>;
  declare amplitude: CreationOptional<number>;
  declare pe_ratio: CreationOptional<number>;
  declare pb_ratio: CreationOptional<number>;
  declare total_market_cap: CreationOptional<number>;
  declare circulate_market_cap: CreationOptional<number>;
  declare trade_date: CreationOptional<string>;
  declare last_sync_at: CreationOptional<Date>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

StockQuote.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    stock_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    stock_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    market: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'trading',
    },
    sector: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    data_source: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    current_price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    change_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    change_rate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    open_price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    close_price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    high_price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    low_price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    volume: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    turnover: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    amplitude: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    pe_ratio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    pb_ratio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    total_market_cap: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
    },
    circulate_market_cap: {
      type: DataTypes.DECIMAL(20, 2),
      allowNull: true,
    },
    trade_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    last_sync_at: {
      type: DataTypes.DATE,
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
    tableName: 'stock_quote',
    paranoid: true,
  },
);

export default StockQuote;

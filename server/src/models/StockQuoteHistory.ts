import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class StockQuoteHistory extends Model<InferAttributes<StockQuoteHistory>, InferCreationAttributes<StockQuoteHistory>> {
  declare id: CreationOptional<number>;
  declare stock_id: number;
  declare stock_code: string;
  declare stock_name: string;
  declare trade_date: string;
  declare open_price: CreationOptional<number>;
  declare close_price: CreationOptional<number>;
  declare high_price: CreationOptional<number>;
  declare low_price: CreationOptional<number>;
  declare current_price: CreationOptional<number>;
  declare change_amount: CreationOptional<number>;
  declare change_rate: CreationOptional<number>;
  declare volume: CreationOptional<number>;
  declare turnover: CreationOptional<number>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
}

StockQuoteHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    stock_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    stock_code: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    stock_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    trade_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
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
    volume: {
      type: DataTypes.BIGINT,
      allowNull: true,
    },
    turnover: {
      type: DataTypes.DECIMAL(18, 2),
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
  },
  {
    sequelize,
    tableName: 'stock_quote_history',
    indexes: [
      {
        name: 'stock_id_trade_date_unique',
        unique: true,
        fields: ['stock_id', 'trade_date'],
      },
    ],
  },
);

export default StockQuoteHistory;

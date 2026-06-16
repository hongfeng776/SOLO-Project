import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class CustomerAsset extends Model<InferAttributes<CustomerAsset>, InferCreationAttributes<CustomerAsset>> {
  declare id: CreationOptional<number>;
  declare customer_name: string;
  declare id_card: string;
  declare phone: CreationOptional<string>;
  declare total_asset: CreationOptional<number>;
  declare available_amount: CreationOptional<number>;
  declare frozen_amount: CreationOptional<number>;
  declare total_profit: CreationOptional<number>;
  declare total_cost: CreationOptional<number>;
  declare risk_level: CreationOptional<string>;
  declare customer_type: CreationOptional<string>;
  declare status: CreationOptional<string>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

CustomerAsset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    customer_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    id_card: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    total_asset: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    available_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    frozen_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    total_profit: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    total_cost: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    risk_level: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    customer_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
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
    tableName: 'customer_asset',
    paranoid: true,
  },
);

export default CustomerAsset;

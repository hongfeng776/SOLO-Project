import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class AssetProduct extends Model<InferAttributes<AssetProduct>, InferCreationAttributes<AssetProduct>> {
  declare id: CreationOptional<number>;
  declare product_code: string;
  declare product_name: string;
  declare product_type: CreationOptional<string>;
  declare risk_level: CreationOptional<string>;
  declare nav: CreationOptional<number>;
  declare acc_nav: CreationOptional<number>;
  declare daily_yield: CreationOptional<number>;
  declare annual_yield: CreationOptional<number>;
  declare product_status: CreationOptional<string>;
  declare min_amount: CreationOptional<number>;
  declare max_amount: CreationOptional<number>;
  declare manager: CreationOptional<string>;
  declare custodian: CreationOptional<string>;
  declare raise_start_date: CreationOptional<string>;
  declare raise_end_date: CreationOptional<string>;
  declare maturity_date: CreationOptional<string>;
  declare product_desc: CreationOptional<string>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

AssetProduct.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    product_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    product_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    product_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    risk_level: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    nav: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    acc_nav: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: true,
    },
    daily_yield: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    annual_yield: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    product_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    min_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    max_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    manager: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    custodian: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    raise_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    raise_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    maturity_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    product_desc: {
      type: DataTypes.TEXT,
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
    tableName: 'asset_product',
    paranoid: true,
  },
);

export default AssetProduct;

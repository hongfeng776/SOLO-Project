import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class RiskAlert extends Model<InferAttributes<RiskAlert>, InferCreationAttributes<RiskAlert>> {
  declare id: CreationOptional<number>;
  declare alert_no: string;
  declare alert_type: CreationOptional<string>;
  declare alert_level: CreationOptional<string>;
  declare alert_status: CreationOptional<string>;
  declare customer_id: CreationOptional<number>;
  declare stock_id: CreationOptional<number>;
  declare trade_id: CreationOptional<number>;
  declare alert_title: CreationOptional<string>;
  declare title: CreationOptional<string>;
  declare alert_content: CreationOptional<string>;
  declare content: CreationOptional<string>;
  declare risk_score: CreationOptional<number>;
  declare related_data: CreationOptional<any>;
  declare resolver_id: CreationOptional<number>;
  declare handler_id: CreationOptional<number>;
  declare resolve_opinion: CreationOptional<string>;
  declare handle_opinion: CreationOptional<string>;
  declare resolve_at: CreationOptional<Date>;
  declare handle_at: CreationOptional<Date>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

RiskAlert.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    alert_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    alert_type: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    alert_level: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    alert_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'pending',
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stock_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    trade_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    alert_title: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    alert_content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    risk_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    related_data: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    resolver_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    handler_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    resolve_opinion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    handle_opinion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    resolve_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    handle_at: {
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
    tableName: 'risk_alert',
    paranoid: true,
  },
);

export default RiskAlert;

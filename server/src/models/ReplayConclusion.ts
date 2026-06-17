import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class ReplayConclusion extends Model<InferAttributes<ReplayConclusion>, InferCreationAttributes<ReplayConclusion>> {
  declare id: CreationOptional<number>;
  declare session_id: number;
  declare stock_code: string;
  declare stock_name: string;
  declare sector: CreationOptional<string>;
  declare period_label: CreationOptional<string>;
  declare normal_days: CreationOptional<number>;
  declare abnormal_days: CreationOptional<number>;
  declare suspended_days: CreationOptional<number>;
  declare peak_price: CreationOptional<number>;
  declare valley_price: CreationOptional<number>;
  declare avg_change_rate: CreationOptional<number>;
  declare volatility_index: CreationOptional<number>;
  declare comparison_score: CreationOptional<number>;
  declare conclusion_text: CreationOptional<string>;
  declare suggestion: CreationOptional<string>;
  declare readonly created_at: CreationOptional<Date>;
}

ReplayConclusion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    session_id: {
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
    sector: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    period_label: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    normal_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    abnormal_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    suspended_days: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    peak_price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    valley_price: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    avg_change_rate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    volatility_index: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    comparison_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    conclusion_text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    suggestion: {
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
    tableName: 'replay_conclusion',
    timestamps: false,
    indexes: [
      {
        name: 'session_id_idx',
        fields: ['session_id'],
      },
      {
        name: 'stock_code_idx',
        fields: ['stock_code'],
      },
    ],
  },
);

export default ReplayConclusion;

import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export type ThresholdType = 'change_rate' | 'volume' | 'turnover';
export type ScopeType = 'global' | 'sector';
export type ConfigStatus = 'permanent' | 'temporary' | 'expired';

class QuoteThreshold extends Model<InferAttributes<QuoteThreshold>, InferCreationAttributes<QuoteThreshold>> {
  declare id: CreationOptional<number>;
  declare threshold_type: ThresholdType;
  declare sector: string;
  declare operator: CreationOptional<string>;
  declare min_value: number;
  declare max_value: number;
  declare warning_threshold: number;
  declare trigger_threshold: number;
  declare scope_type: ScopeType;
  declare config_status: ConfigStatus;
  declare effective_start: Date;
  declare effective_end: Date | null;
  declare version: number;
  declare remark: CreationOptional<string>;
  declare created_by: number;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

QuoteThreshold.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    threshold_type: {
      type: DataTypes.ENUM('change_rate', 'volume', 'turnover'),
      allowNull: false,
    },
    sector: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'GLOBAL',
    },
    operator: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    min_value: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
    max_value: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
    warning_threshold: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
    trigger_threshold: {
      type: DataTypes.DECIMAL(18, 4),
      allowNull: false,
    },
    scope_type: {
      type: DataTypes.ENUM('global', 'sector'),
      allowNull: false,
    },
    config_status: {
      type: DataTypes.ENUM('permanent', 'temporary', 'expired'),
      allowNull: false,
      defaultValue: 'permanent',
    },
    effective_start: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    effective_end: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    tableName: 'quote_threshold',
    paranoid: true,
    indexes: [
      {
        unique: true,
        name: 'uq_threshold_type_scope_sector_version',
        fields: ['threshold_type', 'scope_type', 'sector', 'version'],
      },
    ],
  },
);

export default QuoteThreshold;

import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class ReplaySession extends Model<InferAttributes<ReplaySession>, InferCreationAttributes<ReplaySession>> {
  declare id: CreationOptional<number>;
  declare session_name: string;
  declare start_date: string;
  declare end_date: string;
  declare sector: CreationOptional<string>;
  declare change_rate_min: CreationOptional<number>;
  declare change_rate_max: CreationOptional<number>;
  declare status: CreationOptional<string>;
  declare completeness_score: CreationOptional<number>;
  declare conclusion: CreationOptional<string>;
  declare created_by: CreationOptional<number>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

ReplaySession.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    session_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    sector: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    change_rate_min: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    change_rate_max: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'normal',
    },
    completeness_score: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    conclusion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
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
    tableName: 'replay_session',
    paranoid: true,
  },
);

export default ReplaySession;

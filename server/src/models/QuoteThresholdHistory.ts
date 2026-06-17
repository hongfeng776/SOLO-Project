import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export type ChangeType = 'create' | 'update' | 'delete' | 'expire';

class QuoteThresholdHistory extends Model<
  InferAttributes<QuoteThresholdHistory>,
  InferCreationAttributes<QuoteThresholdHistory>
> {
  declare id: CreationOptional<number>;
  declare threshold_id: number;
  declare change_type: ChangeType;
  declare before_snapshot: Record<string, unknown> | null;
  declare after_snapshot: Record<string, unknown> | null;
  declare conflict_check_result: Record<string, unknown> | null;
  declare operator_id: number;
  declare operator_name: string;
  declare remark: CreationOptional<string>;
  declare readonly created_at: CreationOptional<Date>;
}

QuoteThresholdHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    threshold_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'quote_threshold',
        key: 'id',
      },
    },
    change_type: {
      type: DataTypes.ENUM('create', 'update', 'delete', 'expire'),
      allowNull: false,
    },
    before_snapshot: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    after_snapshot: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    conflict_check_result: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    operator_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    operator_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    remark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'quote_threshold_history',
    timestamps: false,
    indexes: [
      {
        name: 'idx_threshold_id',
        fields: ['threshold_id'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
    ],
  },
);

export default QuoteThresholdHistory;

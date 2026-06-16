import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

class FundFlow extends Model<InferAttributes<FundFlow>, InferCreationAttributes<FundFlow>> {
  declare id: CreationOptional<number>;
  declare flow_no: string;
  declare customer_id: number;
  declare asset_id: number;
  declare flow_type: CreationOptional<string>;
  declare amount: CreationOptional<number>;
  declare balance_after: CreationOptional<number>;
  declare flow_status: CreationOptional<string>;
  declare channel: CreationOptional<string>;
  declare remark: CreationOptional<string>;
  declare readonly created_at: CreationOptional<Date>;
  declare readonly updated_at: CreationOptional<Date>;
  declare deleted_at: CreationOptional<Date>;
}

FundFlow.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    flow_no: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    customer_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    asset_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    flow_type: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    balance_after: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
    },
    flow_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    channel: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    remark: {
      type: DataTypes.STRING(500),
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
    tableName: 'fund_flow',
    paranoid: true,
  },
);

export default FundFlow;

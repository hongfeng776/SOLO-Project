import { Model, InferAttributes, InferCreationAttributes, CreationOptional, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export enum ArchiveStatus {
  FORMAL = 'formal',
  TEMPORARY = 'temporary',
  EXPIRED = 'expired',
}

export enum FilingStatus {
  NOT_FILED = 'not_filed',
  FILING = 'filing',
  FILED = 'filed',
  REJECTED = 'rejected',
}

export enum AccountStatus {
  NOT_OPENED = 'not_opened',
  OPENING = 'opening',
  OPENED = 'opened',
  CLOSED = 'closed',
}

class CustomerAsset extends Model<InferAttributes<CustomerAsset>, InferCreationAttributes<CustomerAsset>> {
  declare id: CreationOptional<number>;
  declare asset_account_no: CreationOptional<string>;
  declare customer_name: string;
  declare customer_type: string;
  declare id_card: string;
  declare phone: CreationOptional<string>;
  declare email: CreationOptional<string>;
  declare address: CreationOptional<string>;

  declare filing_status: CreationOptional<string>;
  declare account_status: CreationOptional<string>;
  declare archive_status: CreationOptional<string>;

  declare institution_name: CreationOptional<string>;
  declare institution_code: CreationOptional<string>;
  declare legal_representative: CreationOptional<string>;
  declare legal_rep_id_card: CreationOptional<string>;
  declare business_license: CreationOptional<string>;
  declare unified_social_credit: CreationOptional<string>;

  declare gender: CreationOptional<string>;
  declare birthday: CreationOptional<string>;
  declare occupation: CreationOptional<string>;
  declare work_unit: CreationOptional<string>;
  declare education: CreationOptional<string>;
  declare marital_status: CreationOptional<string>;

  declare total_asset: CreationOptional<number>;
  declare available_amount: CreationOptional<number>;
  declare frozen_amount: CreationOptional<number>;
  declare total_profit: CreationOptional<number>;
  declare total_cost: CreationOptional<number>;
  declare risk_level: CreationOptional<string>;

  declare trade_account_no: CreationOptional<string>;
  declare initial_deposit: CreationOptional<number>;
  declare account_open_date: CreationOptional<string>;

  declare source_materials: CreationOptional<string>;
  declare created_by: CreationOptional<number>;
  declare created_by_name: CreationOptional<string>;
  declare archive_time: CreationOptional<Date>;
  declare last_modified_by: CreationOptional<number>;
  declare last_modified_by_name: CreationOptional<string>;
  declare temporary_expire_at: CreationOptional<Date>;

  declare status: CreationOptional<string>;
  declare remark: CreationOptional<string>;
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
    asset_account_no: {
      type: DataTypes.STRING(32),
      allowNull: true,
      unique: true,
    },
    customer_name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    customer_type: {
      type: DataTypes.STRING(20),
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
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    address: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    filing_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: FilingStatus.NOT_FILED,
    },
    account_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: AccountStatus.NOT_OPENED,
    },
    archive_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: ArchiveStatus.TEMPORARY,
    },
    institution_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    institution_code: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    legal_representative: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    legal_rep_id_card: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    business_license: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    unified_social_credit: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    gender: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    birthday: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    occupation: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    work_unit: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    education: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    marital_status: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    total_asset: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
    },
    available_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
    },
    frozen_amount: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
    },
    total_profit: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
    },
    total_cost: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
    },
    risk_level: {
      type: DataTypes.STRING(5),
      allowNull: true,
    },
    trade_account_no: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    initial_deposit: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      defaultValue: 0,
    },
    account_open_date: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    source_materials: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    created_by_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    archive_time: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    last_modified_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    last_modified_by_name: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    temporary_expire_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: true,
      defaultValue: 'normal',
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
    tableName: 'customer_asset',
    paranoid: true,
  },
);

export default CustomerAsset;

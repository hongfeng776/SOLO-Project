import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { WithdrawStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface WithdrawAttributes {
  id: string;
  withdrawNo: string;
  promoterId: string;
  amount: number;
  fee?: number;
  actualAmount: number;
  status: WithdrawStatus;
  payMethod: number;
  accountInfo?: any;
  auditRemark?: string;
  auditAt?: Date;
  auditUserId?: string;
  payTime?: Date;
  payRemark?: string;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface WithdrawCreationAttributes extends Optional<WithdrawAttributes, 'id' | 'fee' | 'actualAmount' | 'status' | 'payMethod' | 'accountInfo' | 'auditRemark' | 'auditAt' | 'auditUserId' | 'payTime' | 'payRemark' | 'remark' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Withdraw extends Model<WithdrawAttributes, WithdrawCreationAttributes> implements WithdrawAttributes {
  public id!: string;
  public withdrawNo!: string;
  public promoterId!: string;
  public amount!: number;
  public fee?: number;
  public actualAmount!: number;
  public status!: WithdrawStatus;
  public payMethod!: number;
  public accountInfo?: any;
  public auditRemark?: string;
  public auditAt?: Date;
  public auditUserId?: string;
  public payTime?: Date;
  public payRemark?: string;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Withdraw.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    withdrawNo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    promoterId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'promoters',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    fee: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    actualAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: WithdrawStatus.PENDING,
    },
    payMethod: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 1,
    },
    accountInfo: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    auditRemark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    auditAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    auditUserId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    payTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    payRemark: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'withdraws',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_withdraw_no',
        fields: ['withdraw_no'],
      },
      {
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
      {
        name: 'idx_pay_method',
        fields: ['pay_method'],
      },
      {
        name: 'idx_audit_user_id',
        fields: ['audit_user_id'],
      },
    ],
  }
);

export { Withdraw, WithdrawAttributes, WithdrawCreationAttributes };
export default Withdraw;

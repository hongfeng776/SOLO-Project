import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OperationLogAttributes {
  id: number;
  userId?: number;
  username?: string;
  module: string;
  action: string;
  method: string;
  params?: string;
  result?: string;
  ip?: string;
  userAgent?: string;
  status: number;
  costTime?: number;
  errorMsg?: string;
}

interface OperationLogCreationAttributes
  extends Optional<OperationLogAttributes, 'id' | 'status'> {}

class OperationLog
  extends Model<OperationLogAttributes, OperationLogCreationAttributes>
  implements OperationLogAttributes
{
  public id!: number;
  public userId?: number;
  public username?: string;
  public module!: string;
  public action!: string;
  public method!: string;
  public params?: string;
  public result?: string;
  public ip?: string;
  public userAgent?: string;
  public status!: number;
  public costTime?: number;
  public errorMsg?: string;

  public readonly created_at!: Date;
}

OperationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    userId: {
      type: DataTypes.INTEGER,
      comment: '操作用户ID',
    },
    username: {
      type: DataTypes.STRING(50),
      comment: '操作用户名',
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作模块',
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '操作描述',
    },
    method: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '请求方法',
    },
    params: {
      type: DataTypes.TEXT,
      comment: '请求参数',
    },
    result: {
      type: DataTypes.TEXT,
      comment: '返回结果',
    },
    ip: {
      type: DataTypes.STRING(50),
      comment: '操作IP',
    },
    userAgent: {
      type: DataTypes.STRING(500),
      comment: '用户代理',
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态 1-成功 0-失败',
    },
    costTime: {
      type: DataTypes.INTEGER,
      comment: '耗时(ms)',
    },
    errorMsg: {
      type: DataTypes.TEXT,
      comment: '错误信息',
    },
  },
  {
    sequelize,
    tableName: 'operation_log',
    comment: '操作日志表',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at',
  }
);

export default OperationLog;

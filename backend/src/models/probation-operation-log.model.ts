import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ProbationOperationAction } from '../constants/recruitment.enum';

interface ProbationOperationLogAttributes {
  id: number;
  probationId: number;
  action: ProbationOperationAction;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  beforeData?: any;
  afterData?: any;
  changedFields?: any;
  remark?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ProbationOperationLogCreationAttributes
  extends Optional<ProbationOperationLogAttributes, 'id'> {}

class ProbationOperationLog
  extends Model<ProbationOperationLogAttributes, ProbationOperationLogCreationAttributes>
  implements ProbationOperationLogAttributes
{
  public id!: number;
  public probationId!: number;
  public action!: ProbationOperationAction;
  public operatorId?: number;
  public operatorName?: string;
  public operatorRole?: string;
  public beforeData?: any;
  public afterData?: any;
  public changedFields?: any;
  public remark?: string;
  public ipAddress?: string;
  public userAgent?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

ProbationOperationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    probationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '试用期记录ID',
    },
    action: {
      type: DataTypes.ENUM(
        'create',
        'update',
        'extend',
        'pass',
        'fail',
        'set_assessment',
        'batch_set_assessment',
        'batch_update_status',
        'status_sync'
      ),
      allowNull: false,
      comment: '操作类型',
    },
    operatorId: {
      type: DataTypes.INTEGER,
      comment: '操作人ID',
    },
    operatorName: {
      type: DataTypes.STRING(50),
      comment: '操作人姓名',
    },
    operatorRole: {
      type: DataTypes.STRING(30),
      comment: '操作人角色',
    },
    beforeData: {
      type: DataTypes.JSON,
      comment: '操作前数据（JSON）',
    },
    afterData: {
      type: DataTypes.JSON,
      comment: '操作后数据（JSON）',
    },
    changedFields: {
      type: DataTypes.JSON,
      comment: '变更字段列表（JSON数组）',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '操作备注/说明',
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      comment: '操作IP地址',
    },
    userAgent: {
      type: DataTypes.STRING(500),
      comment: '操作UA',
    },
  },
  {
    sequelize,
    tableName: 'probation_operation_log',
    comment: '试用期操作日志表',
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['probationId'] },
      { fields: ['action'] },
      { fields: ['operatorId'] },
      { fields: ['created_at'] },
    ],
  }
);

export default ProbationOperationLog;

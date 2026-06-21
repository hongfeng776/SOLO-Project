import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { RegularizationOperationAction } from '../constants/recruitment.enum';

interface RegularizationOperationLogAttributes {
  id: number;
  regularizationId: number;
  action: RegularizationOperationAction;
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

interface RegularizationOperationLogCreationAttributes
  extends Optional<RegularizationOperationLogAttributes, 'id'> {}

class RegularizationOperationLog extends Model<
  RegularizationOperationLogAttributes,
  RegularizationOperationLogCreationAttributes
> implements RegularizationOperationLogAttributes {
  public id!: number;
  public regularizationId!: number;
  public action!: RegularizationOperationAction;
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

RegularizationOperationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    regularizationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '转正申请ID',
    },
    action: {
      type: DataTypes.ENUM(
        'create_apply',
        'submit_apply',
        'approve_node',
        'reject_node',
        'resubmit',
        'approve_final',
        'reject_final',
        'batch_apply',
        'batch_approve',
        'status_sync',
        'modify_data'
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
    tableName: 'regularization_operation_log',
    comment: '转正申请操作日志表',
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['regularizationId'] },
      { fields: ['action'] },
      { fields: ['operatorId'] },
      { fields: ['created_at'] },
    ],
  }
);

export default RegularizationOperationLog;
export type {
  RegularizationOperationLogAttributes,
  RegularizationOperationLogCreationAttributes,
};

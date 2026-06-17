import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum JobOperationAction {
  CREATE = 'create',
  UPDATE = 'update',
  SUBMIT_AUDIT = 'submit_audit',
  APPROVE = 'approve',
  REJECT = 'reject',
  PUBLISH = 'publish',
  CLOSE = 'close',
  PAUSE = 'pause',
  DELETE = 'delete',
  BATCH_CREATE = 'batch_create',
  BATCH_SUBMIT = 'batch_submit',
  BATCH_APPROVE = 'batch_approve',
}

export const JobOperationActionLabel: Record<JobOperationAction, string> = {
  [JobOperationAction.CREATE]: '创建岗位',
  [JobOperationAction.UPDATE]: '编辑岗位',
  [JobOperationAction.SUBMIT_AUDIT]: '提交审核',
  [JobOperationAction.APPROVE]: '审核通过',
  [JobOperationAction.REJECT]: '审核驳回',
  [JobOperationAction.PUBLISH]: '发布岗位',
  [JobOperationAction.CLOSE]: '关闭岗位',
  [JobOperationAction.PAUSE]: '暂停岗位',
  [JobOperationAction.DELETE]: '删除岗位',
  [JobOperationAction.BATCH_CREATE]: '批量创建',
  [JobOperationAction.BATCH_SUBMIT]: '批量提交',
  [JobOperationAction.BATCH_APPROVE]: '批量审核',
};

interface JobOperationLogAttributes {
  id: number;
  jobId: number;
  action: JobOperationAction;
  fromStatus?: string;
  toStatus?: string;
  operatorId?: number;
  operatorName?: string;
  remark?: string;
  changedFields?: string;
  oldValues?: string;
  newValues?: string;
  ip?: string;
}

interface JobOperationLogCreationAttributes extends Optional<JobOperationLogAttributes, 'id'> {}

class JobOperationLog extends Model<JobOperationLogAttributes, JobOperationLogCreationAttributes> implements JobOperationLogAttributes {
  public id!: number;
  public jobId!: number;
  public action!: JobOperationAction;
  public fromStatus?: string;
  public toStatus?: string;
  public operatorId?: number;
  public operatorName?: string;
  public remark?: string;
  public changedFields?: string;
  public oldValues?: string;
  public newValues?: string;
  public ip?: string;

  public readonly created_at!: Date;
}

JobOperationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '岗位ID',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作类型',
    },
    fromStatus: {
      type: DataTypes.STRING(50),
      comment: '操作前状态',
    },
    toStatus: {
      type: DataTypes.STRING(50),
      comment: '操作后状态',
    },
    operatorId: {
      type: DataTypes.INTEGER,
      comment: '操作人ID',
    },
    operatorName: {
      type: DataTypes.STRING(50),
      comment: '操作人姓名',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '操作备注/原因',
    },
    changedFields: {
      type: DataTypes.STRING(500),
      comment: '变更字段，逗号分隔',
    },
    oldValues: {
      type: DataTypes.TEXT,
      comment: '旧值 JSON',
    },
    newValues: {
      type: DataTypes.TEXT,
      comment: '新值 JSON',
    },
    ip: {
      type: DataTypes.STRING(50),
      comment: '操作IP',
    },
  },
  {
    sequelize,
    tableName: 'job_operation_log',
    comment: '岗位操作日志表',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at',
    indexes: [
      { fields: ['jobId'] },
      { fields: ['action'] },
      { fields: ['operatorId'] },
    ],
  }
);

export default JobOperationLog;

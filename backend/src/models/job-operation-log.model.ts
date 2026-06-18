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
  SUBMIT_CHANGE_AUDIT = 'submit_change_audit',
  APPROVE_CHANGE = 'approve_change',
  REJECT_CHANGE = 'reject_change',
  BATCH_UPDATE = 'batch_update',
  CANCEL_CHANGE = 'cancel_change',
  ROLLBACK_VERSION = 'rollback_version',
  UPDATE_MATCH_WEIGHT = 'update_match_weight',
  MARK_ABNORMAL = 'mark_abnormal',
  CLEAR_ABNORMAL = 'clear_abnormal',
  ONLINE = 'online',
  OFFLINE = 'offline',
  BATCH_ONLINE = 'batch_online',
  BATCH_OFFLINE = 'batch_offline',
  MARK_RISK_WARNING = 'mark_risk_warning',
  CLEAR_RISK_WARNING = 'clear_risk_warning',
  ENABLE_RESUME_COLLECT = 'enable_resume_collect',
  DISABLE_RESUME_COLLECT = 'disable_resume_collect',
  ENABLE_SMART_MATCH = 'enable_smart_match',
  DISABLE_SMART_MATCH = 'disable_smart_match',
  ENABLE_EXPOSURE_PUSH = 'enable_exposure_push',
  DISABLE_EXPOSURE_PUSH = 'disable_exposure_push',
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
  [JobOperationAction.SUBMIT_CHANGE_AUDIT]: '提交变更审核',
  [JobOperationAction.APPROVE_CHANGE]: '变更审核通过',
  [JobOperationAction.REJECT_CHANGE]: '变更审核驳回',
  [JobOperationAction.BATCH_UPDATE]: '批量更新',
  [JobOperationAction.CANCEL_CHANGE]: '取消变更',
  [JobOperationAction.ROLLBACK_VERSION]: '回滚版本',
  [JobOperationAction.UPDATE_MATCH_WEIGHT]: '更新匹配权重',
  [JobOperationAction.MARK_ABNORMAL]: '标记异常',
  [JobOperationAction.CLEAR_ABNORMAL]: '解除异常',
  [JobOperationAction.ONLINE]: '岗位上架',
  [JobOperationAction.OFFLINE]: '岗位下架',
  [JobOperationAction.BATCH_ONLINE]: '批量上架',
  [JobOperationAction.BATCH_OFFLINE]: '批量下架',
  [JobOperationAction.MARK_RISK_WARNING]: '标记风控预警',
  [JobOperationAction.CLEAR_RISK_WARNING]: '解除风控预警',
  [JobOperationAction.ENABLE_RESUME_COLLECT]: '开启简历收录',
  [JobOperationAction.DISABLE_RESUME_COLLECT]: '关闭简历收录',
  [JobOperationAction.ENABLE_SMART_MATCH]: '开启智能匹配',
  [JobOperationAction.DISABLE_SMART_MATCH]: '关闭智能匹配',
  [JobOperationAction.ENABLE_EXPOSURE_PUSH]: '开启曝光推送',
  [JobOperationAction.DISABLE_EXPOSURE_PUSH]: '关闭曝光推送',
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

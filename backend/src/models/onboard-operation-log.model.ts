import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { OnboardOperationAction } from '../constants/recruitment.enum';

interface OnboardOperationLogAttributes {
  id: number;
  onboardId: number;
  action: OnboardOperationAction;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  beforeData?: string;
  afterData?: string;
  changedFields?: string;
  remark?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface OnboardOperationLogCreationAttributes
  extends Optional<OnboardOperationLogAttributes, 'id'> {}

class OnboardOperationLog
  extends Model<OnboardOperationLogAttributes, OnboardOperationLogCreationAttributes>
  implements OnboardOperationLogAttributes
{
  public id!: number;
  public onboardId!: number;
  public action!: OnboardOperationAction;
  public operatorId?: number;
  public operatorName?: string;
  public operatorRole?: string;
  public beforeData?: string;
  public afterData?: string;
  public changedFields?: string;
  public remark?: string;
  public ipAddress?: string;
  public userAgent?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

OnboardOperationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    onboardId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '入职记录ID',
    },
    action: {
      type: DataTypes.ENUM(
        'create',
        'update',
        'submit',
        'approve',
        'reject',
        'resubmit',
        'mark_onboarded',
        'batch_create',
        'batch_submit',
        'batch_approve'
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
      type: DataTypes.TEXT,
      comment: '操作前数据（JSON）',
    },
    afterData: {
      type: DataTypes.TEXT,
      comment: '操作后数据（JSON）',
    },
    changedFields: {
      type: DataTypes.TEXT,
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
    tableName: 'onboard_operation_log',
    comment: '入职操作日志表',
    indexes: [
      { fields: ['onboardId'] },
      { fields: ['action'] },
      { fields: ['operatorId'] },
      { fields: ['created_at'] },
    ],
  }
);

export default OnboardOperationLog;

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { InterviewAction, InterviewSessionStatus } from '../constants/recruitment.enum';

interface InterviewOperationLogAttributes {
  id: number;
  interviewId: number;
  action: InterviewAction;
  operatorId?: number;
  operatorName?: string;
  beforeStatus?: InterviewSessionStatus;
  afterStatus?: InterviewSessionStatus;
  beforeData?: string;
  afterData?: string;
  remark?: string;
  ip?: string;
  userAgent?: string;
}

interface InterviewOperationLogCreationAttributes extends Optional<InterviewOperationLogAttributes, 'id'> {}

class InterviewOperationLog extends Model<InterviewOperationLogAttributes, InterviewOperationLogCreationAttributes> implements InterviewOperationLogAttributes {
  public id!: number;
  public interviewId!: number;
  public action!: InterviewAction;
  public operatorId?: number;
  public operatorName?: string;
  public beforeStatus?: InterviewSessionStatus;
  public afterStatus?: InterviewSessionStatus;
  public beforeData?: string;
  public afterData?: string;
  public remark?: string;
  public ip?: string;
  public userAgent?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InterviewOperationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    interviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '面试记录ID',
    },
    action: {
      type: DataTypes.ENUM(
        'create', 'appoint', 'confirm', 'complete', 'cancel',
        'update', 'batch_appoint', 'batch_cancel', 'batch_sort'
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
    beforeStatus: {
      type: DataTypes.ENUM('pending_appoint', 'appointed', 'pending_interview', 'completed', 'cancelled'),
      comment: '操作前面试场次状态',
    },
    afterStatus: {
      type: DataTypes.ENUM('pending_appoint', 'appointed', 'pending_interview', 'completed', 'cancelled'),
      comment: '操作后面试场次状态',
    },
    beforeData: {
      type: DataTypes.TEXT,
      comment: '操作前数据快照(JSON)',
    },
    afterData: {
      type: DataTypes.TEXT,
      comment: '操作后数据快照(JSON)',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '操作备注',
    },
    ip: {
      type: DataTypes.STRING(50),
      comment: '操作IP地址',
    },
    userAgent: {
      type: DataTypes.STRING(500),
      comment: '操作浏览器UA',
    },
  },
  {
    sequelize,
    tableName: 'interview_operation_log',
    comment: '面试操作日志表',
    indexes: [
      { fields: ['interviewId'] },
      { fields: ['action'] },
      { fields: ['operatorId'] },
      { fields: ['created_at'] },
    ],
  }
);

export default InterviewOperationLog;

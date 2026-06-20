import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { AllocationAction, InterviewerStatus, AllocationValidationType } from '../constants/recruitment.enum';

interface InterviewerAllocationLogAttributes {
  id: number;
  interviewId?: number;
  interviewerId?: number;
  interviewerName?: string;
  previousInterviewerId?: number;
  previousInterviewerName?: string;
  action: AllocationAction;
  beforeStatus?: InterviewerStatus;
  afterStatus?: InterviewerStatus;
  domainMatched?: boolean;
  crossDomainConfirmed?: boolean;
  validationResults?: string;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  remark?: string;
  ip?: string;
}

interface InterviewerAllocationLogCreationAttributes extends Optional<InterviewerAllocationLogAttributes, 'id'> {}

class InterviewerAllocationLog extends Model<InterviewerAllocationLogAttributes, InterviewerAllocationLogCreationAttributes> implements InterviewerAllocationLogAttributes {
  public id!: number;
  public interviewId?: number;
  public interviewerId?: number;
  public interviewerName?: string;
  public previousInterviewerId?: number;
  public previousInterviewerName?: string;
  public action!: AllocationAction;
  public beforeStatus?: InterviewerStatus;
  public afterStatus?: InterviewerStatus;
  public domainMatched?: boolean;
  public crossDomainConfirmed?: boolean;
  public validationResults?: string;
  public operatorId?: number;
  public operatorName?: string;
  public operatorRole?: string;
  public remark?: string;
  public ip?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InterviewerAllocationLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '调配记录ID',
    },
    interviewId: {
      type: DataTypes.INTEGER,
      comment: '面试场次ID',
    },
    interviewerId: {
      type: DataTypes.INTEGER,
      comment: '目标面试官用户ID',
    },
    interviewerName: {
      type: DataTypes.STRING(50),
      comment: '目标面试官姓名',
    },
    previousInterviewerId: {
      type: DataTypes.INTEGER,
      comment: '原面试官用户ID',
    },
    previousInterviewerName: {
      type: DataTypes.STRING(50),
      comment: '原面试官姓名',
    },
    action: {
      type: DataTypes.ENUM('allocate', 'replace', 'batch_replace', 'batch_schedule', 'status_change'),
      allowNull: false,
      comment: '调配动作类型',
    },
    beforeStatus: {
      type: DataTypes.ENUM('idle', 'interviewing', 'busy', 'on_leave'),
      comment: '变更前面试官状态',
    },
    afterStatus: {
      type: DataTypes.ENUM('idle', 'interviewing', 'busy', 'on_leave'),
      comment: '变更后面试官状态',
    },
    domainMatched: {
      type: DataTypes.BOOLEAN,
      comment: '领域是否匹配',
    },
    crossDomainConfirmed: {
      type: DataTypes.BOOLEAN,
      comment: '跨领域调配是否已确认',
    },
    validationResults: {
      type: DataTypes.TEXT,
      comment: '校验结果JSON',
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
      type: DataTypes.STRING(20),
      comment: '操作人角色',
    },
    remark: {
      type: DataTypes.STRING(500),
      comment: '备注',
    },
    ip: {
      type: DataTypes.STRING(50),
      comment: '操作IP',
    },
  },
  {
    sequelize,
    tableName: 'interviewer_allocation_log',
    comment: '面试官调配记录表',
    indexes: [
      { fields: ['interviewId'] },
      { fields: ['interviewerId'] },
      { fields: ['action'] },
      { fields: ['operatorId'] },
      { fields: ['created_at'] },
    ],
  }
);

export default InterviewerAllocationLog;

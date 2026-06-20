import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { WarningStatus, WarningLevel, WarningAction, OverdueReasonType } from '../constants/recruitment.enum';

interface InterviewWarningLogAttributes {
  id: number;
  interviewId: number;
  warningStatus: WarningStatus;
  warningLevel: WarningLevel;
  overdueReasonType?: OverdueReasonType;
  overdueReason?: string;
  remedyPlan?: string;
  action?: WarningAction;
  handlerId?: number;
  handlerName?: string;
  handlerRole?: string;
  previousWarningLevel?: WarningLevel;
  previousWarningStatus?: WarningStatus;
  postponedTime?: Date;
  falseAlarmVerified?: boolean;
  falseAlarmReason?: string;
  remark?: string;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  ip?: string;
}

interface InterviewWarningLogCreationAttributes extends Optional<InterviewWarningLogAttributes, 'id'> {}

class InterviewWarningLog extends Model<InterviewWarningLogAttributes, InterviewWarningLogCreationAttributes> implements InterviewWarningLogAttributes {
  public id!: number;
  public interviewId!: number;
  public warningStatus!: WarningStatus;
  public warningLevel!: WarningLevel;
  public overdueReasonType?: OverdueReasonType;
  public overdueReason?: string;
  public remedyPlan?: string;
  public action?: WarningAction;
  public handlerId?: number;
  public handlerName?: string;
  public handlerRole?: string;
  public previousWarningLevel?: WarningLevel;
  public previousWarningStatus?: WarningStatus;
  public postponedTime?: Date;
  public falseAlarmVerified?: boolean;
  public falseAlarmReason?: string;
  public remark?: string;
  public operatorId?: number;
  public operatorName?: string;
  public operatorRole?: string;
  public ip?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InterviewWarningLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    interviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '面试场次ID',
    },
    warningStatus: {
      type: DataTypes.ENUM('normal', 'approaching', 'overdue', 'handled'),
      allowNull: false,
      defaultValue: WarningStatus.NORMAL,
      comment: '预警状态',
    },
    warningLevel: {
      type: DataTypes.ENUM('normal', 'approaching_24h', 'approaching_1h', 'overdue'),
      allowNull: false,
      defaultValue: WarningLevel.NORMAL,
      comment: '预警等级',
    },
    overdueReasonType: {
      type: DataTypes.ENUM('interviewer_absent', 'candidate_absent', 'schedule_conflict', 'system_error', 'force_majeure', 'other'),
      comment: '逾期原因类型',
    },
    overdueReason: {
      type: DataTypes.STRING(500),
      comment: '逾期原因说明',
    },
    remedyPlan: {
      type: DataTypes.STRING(500),
      comment: '补救方案',
    },
    action: {
      type: DataTypes.ENUM('auto_trigger', 'handle_overdue', 'batch_handle', 'batch_postpone', 'dismiss_warning', 'false_alarm'),
      comment: '预警动作',
    },
    handlerId: {
      type: DataTypes.INTEGER,
      comment: '处理人ID',
    },
    handlerName: {
      type: DataTypes.STRING(50),
      comment: '处理人姓名',
    },
    handlerRole: {
      type: DataTypes.STRING(20),
      comment: '处理人角色',
    },
    previousWarningLevel: {
      type: DataTypes.ENUM('normal', 'approaching_24h', 'approaching_1h', 'overdue'),
      comment: '变更前预警等级',
    },
    previousWarningStatus: {
      type: DataTypes.ENUM('normal', 'approaching', 'overdue', 'handled'),
      comment: '变更前预警状态',
    },
    postponedTime: {
      type: DataTypes.DATE,
      comment: '延后后的面试时间',
    },
    falseAlarmVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已确认误预警',
    },
    falseAlarmReason: {
      type: DataTypes.STRING(500),
      comment: '误预警原因说明',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
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
    ip: {
      type: DataTypes.STRING(50),
      comment: '操作IP',
    },
  },
  {
    sequelize,
    tableName: 'interview_warning_log',
    comment: '面试逾期预警记录表',
    indexes: [
      { fields: ['interviewId'] },
      { fields: ['warningStatus'] },
      { fields: ['warningLevel'] },
      { fields: ['action'] },
      { fields: ['handlerId'] },
      { fields: ['operatorId'] },
      { fields: ['created_at'] },
    ],
  }
);

export default InterviewWarningLog;

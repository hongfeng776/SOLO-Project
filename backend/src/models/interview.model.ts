import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { InterviewStage, InterviewResult, InterviewSessionStatus, InterviewAbnormalScoreType, WarningStatus, WarningLevel } from '../constants/recruitment.enum';

interface InterviewAttributes {
  id: number;
  resumeId: number;
  jobId: number;
  stage: InterviewStage;
  sessionStatus: InterviewSessionStatus;
  interviewer?: string;
  interviewerId?: number;
  interviewTime?: Date;
  endTime?: Date;
  location?: string;
  type?: string;
  result: InterviewResult;
  score?: number;
  evaluation?: string;
  feedback?: string;
  nextStage?: string;
  nextTime?: Date;
  remark?: string;
  appointTime?: Date;
  appointOperatorId?: number;
  appointOperatorName?: string;
  confirmTime?: Date;
  completeTime?: Date;
  cancelTime?: Date;
  isLocked?: boolean;
  sortWeight?: number;
  matchScoreSnapshot?: number;
  jobUrgencySnapshot?: number;
  candidatePhoneSnapshot?: string;
  candidateEmailSnapshot?: string;
  scoreDetail?: string;
  submitLockToken?: string;
  submitLockTime?: Date;
  abnormalScoreType?: InterviewAbnormalScoreType;
  abnormalScoreReason?: string;
  isSupplementary?: boolean;
  supplementaryTime?: Date;
  supplementaryOperatorId?: number;
  supplementaryOperatorName?: string;
  lastSubmitTime?: Date;
  warningStatus?: WarningStatus;
  warningLevel?: WarningLevel;
  overdueReasonType?: string;
  overdueReason?: string;
  remedyPlan?: string;
  warningHandledAt?: Date;
  lastWarningTriggeredAt?: Date;
}

interface InterviewCreationAttributes extends Optional<InterviewAttributes, 'id' | 'result' | 'sessionStatus'> {}

class Interview extends Model<InterviewAttributes, InterviewCreationAttributes> implements InterviewAttributes {
  public id!: number;
  public resumeId!: number;
  public jobId!: number;
  public stage!: InterviewStage;
  public sessionStatus!: InterviewSessionStatus;
  public interviewer?: string;
  public interviewerId?: number;
  public interviewTime?: Date;
  public endTime?: Date;
  public location?: string;
  public type?: string;
  public result!: InterviewResult;
  public score?: number;
  public evaluation?: string;
  public feedback?: string;
  public nextStage?: string;
  public nextTime?: Date;
  public remark?: string;
  public appointTime?: Date;
  public appointOperatorId?: number;
  public appointOperatorName?: string;
  public confirmTime?: Date;
  public completeTime?: Date;
  public cancelTime?: Date;
  public isLocked?: boolean;
  public sortWeight?: number;
  public matchScoreSnapshot?: number;
  public jobUrgencySnapshot?: number;
  public candidatePhoneSnapshot?: string;
  public candidateEmailSnapshot?: string;
  public scoreDetail?: string;
  public submitLockToken?: string;
  public submitLockTime?: Date;
  public abnormalScoreType?: InterviewAbnormalScoreType;
  public abnormalScoreReason?: string;
  public isSupplementary?: boolean;
  public supplementaryTime?: Date;
  public supplementaryOperatorId?: number;
  public supplementaryOperatorName?: string;
  public lastSubmitTime?: Date;
  public warningStatus?: WarningStatus;
  public warningLevel?: WarningLevel;
  public overdueReasonType?: string;
  public overdueReason?: string;
  public remedyPlan?: string;
  public warningHandledAt?: Date;
  public lastWarningTriggeredAt?: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Interview.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '面试记录ID',
    },
    resumeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '简历ID',
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '岗位ID',
    },
    stage: {
      type: DataTypes.ENUM('phone', 'first', 'second', 'third', 'hr', 'final'),
      allowNull: false,
      comment: '面试阶段',
    },
    sessionStatus: {
      type: DataTypes.ENUM('pending_appoint', 'appointed', 'pending_interview', 'completed', 'cancelled'),
      defaultValue: InterviewSessionStatus.PENDING_APPOINT,
      allowNull: false,
      comment: '面试场次状态',
    },
    interviewer: {
      type: DataTypes.STRING(50),
      comment: '面试官',
    },
    interviewerId: {
      type: DataTypes.INTEGER,
      comment: '面试官用户ID',
    },
    interviewTime: {
      type: DataTypes.DATE,
      comment: '面试开始时间',
    },
    endTime: {
      type: DataTypes.DATE,
      comment: '面试结束时间',
    },
    location: {
      type: DataTypes.STRING(255),
      comment: '面试地点',
    },
    type: {
      type: DataTypes.STRING(20),
      defaultValue: 'onsite',
      comment: '面试方式 onsite现场 video视频 phone电话',
    },
    result: {
      type: DataTypes.ENUM('pending', 'pass', 'fail', 'pending_decision'),
      defaultValue: InterviewResult.PENDING,
      comment: '面试结果',
    },
    score: {
      type: DataTypes.DECIMAL(3, 1),
      comment: '面试评分',
    },
    evaluation: {
      type: DataTypes.TEXT,
      comment: '综合评价',
    },
    feedback: {
      type: DataTypes.TEXT,
      comment: '面试反馈',
    },
    nextStage: {
      type: DataTypes.STRING(50),
      comment: '下一轮面试阶段',
    },
    nextTime: {
      type: DataTypes.DATE,
      comment: '下一轮面试时间',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
    },
    appointTime: {
      type: DataTypes.DATE,
      comment: '预约确认时间',
    },
    appointOperatorId: {
      type: DataTypes.INTEGER,
      comment: '预约操作人ID',
    },
    appointOperatorName: {
      type: DataTypes.STRING(50),
      comment: '预约操作人姓名',
    },
    confirmTime: {
      type: DataTypes.DATE,
      comment: '面试官确认时间',
    },
    completeTime: {
      type: DataTypes.DATE,
      comment: '面试完成时间',
    },
    cancelTime: {
      type: DataTypes.DATE,
      comment: '面试取消时间',
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否锁定（预约成功后锁定）',
    },
    sortWeight: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序权重',
    },
    matchScoreSnapshot: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '创建时候选人匹配度快照',
    },
    jobUrgencySnapshot: {
      type: DataTypes.INTEGER,
      comment: '创建时岗位紧急程度快照',
    },
    candidatePhoneSnapshot: {
      type: DataTypes.STRING(20),
      comment: '候选人手机号快照',
    },
    candidateEmailSnapshot: {
      type: DataTypes.STRING(100),
      comment: '候选人邮箱快照',
    },
    scoreDetail: {
      type: DataTypes.TEXT,
      comment: '多维度评分明细JSON',
    },
    submitLockToken: {
      type: DataTypes.STRING(64),
      comment: '防重复提交令牌',
    },
    submitLockTime: {
      type: DataTypes.DATE,
      comment: '防重复提交锁定时间',
    },
    abnormalScoreType: {
      type: DataTypes.ENUM('none', 'too_high', 'too_low', 'deviation'),
      defaultValue: InterviewAbnormalScoreType.NONE,
      comment: '异常评分类型',
    },
    abnormalScoreReason: {
      type: DataTypes.STRING(255),
      comment: '异常评分原因说明',
    },
    isSupplementary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为补录记录',
    },
    supplementaryTime: {
      type: DataTypes.DATE,
      comment: '补录时间',
    },
    supplementaryOperatorId: {
      type: DataTypes.INTEGER,
      comment: '补录操作人ID',
    },
    supplementaryOperatorName: {
      type: DataTypes.STRING(50),
      comment: '补录操作人姓名',
    },
    lastSubmitTime: {
      type: DataTypes.DATE,
      comment: '最后提交时间',
    },
    warningStatus: {
      type: DataTypes.ENUM('normal', 'approaching', 'overdue', 'handled'),
      defaultValue: WarningStatus.NORMAL,
      comment: '预警状态',
    },
    warningLevel: {
      type: DataTypes.ENUM('normal', 'approaching_24h', 'approaching_1h', 'overdue'),
      defaultValue: WarningLevel.NORMAL,
      comment: '预警等级',
    },
    overdueReasonType: {
      type: DataTypes.STRING(30),
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
    warningHandledAt: {
      type: DataTypes.DATE,
      comment: '预警处理时间',
    },
    lastWarningTriggeredAt: {
      type: DataTypes.DATE,
      comment: '最近预警触发时间',
    },
  },
  {
    sequelize,
    tableName: 'interview',
    comment: '面试记录表',
    indexes: [
      { fields: ['resumeId'] },
      { fields: ['jobId'] },
      { fields: ['sessionStatus'] },
      { fields: ['interviewer'] },
      { fields: ['interviewerId'] },
      { fields: ['interviewTime'] },
      { fields: ['stage'] },
      { fields: ['result'] },
      { fields: ['sortWeight'] },
      { fields: ['warningStatus'] },
      { fields: ['warningLevel'] },
    ],
  }
);

export default Interview;

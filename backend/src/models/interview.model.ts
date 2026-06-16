import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { InterviewStage, InterviewResult } from '../constants/recruitment.enum';

interface InterviewAttributes {
  id: number;
  resumeId: number;
  jobId: number;
  stage: InterviewStage;
  interviewer?: string;
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
}

interface InterviewCreationAttributes extends Optional<InterviewAttributes, 'id' | 'result'> {}

class Interview extends Model<InterviewAttributes, InterviewCreationAttributes> implements InterviewAttributes {
  public id!: number;
  public resumeId!: number;
  public jobId!: number;
  public stage!: InterviewStage;
  public interviewer?: string;
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
    interviewer: {
      type: DataTypes.STRING(50),
      comment: '面试官',
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
      type: DataTypes.ENUM('pending', 'pass', 'fail'),
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
  },
  {
    sequelize,
    tableName: 'interview',
    comment: '面试记录表',
  }
);

export default Interview;

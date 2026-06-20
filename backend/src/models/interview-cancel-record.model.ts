import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { InterviewCancelReasonType } from '../constants/recruitment.enum';

interface InterviewCancelRecordAttributes {
  id: number;
  interviewId: number;
  reasonType: InterviewCancelReasonType;
  reasonDetail: string;
  cancellerId?: number;
  cancellerName?: string;
  cancelledByCandidate?: boolean;
  affectCandidate?: boolean;
  affectInterviewer?: boolean;
}

interface InterviewCancelRecordCreationAttributes extends Optional<InterviewCancelRecordAttributes, 'id'> {}

class InterviewCancelRecord extends Model<InterviewCancelRecordAttributes, InterviewCancelRecordCreationAttributes> implements InterviewCancelRecordAttributes {
  public id!: number;
  public interviewId!: number;
  public reasonType!: InterviewCancelReasonType;
  public reasonDetail!: string;
  public cancellerId?: number;
  public cancellerName?: string;
  public cancelledByCandidate?: boolean;
  public affectCandidate?: boolean;
  public affectInterviewer?: boolean;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InterviewCancelRecord.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '取消记录ID',
    },
    interviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: '面试记录ID',
    },
    reasonType: {
      type: DataTypes.ENUM('candidate', 'interviewer', 'company', 'other'),
      allowNull: false,
      comment: '取消原因类型',
    },
    reasonDetail: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '取消原因详情',
    },
    cancellerId: {
      type: DataTypes.INTEGER,
      comment: '取消操作人ID',
    },
    cancellerName: {
      type: DataTypes.STRING(50),
      comment: '取消操作人姓名',
    },
    cancelledByCandidate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为候选人主动取消',
    },
    affectCandidate: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否已通知候选人',
    },
    affectInterviewer: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否已通知面试官',
    },
  },
  {
    sequelize,
    tableName: 'interview_cancel_record',
    comment: '面试取消记录表',
    indexes: [
      { fields: ['interviewId'] },
      { fields: ['reasonType'] },
      { fields: ['cancellerId'] },
      { fields: ['created_at'] },
    ],
  }
);

export default InterviewCancelRecord;

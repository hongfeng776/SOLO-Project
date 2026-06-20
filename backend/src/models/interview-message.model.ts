import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export enum InterviewMessageType {
  APPOINT_SUCCESS_CANDIDATE = 'appoint_success_candidate',
  APPOINT_SUCCESS_INTERVIEWER = 'appoint_success_interviewer',
  CANCEL_CANDIDATE = 'cancel_candidate',
  CANCEL_INTERVIEWER = 'cancel_interviewer',
  STATUS_CHANGE_CANDIDATE = 'status_change_candidate',
  STATUS_CHANGE_INTERVIEWER = 'status_change_interviewer',
  REMIND_INTERVIEWER = 'remind_interviewer',
  REMIND_CANDIDATE = 'remind_candidate',
}

export const InterviewMessageTypeLabel: Record<InterviewMessageType, string> = {
  [InterviewMessageType.APPOINT_SUCCESS_CANDIDATE]: '预约成功通知(候选人)',
  [InterviewMessageType.APPOINT_SUCCESS_INTERVIEWER]: '预约成功通知(面试官)',
  [InterviewMessageType.CANCEL_CANDIDATE]: '面试取消通知(候选人)',
  [InterviewMessageType.CANCEL_INTERVIEWER]: '面试取消通知(面试官)',
  [InterviewMessageType.STATUS_CHANGE_CANDIDATE]: '状态变更通知(候选人)',
  [InterviewMessageType.STATUS_CHANGE_INTERVIEWER]: '状态变更通知(面试官)',
  [InterviewMessageType.REMIND_INTERVIEWER]: '面试提醒(面试官)',
  [InterviewMessageType.REMIND_CANDIDATE]: '面试提醒(候选人)',
};

export enum InterviewMessageChannel {
  SMS = 'sms',
  EMAIL = 'email',
  IN_APP = 'in_app',
  SYSTEM = 'system',
}

export enum InterviewMessageStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

interface InterviewMessageAttributes {
  id: number;
  interviewId: number;
  messageType: InterviewMessageType;
  channel: InterviewMessageChannel;
  receiverId?: number;
  receiverName?: string;
  receiverContact?: string;
  title: string;
  content: string;
  status: InterviewMessageStatus;
  sentTime?: Date;
  failedReason?: string;
  retryCount?: number;
}

interface InterviewMessageCreationAttributes extends Optional<InterviewMessageAttributes, 'id' | 'status' | 'retryCount'> {}

class InterviewMessage extends Model<InterviewMessageAttributes, InterviewMessageCreationAttributes> implements InterviewMessageAttributes {
  public id!: number;
  public interviewId!: number;
  public messageType!: InterviewMessageType;
  public channel!: InterviewMessageChannel;
  public receiverId?: number;
  public receiverName?: string;
  public receiverContact?: string;
  public title!: string;
  public content!: string;
  public status!: InterviewMessageStatus;
  public sentTime?: Date;
  public failedReason?: string;
  public retryCount?: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InterviewMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '消息ID',
    },
    interviewId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '面试记录ID',
    },
    messageType: {
      type: DataTypes.ENUM(
        'appoint_success_candidate', 'appoint_success_interviewer',
        'cancel_candidate', 'cancel_interviewer',
        'status_change_candidate', 'status_change_interviewer',
        'remind_interviewer', 'remind_candidate'
      ),
      allowNull: false,
      comment: '消息类型',
    },
    channel: {
      type: DataTypes.ENUM('sms', 'email', 'in_app', 'system'),
      allowNull: false,
      defaultValue: InterviewMessageChannel.SYSTEM,
      comment: '发送渠道',
    },
    receiverId: {
      type: DataTypes.INTEGER,
      comment: '接收人ID',
    },
    receiverName: {
      type: DataTypes.STRING(50),
      comment: '接收人姓名',
    },
    receiverContact: {
      type: DataTypes.STRING(100),
      comment: '接收人联系方式(手机/邮箱)',
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '消息标题',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '消息内容',
    },
    status: {
      type: DataTypes.ENUM('pending', 'sent', 'failed'),
      defaultValue: InterviewMessageStatus.PENDING,
      comment: '发送状态',
    },
    sentTime: {
      type: DataTypes.DATE,
      comment: '发送时间',
    },
    failedReason: {
      type: DataTypes.TEXT,
      comment: '失败原因',
    },
    retryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '重试次数',
    },
  },
  {
    sequelize,
    tableName: 'interview_message',
    comment: '面试消息推送记录表',
    indexes: [
      { fields: ['interviewId'] },
      { fields: ['messageType'] },
      { fields: ['status'] },
      { fields: ['receiverId'] },
      { fields: ['created_at'] },
    ],
  }
);

export default InterviewMessage;

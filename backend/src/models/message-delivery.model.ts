import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import {
  MessageDeliveryStatus,
  MessageBusinessType,
  MessagePushChannel,
  MessageJumpType,
  MessageTemplateScene,
} from '../constants/recruitment.enum';

interface MessageDeliveryAttributes {
  id: number;
  messageCode: string;
  businessType: MessageBusinessType;
  scene: MessageTemplateScene;
  templateId?: number;
  templateCode?: string;
  title: string;
  content: string;
  summary?: string;
  pushChannel: MessagePushChannel;
  receiverId: number;
  receiverName?: string;
  receiverRole?: string;
  receiverContact?: string;
  deliveryStatus: MessageDeliveryStatus;
  readStatus: 'read' | 'unread';
  readAt?: Date;
  sentAt?: Date;
  failedReason?: string;
  retryCount: number;
  lastRetryAt?: Date;
  businessId?: number;
  businessCode?: string;
  jumpType: MessageJumpType;
  jumpUrl?: string;
  jumpParams?: string;
  companyId?: number;
  priority: number;
  isAbnormal: boolean;
  abnormalType?: string;
  abnormalRemark?: string;
  triggeredBy?: number;
  triggeredByName?: string;
  remark?: string;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

interface MessageDeliveryCreationAttributes extends Optional<MessageDeliveryAttributes, 
  'id' | 'deliveryStatus' | 'readStatus' | 'retryCount' | 'priority' | 'isAbnormal' | 'jumpType'
> {}

class MessageDelivery extends Model<MessageDeliveryAttributes, MessageDeliveryCreationAttributes> 
  implements MessageDeliveryAttributes {
  public id!: number;
  public messageCode!: string;
  public businessType!: MessageBusinessType;
  public scene!: MessageTemplateScene;
  public templateId?: number;
  public templateCode?: string;
  public title!: string;
  public content!: string;
  public summary?: string;
  public pushChannel!: MessagePushChannel;
  public receiverId!: number;
  public receiverName?: string;
  public receiverRole?: string;
  public receiverContact?: string;
  public deliveryStatus!: MessageDeliveryStatus;
  public readStatus!: 'read' | 'unread';
  public readAt?: Date;
  public sentAt?: Date;
  public failedReason?: string;
  public retryCount!: number;
  public lastRetryAt?: Date;
  public businessId?: number;
  public businessCode?: string;
  public jumpType!: MessageJumpType;
  public jumpUrl?: string;
  public jumpParams?: string;
  public companyId?: number;
  public priority!: number;
  public isAbnormal!: boolean;
  public abnormalType?: string;
  public abnormalRemark?: string;
  public triggeredBy?: number;
  public triggeredByName?: string;
  public remark?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

MessageDelivery.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '消息ID',
    },
    messageCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '消息唯一编码',
    },
    businessType: {
      type: DataTypes.ENUM(
        'interview_appoint', 'interview_cancel', 'interview_remind',
        'interview_result', 'interview_status_change',
        'onboard_create', 'onboard_audit', 'onboard_status_change',
        'approval_submit', 'approval_pass', 'approval_reject',
        'probation_start', 'probation_end',
        'regularization_submit', 'regularization_approval',
        'risk_warning', 'system_notice'
      ),
      allowNull: false,
      comment: '业务类型',
    },
    scene: {
      type: DataTypes.ENUM('interview', 'onboard', 'approval', 'risk_control'),
      allowNull: false,
      comment: '消息场景',
    },
    templateId: {
      type: DataTypes.INTEGER,
      comment: '关联模板ID',
    },
    templateCode: {
      type: DataTypes.STRING(50),
      comment: '关联模板编码',
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
    summary: {
      type: DataTypes.STRING(500),
      comment: '消息摘要',
    },
    pushChannel: {
      type: DataTypes.ENUM('sms', 'email', 'in_app', 'wechat'),
      allowNull: false,
      defaultValue: MessagePushChannel.IN_APP,
      comment: '推送渠道',
    },
    receiverId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '接收人ID',
    },
    receiverName: {
      type: DataTypes.STRING(50),
      comment: '接收人姓名',
    },
    receiverRole: {
      type: DataTypes.STRING(20),
      comment: '接收人角色',
    },
    receiverContact: {
      type: DataTypes.STRING(100),
      comment: '接收人联系方式',
    },
    deliveryStatus: {
      type: DataTypes.ENUM('pending', 'sent_success', 'sent_failed', 'read', 'unread'),
      allowNull: false,
      defaultValue: MessageDeliveryStatus.PENDING,
      comment: '推送状态',
    },
    readStatus: {
      type: DataTypes.ENUM('read', 'unread'),
      allowNull: false,
      defaultValue: 'unread',
      comment: '阅读状态',
    },
    readAt: {
      type: DataTypes.DATE,
      comment: '阅读时间',
    },
    sentAt: {
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
    lastRetryAt: {
      type: DataTypes.DATE,
      comment: '最后重试时间',
    },
    businessId: {
      type: DataTypes.INTEGER,
      comment: '业务记录ID',
    },
    businessCode: {
      type: DataTypes.STRING(50),
      comment: '业务记录编码',
    },
    jumpType: {
      type: DataTypes.ENUM(
        'interview_detail', 'onboard_detail', 'approval_detail',
        'probation_detail', 'regularization_detail',
        'resume_detail', 'job_detail', 'system_page',
        'external_link', 'none'
      ),
      allowNull: false,
      defaultValue: MessageJumpType.NONE,
      comment: '跳转类型',
    },
    jumpUrl: {
      type: DataTypes.STRING(500),
      comment: '跳转链接',
    },
    jumpParams: {
      type: DataTypes.TEXT,
      comment: '跳转参数(JSON)',
    },
    companyId: {
      type: DataTypes.INTEGER,
      comment: '所属企业ID',
    },
    priority: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      comment: '优先级 0-100',
    },
    isAbnormal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否异常消息',
    },
    abnormalType: {
      type: DataTypes.STRING(50),
      comment: '异常类型',
    },
    abnormalRemark: {
      type: DataTypes.STRING(500),
      comment: '异常备注',
    },
    triggeredBy: {
      type: DataTypes.INTEGER,
      comment: '触发人ID',
    },
    triggeredByName: {
      type: DataTypes.STRING(50),
      comment: '触发人姓名',
    },
    remark: {
      type: DataTypes.STRING(500),
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'message_delivery',
    comment: '消息推送记录表',
    paranoid: true,
    indexes: [
      { fields: ['messageCode'], unique: true },
      { fields: ['receiverId'] },
      { fields: ['businessType'] },
      { fields: ['scene'] },
      { fields: ['deliveryStatus'] },
      { fields: ['readStatus'] },
      { fields: ['pushChannel'] },
      { fields: ['businessId'] },
      { fields: ['companyId'] },
      { fields: ['priority'] },
      { fields: ['isAbnormal'] },
      { fields: ['created_at'] },
      { fields: ['sentAt'] },
      { fields: ['receiverId', 'deliveryStatus'] },
      { fields: ['receiverId', 'readStatus'] },
    ],
  }
);

export default MessageDelivery;

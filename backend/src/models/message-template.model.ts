import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface MessageTemplateAttributes {
  id: number;
  templateName: string;
  templateCode: string;
  scene: string;
  notificationType: string;
  recipientType: string;
  pushChannel: string;
  title: string;
  content: string;
  templateStatus: string;
  weight: number;
  successRate?: number;
  sendCount?: number;
  successCount?: number;
  version: number;
  createdBy?: number;
  createdByName?: string;
  updatedBy?: number;
  updatedByName?: string;
  activatedAt?: Date;
  deactivatedAt?: Date;
  lastTestedAt?: Date;
  isComplianceChecked: boolean;
  complianceIssues?: string;
  remark?: string;
}

interface MessageTemplateCreationAttributes extends Optional<MessageTemplateAttributes, 'id' | 'version' | 'templateStatus' | 'weight' | 'isComplianceChecked' | 'sendCount' | 'successCount'> {}

class MessageTemplate extends Model<MessageTemplateAttributes, MessageTemplateCreationAttributes> implements MessageTemplateAttributes {
  public id!: number;
  public templateName!: string;
  public templateCode!: string;
  public scene!: string;
  public notificationType!: string;
  public recipientType!: string;
  public pushChannel!: string;
  public title!: string;
  public content!: string;
  public templateStatus!: string;
  public weight!: number;
  public successRate?: number;
  public sendCount?: number;
  public successCount?: number;
  public version!: number;
  public createdBy?: number;
  public createdByName?: string;
  public updatedBy?: number;
  public updatedByName?: string;
  public activatedAt?: Date;
  public deactivatedAt?: Date;
  public lastTestedAt?: Date;
  public isComplianceChecked!: boolean;
  public complianceIssues?: string;
  public remark?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

MessageTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '模板ID',
    },
    templateName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '模板名称',
    },
    templateCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '模板编码',
    },
    scene: {
      type: DataTypes.STRING(30),
      allowNull: false,
      comment: '业务场景：interview/onboard/approval/risk_control',
    },
    notificationType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '通知类型：info/reminder/warning/emergency',
    },
    recipientType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '接收对象：candidate/interviewer/hr/admin/dept_head',
    },
    pushChannel: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '推送渠道：sms/email/in_app/wechat',
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '消息标题',
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '消息内容',
    },
    templateStatus: {
      type: DataTypes.ENUM('enabled', 'disabled', 'testing'),
      defaultValue: 'disabled',
      comment: '模板状态：enabled-启用 disabled-停用 testing-测试',
    },
    weight: {
      type: DataTypes.INTEGER,
      defaultValue: 50,
      comment: '推送权重 0-100',
    },
    successRate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      comment: '发送成功率 %',
    },
    sendCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '累计发送次数',
    },
    successCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '累计成功次数',
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '模板版本号',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      comment: '创建人ID',
    },
    createdByName: {
      type: DataTypes.STRING(50),
      comment: '创建人姓名',
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      comment: '更新人ID',
    },
    updatedByName: {
      type: DataTypes.STRING(50),
      comment: '更新人姓名',
    },
    activatedAt: {
      type: DataTypes.DATE,
      comment: '最近启用时间',
    },
    deactivatedAt: {
      type: DataTypes.DATE,
      comment: '最近停用时间',
    },
    lastTestedAt: {
      type: DataTypes.DATE,
      comment: '最近测试时间',
    },
    isComplianceChecked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否通过合规校验',
    },
    complianceIssues: {
      type: DataTypes.TEXT,
      comment: '合规问题列表，JSON格式',
    },
    remark: {
      type: DataTypes.STRING(500),
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'message_template',
    comment: '消息通知模板表',
    indexes: [
      { fields: ['templateCode'], unique: true },
      { fields: ['scene'] },
      { fields: ['templateStatus'] },
      { fields: ['notificationType'] },
      { fields: ['pushChannel'] },
      { fields: ['recipientType'] },
      { fields: ['weight'] },
      { fields: ['isComplianceChecked'] },
    ],
  }
);

export default MessageTemplate;

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { JobStatus } from '../constants/recruitment.enum';

interface JobAttributes {
  id: number;
  companyId: number;
  title: string;
  category?: string;
  department?: string;
  jobType?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryUnit?: string;
  city?: string;
  address?: string;
  experience?: string;
  education?: string;
  recruitNum?: number;
  description?: string;
  requirements?: string;
  benefits?: string;
  status: JobStatus;
  rejectReason?: string;
  submitTime?: Date;
  auditTime?: Date;
  auditUserId?: number;
  auditUserName?: string;
  publishTime?: Date;
  deadline?: Date;
  creatorId?: number;
  creatorName?: string;
  sort: number;
  matchWeight?: number;
  isMajorChange?: boolean;
  pendingChanges?: string;
  changeOperatorId?: number;
  changeOperatorName?: string;
  changeSubmitTime?: Date;
  abnormalFlag?: boolean;
  abnormalReason?: string;
  version?: number;
  lastEditTime?: Date;
  lastEditorId?: number;
  lastEditorName?: string;
  resumeCollectEnabled?: boolean;
  smartMatchEnabled?: boolean;
  exposurePushEnabled?: boolean;
  onlineTime?: Date;
  offlineTime?: Date;
  onlineOfflineCount?: number;
  riskWarningFlag?: boolean;
  riskWarningReason?: string;
  violationFlag?: boolean;
  expireTime?: Date;
  resumeDeliveryCount?: number;
  hireCompletedCount?: number;
  interviewInProgressCount?: number;
  onboardInProgressCount?: number;
}

interface JobCreationAttributes extends Optional<JobAttributes, 'id' | 'status' | 'sort' | 'recruitNum'> {}

class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
  public id!: number;
  public companyId!: number;
  public title!: string;
  public category?: string;
  public department?: string;
  public jobType?: string;
  public salaryMin?: number;
  public salaryMax?: number;
  public salaryUnit?: string;
  public city?: string;
  public address?: string;
  public experience?: string;
  public education?: string;
  public recruitNum?: number;
  public description?: string;
  public requirements?: string;
  public benefits?: string;
  public status!: JobStatus;
  public rejectReason?: string;
  public submitTime?: Date;
  public auditTime?: Date;
  public auditUserId?: number;
  public auditUserName?: string;
  public publishTime?: Date;
  public deadline?: Date;
  public creatorId?: number;
  public creatorName?: string;
  public sort!: number;
  public matchWeight?: number;
  public isMajorChange?: boolean;
  public pendingChanges?: string;
  public changeOperatorId?: number;
  public changeOperatorName?: string;
  public changeSubmitTime?: Date;
  public abnormalFlag?: boolean;
  public abnormalReason?: string;
  public version?: number;
  public lastEditTime?: Date;
  public lastEditorId?: number;
  public lastEditorName?: string;
  public resumeCollectEnabled?: boolean;
  public smartMatchEnabled?: boolean;
  public exposurePushEnabled?: boolean;
  public onlineTime?: Date;
  public offlineTime?: Date;
  public onlineOfflineCount?: number;
  public riskWarningFlag?: boolean;
  public riskWarningReason?: string;
  public violationFlag?: boolean;
  public expireTime?: Date;
  public resumeDeliveryCount?: number;
  public hireCompletedCount?: number;
  public interviewInProgressCount?: number;
  public onboardInProgressCount?: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Job.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '岗位ID',
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '企业ID',
    },
    title: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '岗位名称',
    },
    category: {
      type: DataTypes.STRING(50),
      comment: '岗位类别',
    },
    department: {
      type: DataTypes.STRING(50),
      comment: '所属部门',
    },
    jobType: {
      type: DataTypes.STRING(50),
      comment: '工作类型 全职/兼职/实习',
    },
    salaryMin: {
      type: DataTypes.DECIMAL(10, 2),
      comment: '最低薪资',
    },
    salaryMax: {
      type: DataTypes.DECIMAL(10, 2),
      comment: '最高薪资',
    },
    salaryUnit: {
      type: DataTypes.STRING(20),
      defaultValue: 'K',
      comment: '薪资单位 K/万',
    },
    city: {
      type: DataTypes.STRING(50),
      comment: '工作城市',
    },
    address: {
      type: DataTypes.STRING(255),
      comment: '工作地址',
    },
    experience: {
      type: DataTypes.STRING(50),
      comment: '工作经验要求',
    },
    education: {
      type: DataTypes.STRING(50),
      comment: '学历要求',
    },
    recruitNum: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '招聘人数',
    },
    description: {
      type: DataTypes.TEXT,
      comment: '岗位职责',
    },
    requirements: {
      type: DataTypes.TEXT,
      comment: '任职要求',
    },
    benefits: {
      type: DataTypes.TEXT,
      comment: '福利待遇',
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_audit', 'published', 'rejected', 'closed', 'paused'),
      defaultValue: JobStatus.DRAFT,
      comment: '岗位状态 draft-草稿 pending_audit-待审核 published-已发布 rejected-发布驳回 closed-已关闭 paused-已暂停',
    },
    rejectReason: {
      type: DataTypes.TEXT,
      comment: '驳回原因',
    },
    submitTime: {
      type: DataTypes.DATE,
      comment: '提交审核时间',
    },
    auditTime: {
      type: DataTypes.DATE,
      comment: '审核时间',
    },
    auditUserId: {
      type: DataTypes.INTEGER,
      comment: '审核人ID',
    },
    auditUserName: {
      type: DataTypes.STRING(50),
      comment: '审核人姓名',
    },
    publishTime: {
      type: DataTypes.DATE,
      comment: '发布时间',
    },
    deadline: {
      type: DataTypes.DATE,
      comment: '截止日期',
    },
    creatorId: {
      type: DataTypes.INTEGER,
      comment: '创建人ID',
    },
    creatorName: {
      type: DataTypes.STRING(50),
      comment: '创建人姓名',
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序',
    },
    matchWeight: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
      comment: '智能匹配权重',
    },
    isMajorChange: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否为重大变更',
    },
    pendingChanges: {
      type: DataTypes.TEXT,
      comment: '待审核的变更内容（JSON格式）',
    },
    changeOperatorId: {
      type: DataTypes.INTEGER,
      comment: '变更提交人ID',
    },
    changeOperatorName: {
      type: DataTypes.STRING(50),
      comment: '变更提交人姓名',
    },
    changeSubmitTime: {
      type: DataTypes.DATE,
      comment: '变更提交时间',
    },
    abnormalFlag: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '异常标记',
    },
    abnormalReason: {
      type: DataTypes.TEXT,
      comment: '异常原因',
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '版本号',
    },
    lastEditTime: {
      type: DataTypes.DATE,
      comment: '最后编辑时间',
    },
    lastEditorId: {
      type: DataTypes.INTEGER,
      comment: '最后编辑人ID',
    },
    lastEditorName: {
      type: DataTypes.STRING(50),
      comment: '最后编辑人姓名',
    },
    resumeCollectEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否开启简历收录',
    },
    smartMatchEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否开启智能匹配',
    },
    exposurePushEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否开启曝光推送',
    },
    onlineTime: {
      type: DataTypes.DATE,
      comment: '最后上架时间',
    },
    offlineTime: {
      type: DataTypes.DATE,
      comment: '最后下架时间',
    },
    onlineOfflineCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '上下架切换次数',
    },
    riskWarningFlag: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '风控预警标记',
    },
    riskWarningReason: {
      type: DataTypes.TEXT,
      comment: '风控预警原因',
    },
    violationFlag: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '违规风控标记',
    },
    expireTime: {
      type: DataTypes.DATE,
      comment: '岗位过期时间',
    },
    resumeDeliveryCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '简历投递数量',
    },
    hireCompletedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '已入职人数',
    },
    interviewInProgressCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '面试中人数',
    },
    onboardInProgressCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '入职流程中人数',
    },
  },
  {
    sequelize,
    tableName: 'job',
    comment: '招聘岗位表',
  }
);

export default Job;

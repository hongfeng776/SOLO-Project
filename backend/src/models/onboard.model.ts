import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { OnboardStatus } from '../constants/recruitment.enum';

interface OnboardAttributes {
  id: number;
  resumeId: number;
  jobId: number;
  interviewId?: number;
  candidateConfirmed?: boolean;
  candidateConfirmTime?: Date;
  personalInfo?: string;
  name?: string;
  gender?: string;
  age?: number;
  phone?: string;
  email?: string;
  idCard?: string;
  education?: string;
  school?: string;
  major?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  reportTo?: string;
  salaryMin?: number;
  salaryMax?: number;
  offerSalary?: string;
  salaryBase?: number;
  salaryPerformance?: number;
  salaryBonus?: string;
  salaryUnit?: string;
  offerTime?: Date;
  expectOnboardDate?: Date;
  actualOnboardDate?: Date;
  onboardDate?: Date;
  workLocation?: string;
  workType?: string;
  probationPeriod?: number;
  probationSalary?: string;
  contractType?: string;
  contractTerm?: number;
  status: OnboardStatus;
  rejectReason?: string;
  auditTime?: Date;
  auditUserId?: number;
  auditUserName?: string;
  auditRemark?: string;
  ledgerGenerated?: boolean;
  ledgerGenerateTime?: Date;
  contractSigned?: boolean;
  contractSignTime?: Date;
  materialsComplete?: boolean;
  materialsCheckTime?: Date;
  materialsList?: string;
  socialSecurityAccount?: boolean;
  providentFundAccount?: boolean;
  hrOperatorId?: number;
  hrOperatorName?: string;
  submitTime?: Date;
  onboardRemark?: string;
  remark?: string;
  dataConsistencyCheck?: boolean;
  consistencyCheckResult?: string;
  fakeInfoDetected?: boolean;
  fakeInfoReason?: string;
  fieldCheckResult?: string;
  originalResumeSnapshot?: string;
  salaryMismatchWarning?: boolean;
  version?: number;
}

interface OnboardCreationAttributes extends Optional<OnboardAttributes, 'id' | 'status'> {}

class Onboard extends Model<OnboardAttributes, OnboardCreationAttributes> implements OnboardAttributes {
  public id!: number;
  public resumeId!: number;
  public jobId!: number;
  public interviewId?: number;
  public candidateConfirmed?: boolean;
  public candidateConfirmTime?: Date;
  public personalInfo?: string;
  public name?: string;
  public gender?: string;
  public age?: number;
  public phone?: string;
  public email?: string;
  public idCard?: string;
  public education?: string;
  public school?: string;
  public major?: string;
  public department?: string;
  public position?: string;
  public jobLevel?: string;
  public reportTo?: string;
  public salaryMin?: number;
  public salaryMax?: number;
  public offerSalary?: string;
  public salaryBase?: number;
  public salaryPerformance?: number;
  public salaryBonus?: string;
  public salaryUnit?: string;
  public offerTime?: Date;
  public expectOnboardDate?: Date;
  public actualOnboardDate?: Date;
  public onboardDate?: Date;
  public workLocation?: string;
  public workType?: string;
  public probationPeriod?: number;
  public probationSalary?: string;
  public contractType?: string;
  public contractTerm?: number;
  public status!: OnboardStatus;
  public rejectReason?: string;
  public auditTime?: Date;
  public auditUserId?: number;
  public auditUserName?: string;
  public auditRemark?: string;
  public ledgerGenerated?: boolean;
  public ledgerGenerateTime?: Date;
  public contractSigned?: boolean;
  public contractSignTime?: Date;
  public materialsComplete?: boolean;
  public materialsCheckTime?: Date;
  public materialsList?: string;
  public socialSecurityAccount?: boolean;
  public providentFundAccount?: boolean;
  public hrOperatorId?: number;
  public hrOperatorName?: string;
  public submitTime?: Date;
  public onboardRemark?: string;
  public remark?: string;
  public dataConsistencyCheck?: boolean;
  public consistencyCheckResult?: string;
  public fakeInfoDetected?: boolean;
  public fakeInfoReason?: string;
  public fieldCheckResult?: string;
  public originalResumeSnapshot?: string;
  public salaryMismatchWarning?: boolean;
  public version?: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Onboard.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '入职记录ID',
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
    interviewId: {
      type: DataTypes.INTEGER,
      comment: '关联面试记录ID',
    },
    candidateConfirmed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '候选人是否确认入职',
    },
    candidateConfirmTime: {
      type: DataTypes.DATE,
      comment: '候选人确认入职时间',
    },
    personalInfo: {
      type: DataTypes.TEXT,
      comment: '个人信息快照（JSON）',
    },
    name: {
      type: DataTypes.STRING(50),
      comment: '姓名',
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      comment: '性别',
    },
    age: {
      type: DataTypes.INTEGER,
      comment: '年龄',
    },
    phone: {
      type: DataTypes.STRING(20),
      comment: '手机号',
    },
    email: {
      type: DataTypes.STRING(100),
      comment: '邮箱',
    },
    idCard: {
      type: DataTypes.STRING(20),
      comment: '身份证号',
    },
    education: {
      type: DataTypes.STRING(30),
      comment: '学历',
    },
    school: {
      type: DataTypes.STRING(100),
      comment: '毕业院校',
    },
    major: {
      type: DataTypes.STRING(100),
      comment: '专业',
    },
    department: {
      type: DataTypes.STRING(50),
      comment: '入职部门',
    },
    position: {
      type: DataTypes.STRING(100),
      comment: '入职职位',
    },
    jobLevel: {
      type: DataTypes.STRING(20),
      comment: '岗位职级',
    },
    reportTo: {
      type: DataTypes.STRING(50),
      comment: '汇报对象',
    },
    salaryMin: {
      type: DataTypes.DECIMAL(10, 2),
      comment: '薪资下限(K)',
    },
    salaryMax: {
      type: DataTypes.DECIMAL(10, 2),
      comment: '薪资上限(K)',
    },
    offerSalary: {
      type: DataTypes.STRING(50),
      comment: 'Offer薪资',
    },
    salaryBase: {
      type: DataTypes.DECIMAL(10, 2),
      comment: '基本工资(K)',
    },
    salaryPerformance: {
      type: DataTypes.DECIMAL(10, 2),
      comment: '绩效工资(K)',
    },
    salaryBonus: {
      type: DataTypes.STRING(100),
      comment: '年终奖说明',
    },
    salaryUnit: {
      type: DataTypes.STRING(10),
      defaultValue: 'K',
      comment: '薪资单位',
    },
    offerTime: {
      type: DataTypes.DATE,
      comment: 'Offer发放时间',
    },
    expectOnboardDate: {
      type: DataTypes.DATE,
      comment: '预计入职日期',
    },
    actualOnboardDate: {
      type: DataTypes.DATE,
      comment: '实际入职日期',
    },
    onboardDate: {
      type: DataTypes.DATE,
      comment: '入职日期',
    },
    workLocation: {
      type: DataTypes.STRING(255),
      comment: '工作地点',
    },
    workType: {
      type: DataTypes.STRING(20),
      comment: '工作性质 全职/兼职/实习',
    },
    probationPeriod: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      comment: '试用期(月)',
    },
    probationSalary: {
      type: DataTypes.STRING(50),
      comment: '试用期薪资',
    },
    contractType: {
      type: DataTypes.STRING(20),
      comment: '合同类型',
    },
    contractTerm: {
      type: DataTypes.INTEGER,
      comment: '合同期限(年)',
    },
    status: {
      type: DataTypes.ENUM('pending_audit', 'audit_passed', 'audit_rejected', 'onboarded'),
      defaultValue: OnboardStatus.PENDING_AUDIT,
      comment: '入职状态 pending_audit待审核 audit_passed审核通过 audit_rejected审核驳回 onboarded已入职',
    },
    rejectReason: {
      type: DataTypes.TEXT,
      comment: '驳回原因',
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
    auditRemark: {
      type: DataTypes.TEXT,
      comment: '审核备注',
    },
    ledgerGenerated: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已生成入职台账',
    },
    ledgerGenerateTime: {
      type: DataTypes.DATE,
      comment: '台账生成时间',
    },
    contractSigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否签合同',
    },
    contractSignTime: {
      type: DataTypes.DATE,
      comment: '合同签订时间',
    },
    materialsComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '材料是否齐全',
    },
    materialsCheckTime: {
      type: DataTypes.DATE,
      comment: '材料核验时间',
    },
    materialsList: {
      type: DataTypes.TEXT,
      comment: '入职材料清单（JSON）',
    },
    socialSecurityAccount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '社保已开户',
    },
    providentFundAccount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '公积金已开户',
    },
    hrOperatorId: {
      type: DataTypes.INTEGER,
      comment: '对接HR用户ID',
    },
    hrOperatorName: {
      type: DataTypes.STRING(50),
      comment: '对接HR姓名',
    },
    submitTime: {
      type: DataTypes.DATE,
      comment: '提交审核时间',
    },
    onboardRemark: {
      type: DataTypes.TEXT,
      comment: '入职备注（超长）',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
    },
    dataConsistencyCheck: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否完成数据一致性校验',
    },
    consistencyCheckResult: {
      type: DataTypes.TEXT,
      comment: '一致性校验结果详情（JSON）',
    },
    fakeInfoDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否检测到虚假信息',
    },
    fakeInfoReason: {
      type: DataTypes.STRING(500),
      comment: '虚假信息检测原因',
    },
    fieldCheckResult: {
      type: DataTypes.TEXT,
      comment: '字段缺失校验结果（JSON数组）',
    },
    originalResumeSnapshot: {
      type: DataTypes.TEXT,
      comment: '原始简历信息快照（JSON）',
    },
    salaryMismatchWarning: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '薪资职级不匹配警告',
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '版本号（乐观锁）',
    },
  },
  {
    sequelize,
    tableName: 'onboard',
    comment: '入职管理表',
    indexes: [
      { fields: ['resumeId'] },
      { fields: ['jobId'] },
      { fields: ['interviewId'] },
      { fields: ['status'] },
      { fields: ['expectOnboardDate'] },
      { fields: ['onboardDate'] },
      { fields: ['hrOperatorId'] },
      { fields: ['auditUserId'] },
      { fields: ['name'] },
      { fields: ['phone'] },
      { fields: ['jobLevel'] },
    ],
  }
);

export default Onboard;

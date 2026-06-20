import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ProbationStatus } from '../constants/recruitment.enum';
import { Gender } from '../constants/recruitment.enum';
import { JobCategory } from '../constants/recruitment.enum';

interface ProbationAttributes {
  id: number;
  onboardId: number;
  resumeId: number;
  jobId: number;
  employeeNo?: string;
  name?: string;
  gender?: Gender;
  phone?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  jobCategory?: JobCategory;
  contractTerm?: number;
  startDate: Date;
  endDate: Date;
  duration: number;
  originalDuration?: number;
  extendDays?: number;
  salaryProbation?: string;
  salaryRegular?: string;
  mentor?: string;
  onboardBatch?: string;
  onboardBatchDate?: Date;
  status: ProbationStatus;
  warningTriggered?: boolean;
  warningTime?: Date;
  assessmentLocked?: boolean;
  assessmentFinalScore?: number;
  assessmentResult?: string;
  assessmentComment?: string;
  assessorUserId?: number;
  assessmentTime?: Date;
  durationComplianceChecked?: boolean;
  durationComplianceResult?: string;
  assessmentStandardCheck?: boolean;
  assessmentCheckResult?: string;
  archived?: boolean;
  archiveTime?: Date;
  archiveRemark?: string;
  probationSalaryPercent?: number;
  version?: number;
  hrOperatorId?: number;
  hrOperatorName?: string;
  createReason?: string;
  reasonAdjusted?: string;
  extendReason?: string;
  remark?: string;
}

interface ProbationCreationAttributes extends Optional<ProbationAttributes, 'id' | 'status' | 'duration' | 'probationSalaryPercent' | 'version' | 'warningTriggered' | 'assessmentLocked' | 'archived' | 'durationComplianceChecked' | 'assessmentStandardCheck' | 'extendDays'> {}

class Probation extends Model<ProbationAttributes, ProbationCreationAttributes>
  implements ProbationAttributes
{
  public id!: number;
  public onboardId!: number;
  public resumeId!: number;
  public jobId!: number;
  public employeeNo?: string;
  public name?: string;
  public gender?: Gender;
  public phone?: string;
  public department?: string;
  public position?: string;
  public jobLevel?: string;
  public jobCategory?: JobCategory;
  public contractTerm?: number;
  public startDate!: Date;
  public endDate!: Date;
  public duration!: number;
  public originalDuration?: number;
  public extendDays?: number;
  public salaryProbation?: string;
  public salaryRegular?: string;
  public mentor?: string;
  public onboardBatch?: string;
  public onboardBatchDate?: Date;
  public status!: ProbationStatus;
  public warningTriggered?: boolean;
  public warningTime?: Date;
  public assessmentLocked?: boolean;
  public assessmentFinalScore?: number;
  public assessmentResult?: string;
  public assessmentComment?: string;
  public assessorUserId?: number;
  public assessmentTime?: Date;
  public durationComplianceChecked?: boolean;
  public durationComplianceResult?: string;
  public assessmentStandardCheck?: boolean;
  public assessmentCheckResult?: string;
  public archived?: boolean;
  public archiveTime?: Date;
  public archiveRemark?: string;
  public probationSalaryPercent?: number;
  public version?: number;
  public hrOperatorId?: number;
  public hrOperatorName?: string;
  public createReason?: string;
  public reasonAdjusted?: string;
  public extendReason?: string;
  public remark?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Probation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '试用期记录ID',
    },
    onboardId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    employeeNo: {
      type: DataTypes.STRING(50),
      comment: '工号(从入职台账取)',
    },
    name: {
      type: DataTypes.STRING(50),
      comment: '姓名',
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      comment: '性别',
    },
    phone: {
      type: DataTypes.STRING(20),
      comment: '手机号',
    },
    department: {
      type: DataTypes.STRING(50),
      comment: '部门',
    },
    position: {
      type: DataTypes.STRING(100),
      comment: '职位',
    },
    jobLevel: {
      type: DataTypes.STRING(20),
      comment: '岗位职级',
    },
    jobCategory: {
      type: DataTypes.ENUM('tech', 'product', 'design', 'operations', 'marketing', 'hr', 'finance', 'admin', 'sales', 'other'),
      comment: '岗位类别',
    },
    contractTerm: {
      type: DataTypes.DECIMAL(4, 1),
      comment: '合同期限(年)',
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '试用期开始日期',
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '试用期结束日期',
    },
    duration: {
      type: DataTypes.DECIMAL(4, 1),
      defaultValue: 3,
      comment: '试用期时长(月)',
    },
    originalDuration: {
      type: DataTypes.DECIMAL(4, 1),
      comment: '原始试用期时长(月)',
    },
    extendDays: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '累计延长天数',
    },
    salaryProbation: {
      type: DataTypes.STRING(50),
      comment: '试用期薪资',
    },
    salaryRegular: {
      type: DataTypes.STRING(50),
      comment: '转正薪资',
    },
    mentor: {
      type: DataTypes.STRING(50),
      comment: '导师',
    },
    onboardBatch: {
      type: DataTypes.STRING(7),
      comment: '入职批次(YYYY-MM格式自动生成)',
    },
    onboardBatchDate: {
      type: DataTypes.DATE,
      comment: '入职批次日期',
    },
    status: {
      type: DataTypes.ENUM('in_probation', 'expiring_soon', 'reviewing', 'passed', 'failed', 'extended'),
      defaultValue: ProbationStatus.IN_PROBATION,
      comment: '状态 in_probation试用期内 expiring_soon即将到期 reviewing考核中 passed试用通过 failed试用不通过 extended已延长',
    },
    warningTriggered: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '即将到期预警是否触发过',
    },
    warningTime: {
      type: DataTypes.DATE,
      comment: '预警触发时间',
    },
    assessmentLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '考核指标是否锁定',
    },
    assessmentFinalScore: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '综合分',
    },
    assessmentResult: {
      type: DataTypes.ENUM('PASSED', 'FAILED'),
      comment: '考核结果 PASSED/FAILED',
    },
    assessmentComment: {
      type: DataTypes.TEXT,
      comment: '考核评语',
    },
    assessorUserId: {
      type: DataTypes.INTEGER,
      comment: '考核人用户ID',
    },
    assessmentTime: {
      type: DataTypes.DATE,
      comment: '考核时间',
    },
    durationComplianceChecked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '时长合规性是否已检查',
    },
    durationComplianceResult: {
      type: DataTypes.TEXT,
      comment: '时长合规性检查结果',
    },
    assessmentStandardCheck: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '考核标准是否检查',
    },
    assessmentCheckResult: {
      type: DataTypes.TEXT,
      comment: '考核标准检查结果',
    },
    archived: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已归档',
    },
    archiveTime: {
      type: DataTypes.DATE,
      comment: '归档时间',
    },
    archiveRemark: {
      type: DataTypes.TEXT,
      comment: '归档备注',
    },
    probationSalaryPercent: {
      type: DataTypes.INTEGER,
      defaultValue: 80,
      comment: '试用期薪资占转正薪资比例(%)',
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '版本号(乐观锁)',
    },
    hrOperatorId: {
      type: DataTypes.INTEGER,
      comment: 'HR操作人ID',
    },
    hrOperatorName: {
      type: DataTypes.STRING(50),
      comment: 'HR操作人姓名',
    },
    createReason: {
      type: DataTypes.TEXT,
      comment: '创建原因',
    },
    reasonAdjusted: {
      type: DataTypes.TEXT,
      comment: '试用期微调原因',
    },
    extendReason: {
      type: DataTypes.TEXT,
      comment: '延长原因',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'probation',
    comment: '试用期管理表',
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['onboardId'] },
      { fields: ['resumeId'] },
      { fields: ['jobId'] },
      { fields: ['status'] },
      { fields: ['startDate'] },
      { fields: ['endDate'] },
      { fields: ['onboardBatch'] },
      { fields: ['department'] },
      { fields: ['jobCategory'] },
      { fields: ['employeeNo'] },
      { fields: ['name'] },
      { fields: ['assessorUserId'] },
      { fields: ['hrOperatorId'] },
    ],
  }
);

export default Probation;
export type { ProbationAttributes, ProbationCreationAttributes };

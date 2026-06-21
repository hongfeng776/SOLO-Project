import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { RegularizationStatus } from '../constants/recruitment.enum';
import { JobCategory } from '../constants/recruitment.enum';
import { Gender } from '../constants/recruitment.enum';

interface RegularizationAttributes {
  id: number;
  probationId: number;
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
  onboardBatch?: string;
  applyDate?: Date;
  applyRemark?: string;
  applyAttachments?: any;
  finalScore?: number;
  recruitmentFitGrade?: string;
  recruitmentFitScore?: number;
  newSalaryBase?: string;
  newSalaryPerformance?: string;
  newSalaryTotal?: string;
  salaryAdjusted?: boolean;
  salaryAdjustDate?: Date;
  status: RegularizationStatus;
  currentNodeIndex?: number;
  totalNodes?: number;
  approvalStartTime?: Date;
  approvalEndTime?: Date;
  approvedBy?: string;
  rejectedBy?: string;
  rejectReason?: string;
  resubmitCount?: number;
  lastResubmitTime?: Date;
  syncedToProbation?: boolean;
  syncedToLedger?: boolean;
  syncedToPayroll?: boolean;
  syncRemark?: string;
  hrOperatorId?: number;
  hrOperatorName?: string;
  version?: number;
  remark?: string;
}

interface RegularizationCreationAttributes extends Optional<RegularizationAttributes,
  'id' | 'status' | 'resubmitCount' | 'salaryAdjusted' | 'syncedToProbation'
  | 'syncedToLedger' | 'syncedToPayroll' | 'version' | 'currentNodeIndex'> {}

class Regularization extends Model<RegularizationAttributes, RegularizationCreationAttributes>
  implements RegularizationAttributes
{
  public id!: number;
  public probationId!: number;
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
  public onboardBatch?: string;
  public applyDate?: Date;
  public applyRemark?: string;
  public applyAttachments?: any;
  public finalScore?: number;
  public recruitmentFitGrade?: string;
  public recruitmentFitScore?: number;
  public newSalaryBase?: string;
  public newSalaryPerformance?: string;
  public newSalaryTotal?: string;
  public salaryAdjusted?: boolean;
  public salaryAdjustDate?: Date;
  public status!: RegularizationStatus;
  public currentNodeIndex?: number;
  public totalNodes?: number;
  public approvalStartTime?: Date;
  public approvalEndTime?: Date;
  public approvedBy?: string;
  public rejectedBy?: string;
  public rejectReason?: string;
  public resubmitCount?: number;
  public lastResubmitTime?: Date;
  public syncedToProbation?: boolean;
  public syncedToLedger?: boolean;
  public syncedToPayroll?: boolean;
  public syncRemark?: string;
  public hrOperatorId?: number;
  public hrOperatorName?: string;
  public version?: number;
  public remark?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Regularization.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '转正申请ID',
    },
    probationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
      comment: '工号',
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
    onboardBatch: {
      type: DataTypes.STRING(7),
      comment: '入职批次(YYYY-MM)',
    },
    applyDate: {
      type: DataTypes.DATE,
      comment: '申请日期',
    },
    applyRemark: {
      type: DataTypes.TEXT,
      comment: '申请备注',
    },
    applyAttachments: {
      type: DataTypes.JSON,
      comment: '申请附件(JSON数组)',
    },
    finalScore: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '转正综合分',
    },
    recruitmentFitGrade: {
      type: DataTypes.STRING(5),
      comment: '招聘适配度等级(A/B/C/D)',
    },
    recruitmentFitScore: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '招聘适配度评分',
    },
    newSalaryBase: {
      type: DataTypes.STRING(50),
      comment: '转正后基本工资',
    },
    newSalaryPerformance: {
      type: DataTypes.STRING(50),
      comment: '转正后绩效工资',
    },
    newSalaryTotal: {
      type: DataTypes.STRING(50),
      comment: '转正后薪资总额',
    },
    salaryAdjusted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '薪资是否已调整',
    },
    salaryAdjustDate: {
      type: DataTypes.DATE,
      comment: '薪资调整生效日期',
    },
    status: {
      type: DataTypes.ENUM('pending_apply', 'in_approval', 'approved', 'rejected'),
      defaultValue: RegularizationStatus.PENDING_APPLY,
      comment: '状态 pending_apply待申请 in_approval审批中 approved转正通过 rejected转正驳回',
    },
    currentNodeIndex: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '当前审批节点索引',
    },
    totalNodes: {
      type: DataTypes.INTEGER,
      comment: '审批节点总数',
    },
    approvalStartTime: {
      type: DataTypes.DATE,
      comment: '审批开始时间',
    },
    approvalEndTime: {
      type: DataTypes.DATE,
      comment: '审批结束时间',
    },
    approvedBy: {
      type: DataTypes.STRING(50),
      comment: '最终审批人',
    },
    rejectedBy: {
      type: DataTypes.STRING(50),
      comment: '驳回人',
    },
    rejectReason: {
      type: DataTypes.TEXT,
      comment: '驳回原因',
    },
    resubmitCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '重新提交次数',
    },
    lastResubmitTime: {
      type: DataTypes.DATE,
      comment: '最后重新提交时间',
    },
    syncedToProbation: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已同步到试用期表',
    },
    syncedToLedger: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已同步到入职台账',
    },
    syncedToPayroll: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已同步到薪资系统',
    },
    syncRemark: {
      type: DataTypes.TEXT,
      comment: '同步备注',
    },
    hrOperatorId: {
      type: DataTypes.INTEGER,
      comment: 'HR操作人ID',
    },
    hrOperatorName: {
      type: DataTypes.STRING(50),
      comment: 'HR操作人姓名',
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '版本号(乐观锁)',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'regularization',
    comment: '转正申请审批表',
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['probationId'], unique: false },
      { fields: ['onboardId'] },
      { fields: ['resumeId'] },
      { fields: ['jobId'] },
      { fields: ['status'] },
      { fields: ['department'] },
      { fields: ['jobCategory'] },
      { fields: ['onboardBatch'] },
      { fields: ['employeeNo'] },
      { fields: ['name'] },
      { fields: ['applyDate'] },
      { fields: ['currentNodeIndex'] },
      { fields: ['hrOperatorId'] },
    ],
  }
);

export default Regularization;
export type { RegularizationAttributes, RegularizationCreationAttributes };

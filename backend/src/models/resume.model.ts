import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ResumeStatus, Gender, Education, ParseStatus, ResumeCollectMode, MatchLevel, ResumeTag } from '../constants/recruitment.enum';

interface ResumeAttributes {
  id: number;
  jobId: number;
  name: string;
  gender?: Gender;
  age?: number;
  phone: string;
  email?: string;
  education?: Education;
  school?: string;
  major?: string;
  experience?: number;
  currentCompany?: string;
  currentPosition?: string;
  expectedSalary?: string;
  city?: string;
  resumeFile?: string;
  fileName?: string;
  selfEvaluation?: string;
  status: ResumeStatus;
  source?: string;
  remark?: string;
  parseStatus?: ParseStatus;
  matchScore?: number;
  matchDetails?: string;
  collectMode?: ResumeCollectMode;
  collectorId?: number;
  collectorName?: string;
  collectTime?: Date;
  isLocked?: boolean;
  lockReason?: string;
  isDuplicate?: boolean;
  duplicateResumeId?: number;
  abnormalFields?: string;
  isBlankResume?: boolean;
  isFakeResume?: boolean;
  fakeCheckReason?: string;
  matchLevel?: MatchLevel;
  resumeTag?: ResumeTag;
  skillTags?: string;
  screenTime?: Date;
  screenOperatorId?: number;
  screenOperatorName?: string;
}

interface ResumeCreationAttributes extends Optional<ResumeAttributes, 'id' | 'status'> {}

class Resume extends Model<ResumeAttributes, ResumeCreationAttributes> implements ResumeAttributes {
  public id!: number;
  public jobId!: number;
  public name!: string;
  public gender?: Gender;
  public age?: number;
  public phone!: string;
  public email?: string;
  public education?: Education;
  public school?: string;
  public major?: string;
  public experience?: number;
  public currentCompany?: string;
  public currentPosition?: string;
  public expectedSalary?: string;
  public city?: string;
  public resumeFile?: string;
  public fileName?: string;
  public selfEvaluation?: string;
  public status!: ResumeStatus;
  public source?: string;
  public remark?: string;
  public parseStatus?: ParseStatus;
  public matchScore?: number;
  public matchDetails?: string;
  public collectMode?: ResumeCollectMode;
  public collectorId?: number;
  public collectorName?: string;
  public collectTime?: Date;
  public isLocked?: boolean;
  public lockReason?: string;
  public isDuplicate?: boolean;
  public duplicateResumeId?: number;
  public abnormalFields?: string;
  public isBlankResume?: boolean;
  public isFakeResume?: boolean;
  public fakeCheckReason?: string;
  public matchLevel?: MatchLevel;
  public resumeTag?: ResumeTag;
  public skillTags?: string;
  public screenTime?: Date;
  public screenOperatorId?: number;
  public screenOperatorName?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

Resume.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '简历ID',
    },
    jobId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '应聘岗位ID',
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
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
      allowNull: false,
      comment: '手机号',
    },
    email: {
      type: DataTypes.STRING(100),
      comment: '邮箱',
    },
    education: {
      type: DataTypes.ENUM('high_school', 'college', 'bachelor', 'master', 'doctor'),
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
    experience: {
      type: DataTypes.DECIMAL(4, 1),
      comment: '工作年限(年)',
    },
    currentCompany: {
      type: DataTypes.STRING(100),
      comment: '当前公司',
    },
    currentPosition: {
      type: DataTypes.STRING(100),
      comment: '当前职位',
    },
    expectedSalary: {
      type: DataTypes.STRING(50),
      comment: '期望薪资',
    },
    city: {
      type: DataTypes.STRING(50),
      comment: '所在城市',
    },
    resumeFile: {
      type: DataTypes.STRING(255),
      comment: '简历文件',
    },
    selfEvaluation: {
      type: DataTypes.TEXT,
      comment: '自我评价',
    },
    status: {
      type: DataTypes.ENUM('new', 'screening', 'interview', 'offer', 'hired', 'rejected'),
      defaultValue: ResumeStatus.NEW,
      comment: '简历状态',
    },
    source: {
      type: DataTypes.STRING(50),
      comment: '简历来源',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
    },
    fileName: {
      type: DataTypes.STRING(255),
      comment: '原始文件名',
    },
    parseStatus: {
      type: DataTypes.ENUM('pending', 'success', 'partial', 'failed'),
      defaultValue: ParseStatus.PENDING,
      comment: '解析状态 pending-待解析 success-解析成功 partial-部分解析 failed-解析失败',
    },
    matchScore: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '岗位匹配度分值 0-100',
    },
    matchDetails: {
      type: DataTypes.TEXT,
      comment: '匹配度详情（JSON格式）',
    },
    collectMode: {
      type: DataTypes.ENUM('auto', 'manual'),
      defaultValue: ResumeCollectMode.MANUAL,
      comment: '收录方式 auto-自动收录 manual-手动上传',
    },
    collectorId: {
      type: DataTypes.INTEGER,
      comment: '收录人ID',
    },
    collectorName: {
      type: DataTypes.STRING(50),
      comment: '收录人姓名',
    },
    collectTime: {
      type: DataTypes.DATE,
      comment: '收录时间',
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否锁定（解析失败锁定）',
    },
    lockReason: {
      type: DataTypes.STRING(500),
      comment: '锁定原因',
    },
    isDuplicate: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否重复简历',
    },
    duplicateResumeId: {
      type: DataTypes.INTEGER,
      comment: '重复简历ID',
    },
    abnormalFields: {
      type: DataTypes.TEXT,
      comment: '解析异常字段（JSON数组）',
    },
    isBlankResume: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否空白简历',
    },
    isFakeResume: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否虚假简历',
    },
    fakeCheckReason: {
      type: DataTypes.STRING(500),
      comment: '虚假简历检测原因',
    },
    matchLevel: {
      type: DataTypes.ENUM('high', 'medium', 'low', 'none'),
      comment: '匹配等级 high-高匹配 medium-中匹配 low-低匹配 none-不匹配',
    },
    resumeTag: {
      type: DataTypes.ENUM('quality', 'follow_up', 'invalid'),
      comment: '简历标记 quality-优质 follow_up-待跟进 invalid-无效',
    },
    skillTags: {
      type: DataTypes.TEXT,
      comment: '技能标签（JSON数组）',
    },
    screenTime: {
      type: DataTypes.DATE,
      comment: '最近筛选时间',
    },
    screenOperatorId: {
      type: DataTypes.INTEGER,
      comment: '筛选操作人ID',
    },
    screenOperatorName: {
      type: DataTypes.STRING(50),
      comment: '筛选操作人姓名',
    },
  },
  {
    sequelize,
    tableName: 'resume',
    comment: '简历表',
    indexes: [
      { fields: ['jobId'] },
      { fields: ['name'] },
      { fields: ['phone'] },
      { fields: ['status'] },
      { fields: ['parseStatus'] },
      { fields: ['collectorId'] },
      { fields: ['collectTime'] },
      { fields: ['isDuplicate'] },
      { fields: ['matchScore'] },
      { fields: ['matchLevel'] },
      { fields: ['resumeTag'] },
      { fields: ['screenTime'] },
    ],
  }
);

export default Resume;

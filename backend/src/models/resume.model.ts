import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { ResumeStatus, Gender, Education } from '../constants/recruitment.enum';

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
  selfEvaluation?: string;
  status: ResumeStatus;
  source?: string;
  remark?: string;
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
  public selfEvaluation?: string;
  public status!: ResumeStatus;
  public source?: string;
  public remark?: string;

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
  },
  {
    sequelize,
    tableName: 'resume',
    comment: '简历表',
  }
);

export default Resume;

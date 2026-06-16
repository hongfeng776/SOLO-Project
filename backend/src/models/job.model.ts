import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { JobStatus } from '../constants/recruitment.enum';

interface JobAttributes {
  id: number;
  companyId: number;
  title: string;
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
  publishTime?: Date;
  deadline?: Date;
  sort: number;
}

interface JobCreationAttributes extends Optional<JobAttributes, 'id' | 'status' | 'sort' | 'recruitNum'> {}

class Job extends Model<JobAttributes, JobCreationAttributes> implements JobAttributes {
  public id!: number;
  public companyId!: number;
  public title!: string;
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
  public publishTime?: Date;
  public deadline?: Date;
  public sort!: number;

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
      type: DataTypes.ENUM('draft', 'published', 'closed', 'paused'),
      defaultValue: JobStatus.DRAFT,
      comment: '岗位状态 draft-草稿 published-招聘中 closed-已关闭 paused-已暂停',
    },
    publishTime: {
      type: DataTypes.DATE,
      comment: '发布时间',
    },
    deadline: {
      type: DataTypes.DATE,
      comment: '截止日期',
    },
    sort: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序',
    },
  },
  {
    sequelize,
    tableName: 'job',
    comment: '招聘岗位表',
  }
);

export default Job;

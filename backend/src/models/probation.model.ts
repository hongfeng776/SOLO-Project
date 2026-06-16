import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { OnboardStatus } from '../constants/recruitment.enum';

interface ProbationAttributes {
  id: number;
  onboardId: number;
  resumeId: number;
  jobId: number;
  startDate: Date;
  endDate: Date;
  duration: number;
  salaryProbation?: string;
  salaryRegular?: string;
  department?: string;
  position?: string;
  mentor?: string;
  status: string;
  reviewDate?: Date;
  reviewResult?: string;
  reviewComment?: string;
  actualEndDate?: Date;
  remark?: string;
}

interface ProbationCreationAttributes extends Optional<ProbationAttributes, 'id' | 'status' | 'duration'> {}

class Probation extends Model<ProbationAttributes, ProbationCreationAttributes>
  implements ProbationAttributes
{
  public id!: number;
  public onboardId!: number;
  public resumeId!: number;
  public jobId!: number;
  public startDate!: Date;
  public endDate!: Date;
  public duration!: number;
  public salaryProbation?: string;
  public salaryRegular?: string;
  public department?: string;
  public position?: string;
  public mentor?: string;
  public status!: string;
  public reviewDate?: Date;
  public reviewResult?: string;
  public reviewComment?: string;
  public actualEndDate?: Date;
  public remark?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
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
      type: DataTypes.INTEGER,
      defaultValue: 3,
      comment: '试用期时长(月)',
    },
    salaryProbation: {
      type: DataTypes.STRING(50),
      comment: '试用期薪资',
    },
    salaryRegular: {
      type: DataTypes.STRING(50),
      comment: '转正薪资',
    },
    department: {
      type: DataTypes.STRING(50),
      comment: '部门',
    },
    position: {
      type: DataTypes.STRING(100),
      comment: '职位',
    },
    mentor: {
      type: DataTypes.STRING(50),
      comment: '导师',
    },
    status: {
      type: DataTypes.ENUM('probation', 'reviewing', 'passed', 'extended', 'failed'),
      defaultValue: 'probation',
      comment: '状态 probation-试用中 reviewing-考核中 passed-已转正 extended-延长 failed-未通过',
    },
    reviewDate: {
      type: DataTypes.DATE,
      comment: '转正考核日期',
    },
    reviewResult: {
      type: DataTypes.STRING(50),
      comment: '考核结果',
    },
    reviewComment: {
      type: DataTypes.TEXT,
      comment: '考核评语',
    },
    actualEndDate: {
      type: DataTypes.DATE,
      comment: '实际结束日期',
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
  }
);

export default Probation;

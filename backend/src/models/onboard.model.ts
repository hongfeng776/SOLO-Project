import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { OnboardStatus } from '../constants/recruitment.enum';

interface OnboardAttributes {
  id: number;
  resumeId: number;
  jobId: number;
  offerSalary?: string;
  offerTime?: Date;
  expectOnboardDate?: Date;
  actualOnboardDate?: Date;
  department?: string;
  position?: string;
  probationPeriod?: number;
  status: OnboardStatus;
  contractSigned?: boolean;
  materialsComplete?: boolean;
  remark?: string;
}

interface OnboardCreationAttributes extends Optional<OnboardAttributes, 'id' | 'status'> {}

class Onboard extends Model<OnboardAttributes, OnboardCreationAttributes> implements OnboardAttributes {
  public id!: number;
  public resumeId!: number;
  public jobId!: number;
  public offerSalary?: string;
  public offerTime?: Date;
  public expectOnboardDate?: Date;
  public actualOnboardDate?: Date;
  public department?: string;
  public position?: string;
  public probationPeriod?: number;
  public status!: OnboardStatus;
  public contractSigned?: boolean;
  public materialsComplete?: boolean;
  public remark?: string;

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
    offerSalary: {
      type: DataTypes.STRING(50),
      comment: 'Offer薪资',
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
    department: {
      type: DataTypes.STRING(50),
      comment: '入职部门',
    },
    position: {
      type: DataTypes.STRING(100),
      comment: '入职职位',
    },
    probationPeriod: {
      type: DataTypes.INTEGER,
      defaultValue: 3,
      comment: '试用期(月)',
    },
    status: {
      type: DataTypes.ENUM('pending', 'confirmed', 'onboarded', 'cancelled'),
      defaultValue: OnboardStatus.PENDING,
      comment: '入职状态',
    },
    contractSigned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否签合同',
    },
    materialsComplete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '材料是否齐全',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'onboard',
    comment: '入职管理表',
  }
);

export default Onboard;

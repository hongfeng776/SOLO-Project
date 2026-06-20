import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface OnboardLedgerAttributes {
  id: number;
  onboardId: number;
  ledgerNo?: string;
  employeeNo?: string;
  name?: string;
  gender?: string;
  phone?: string;
  email?: string;
  idCard?: string;
  department?: string;
  position?: string;
  jobLevel?: string;
  onboardDate?: Date;
  workType?: string;
  workLocation?: string;
  offerSalary?: string;
  salaryBase?: number;
  salaryPerformance?: number;
  salaryUnit?: string;
  probationPeriod?: number;
  probationSalary?: string;
  contractType?: string;
  contractTerm?: number;
  reportTo?: string;
  contractSigned?: boolean;
  materialsComplete?: boolean;
  socialSecurityAccount?: boolean;
  providentFundAccount?: boolean;
  generatedBy?: number;
  generatedByName?: string;
  originalData?: string;
}

interface OnboardLedgerCreationAttributes
  extends Optional<OnboardLedgerAttributes, 'id'> {}

class OnboardLedger
  extends Model<OnboardLedgerAttributes, OnboardLedgerCreationAttributes>
  implements OnboardLedgerAttributes
{
  public id!: number;
  public onboardId!: number;
  public ledgerNo?: string;
  public employeeNo?: string;
  public name?: string;
  public gender?: string;
  public phone?: string;
  public email?: string;
  public idCard?: string;
  public department?: string;
  public position?: string;
  public jobLevel?: string;
  public onboardDate?: Date;
  public workType?: string;
  public workLocation?: string;
  public offerSalary?: string;
  public salaryBase?: number;
  public salaryPerformance?: number;
  public salaryUnit?: string;
  public probationPeriod?: number;
  public probationSalary?: string;
  public contractType?: string;
  public contractTerm?: number;
  public reportTo?: string;
  public contractSigned?: boolean;
  public materialsComplete?: boolean;
  public socialSecurityAccount?: boolean;
  public providentFundAccount?: boolean;
  public generatedBy?: number;
  public generatedByName?: string;
  public originalData?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

OnboardLedger.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '台账ID',
    },
    onboardId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '入职记录ID',
    },
    ledgerNo: {
      type: DataTypes.STRING(50),
      comment: '台账编号',
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
      type: DataTypes.STRING(10),
      comment: '性别',
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
      comment: '职级',
    },
    onboardDate: {
      type: DataTypes.DATE,
      comment: '入职日期',
    },
    workType: {
      type: DataTypes.STRING(20),
      comment: '工作性质',
    },
    workLocation: {
      type: DataTypes.STRING(255),
      comment: '工作地点',
    },
    offerSalary: {
      type: DataTypes.STRING(50),
      comment: '薪资',
    },
    salaryBase: {
      type: DataTypes.DECIMAL(10, 2),
      comment: '基本工资(K)',
    },
    salaryPerformance: {
      type: DataTypes.DECIMAL(10, 2),
      comment: '绩效工资(K)',
    },
    salaryUnit: {
      type: DataTypes.STRING(10),
      comment: '薪资单位',
    },
    probationPeriod: {
      type: DataTypes.INTEGER,
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
    reportTo: {
      type: DataTypes.STRING(50),
      comment: '汇报对象',
    },
    contractSigned: {
      type: DataTypes.BOOLEAN,
      comment: '合同签订状态',
    },
    materialsComplete: {
      type: DataTypes.BOOLEAN,
      comment: '材料齐全状态',
    },
    socialSecurityAccount: {
      type: DataTypes.BOOLEAN,
      comment: '社保开户',
    },
    providentFundAccount: {
      type: DataTypes.BOOLEAN,
      comment: '公积金开户',
    },
    generatedBy: {
      type: DataTypes.INTEGER,
      comment: '生成人ID',
    },
    generatedByName: {
      type: DataTypes.STRING(50),
      comment: '生成人姓名',
    },
    originalData: {
      type: DataTypes.TEXT,
      comment: '原始入职数据快照（JSON）',
    },
  },
  {
    sequelize,
    tableName: 'onboard_ledger',
    comment: '入职台账表',
    indexes: [
      { fields: ['onboardId'], unique: true },
      { fields: ['ledgerNo'], unique: true },
      { fields: ['employeeNo'], unique: true },
      { fields: ['department'] },
      { fields: ['onboardDate'] },
    ],
  }
);

export default OnboardLedger;

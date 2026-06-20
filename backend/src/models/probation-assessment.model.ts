import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ProbationAssessmentAttributes {
  id: number;
  probationId: number;
  indicatorName: string;
  indicatorWeight: number;
  indicatorDesc?: string;
  targetValue?: string;
  actualValue?: string;
  score?: number;
  evaluatorId?: number;
  evaluatorName?: string;
  evaluationTime?: Date;
  remark?: string;
}

interface ProbationAssessmentCreationAttributes
  extends Optional<ProbationAssessmentAttributes, 'id'> {}

class ProbationAssessment
  extends Model<ProbationAssessmentAttributes, ProbationAssessmentCreationAttributes>
  implements ProbationAssessmentAttributes
{
  public id!: number;
  public probationId!: number;
  public indicatorName!: string;
  public indicatorWeight!: number;
  public indicatorDesc?: string;
  public targetValue?: string;
  public actualValue?: string;
  public score?: number;
  public evaluatorId?: number;
  public evaluatorName?: string;
  public evaluationTime?: Date;
  public remark?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

ProbationAssessment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '考核指标ID',
    },
    probationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '试用期记录ID',
    },
    indicatorName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '指标名称',
    },
    indicatorWeight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      comment: '指标权重(%)',
    },
    indicatorDesc: {
      type: DataTypes.TEXT,
      comment: '指标描述(从岗位职责提取)',
    },
    targetValue: {
      type: DataTypes.STRING(255),
      comment: '目标值',
    },
    actualValue: {
      type: DataTypes.STRING(255),
      comment: '实际值',
    },
    score: {
      type: DataTypes.INTEGER,
      comment: '得分(0-100)',
    },
    evaluatorId: {
      type: DataTypes.INTEGER,
      comment: '评价人ID',
    },
    evaluatorName: {
      type: DataTypes.STRING(50),
      comment: '评价人姓名',
    },
    evaluationTime: {
      type: DataTypes.DATE,
      comment: '评价时间',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'probation_assessment',
    comment: '试用期考核指标表',
    paranoid: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    deletedAt: 'deleted_at',
    indexes: [
      { fields: ['probationId'] },
      { fields: ['evaluatorId'] },
      { fields: ['created_at'] },
    ],
  }
);

export default ProbationAssessment;

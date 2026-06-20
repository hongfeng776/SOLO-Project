import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AssessmentIndicatorAttributes {
  id: number;
  probationId: number;
  name: string;
  description?: string;
  weight: number;
  sortOrder: number;
  score?: number;
  comment?: string;
  isRequired?: boolean;
  category?: string;
}

interface AssessmentIndicatorCreationAttributes
  extends Optional<AssessmentIndicatorAttributes, 'id' | 'sortOrder' | 'isRequired'> {}

class ProbationAssessmentIndicator
  extends Model<AssessmentIndicatorAttributes, AssessmentIndicatorCreationAttributes>
  implements AssessmentIndicatorAttributes
{
  public id!: number;
  public probationId!: number;
  public name!: string;
  public description?: string;
  public weight!: number;
  public sortOrder!: number;
  public score?: number;
  public comment?: string;
  public isRequired?: boolean;
  public category?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ProbationAssessmentIndicator.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '指标名称',
    },
    description: {
      type: DataTypes.TEXT,
      comment: '指标说明',
    },
    weight: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: '权重(%)',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '排序',
    },
    score: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '得分(0-100)',
    },
    comment: {
      type: DataTypes.TEXT,
      comment: '评分说明',
    },
    isRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否必选指标',
    },
    category: {
      type: DataTypes.STRING(50),
      comment: '指标类别',
    },
  },
  {
    sequelize,
    tableName: 'probation_assessment_indicator',
    comment: '试用期考核指标表',
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['probationId'] },
      { fields: ['category'] },
    ],
  }
);

export default ProbationAssessmentIndicator;

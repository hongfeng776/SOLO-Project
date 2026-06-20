import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface ScreenTemplateAttributes {
  id: number;
  name: string;
  description?: string;
  conditions: string;
  jobId?: number;
  isGlobal?: boolean;
  creatorId?: number;
  creatorName?: string;
  useCount?: number;
}

interface ScreenTemplateCreationAttributes extends Optional<ScreenTemplateAttributes, 'id' | 'useCount'> {}

class ScreenTemplate extends Model<ScreenTemplateAttributes, ScreenTemplateCreationAttributes> implements ScreenTemplateAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public conditions!: string;
  public jobId?: number;
  public isGlobal?: boolean;
  public creatorId?: number;
  public creatorName?: string;
  public useCount?: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ScreenTemplate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '模板ID',
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '模板名称',
    },
    description: {
      type: DataTypes.STRING(500),
      comment: '模板描述',
    },
    conditions: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '筛选条件（JSON格式）',
    },
    jobId: {
      type: DataTypes.INTEGER,
      comment: '关联岗位ID（为空表示通用模板）',
    },
    isGlobal: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否全局模板',
    },
    creatorId: {
      type: DataTypes.INTEGER,
      comment: '创建人ID',
    },
    creatorName: {
      type: DataTypes.STRING(50),
      comment: '创建人姓名',
    },
    useCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '使用次数',
    },
  },
  {
    sequelize,
    tableName: 'screen_template',
    comment: '筛选规则模板表',
    indexes: [
      { fields: ['jobId'] },
      { fields: ['isGlobal'] },
      { fields: ['creatorId'] },
    ],
  }
);

export default ScreenTemplate;

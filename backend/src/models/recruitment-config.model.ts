import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface RecruitmentConfigAttributes {
  id: number;
  companyId: number;
  companyName?: string;
  displayTags: string;
  welfareTags: string;
  requirements: string;
  workTypes: string;
  jobCategories: string;
  configStatus: 'enabled' | 'disabled';
  version: number;
  createdBy?: number;
  createdByName?: string;
  updatedBy?: number;
  updatedByName?: string;
  activatedAt?: Date;
  deactivatedAt?: Date;
  activityLevel?: number;
  positionGapCount?: number;
}

interface RecruitmentConfigCreationAttributes extends Optional<RecruitmentConfigAttributes, 'id' | 'version' | 'configStatus'> {}

class RecruitmentConfig extends Model<RecruitmentConfigAttributes, RecruitmentConfigCreationAttributes> implements RecruitmentConfigAttributes {
  public id!: number;
  public companyId!: number;
  public companyName?: string;
  public displayTags!: string;
  public welfareTags!: string;
  public requirements!: string;
  public workTypes!: string;
  public jobCategories!: string;
  public configStatus!: 'enabled' | 'disabled';
  public version!: number;
  public createdBy?: number;
  public createdByName?: string;
  public updatedBy?: number;
  public updatedByName?: string;
  public activatedAt?: Date;
  public deactivatedAt?: Date;
  public activityLevel?: number;
  public positionGapCount?: number;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;
}

RecruitmentConfig.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '配置ID',
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '企业ID',
    },
    companyName: {
      type: DataTypes.STRING(100),
      comment: '企业名称',
    },
    displayTags: {
      type: DataTypes.STRING(500),
      defaultValue: '',
      comment: '招聘展示标签，逗号分隔',
    },
    welfareTags: {
      type: DataTypes.STRING(500),
      defaultValue: '',
      comment: '招聘福利标签，逗号分隔',
    },
    requirements: {
      type: DataTypes.TEXT,
      comment: '应聘要求',
    },
    workTypes: {
      type: DataTypes.STRING(255),
      defaultValue: '',
      comment: '工作类型，逗号分隔',
    },
    jobCategories: {
      type: DataTypes.STRING(255),
      defaultValue: '',
      comment: '岗位分类，逗号分隔',
    },
    configStatus: {
      type: DataTypes.ENUM('enabled', 'disabled'),
      defaultValue: 'disabled',
      comment: '配置状态 enabled-启用 disabled-停用',
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      comment: '配置版本号',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      comment: '创建人ID',
    },
    createdByName: {
      type: DataTypes.STRING(50),
      comment: '创建人姓名',
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      comment: '更新人ID',
    },
    updatedByName: {
      type: DataTypes.STRING(50),
      comment: '更新人姓名',
    },
    activatedAt: {
      type: DataTypes.DATE,
      comment: '最近启用时间',
    },
    deactivatedAt: {
      type: DataTypes.DATE,
      comment: '最近停用时间',
    },
    activityLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '招聘活跃度 0-100',
    },
    positionGapCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '岗位缺口数量',
    },
  },
  {
    sequelize,
    tableName: 'recruitment_config',
    comment: '企业招聘配置表',
    indexes: [
      { fields: ['companyId'], unique: true },
      { fields: ['configStatus'] },
      { fields: ['activityLevel'] },
      { fields: ['positionGapCount'] },
    ],
  }
);

export default RecruitmentConfig;

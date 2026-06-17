import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ConfigLogAction = 'create' | 'update' | 'enable' | 'disable' | 'batch_replace';

interface RecruitmentConfigLogAttributes {
  id: number;
  configId: number;
  companyId: number;
  companyName?: string;
  action: ConfigLogAction;
  changedFields: string;
  oldValues?: string;
  newValues?: string;
  versionBefore?: number;
  versionAfter?: number;
  operatorId?: number;
  operatorName?: string;
  operatorRole?: string;
  operationRemark?: string;
  isComplianceChecked: boolean;
  complianceIssues?: string;
  isDuplicateDetected: boolean;
  effectiveMode?: 'global' | 'backend_only';
}

interface RecruitmentConfigLogCreationAttributes extends Optional<RecruitmentConfigLogAttributes, 'id' | 'isComplianceChecked' | 'isDuplicateDetected'> {}

class RecruitmentConfigLog extends Model<RecruitmentConfigLogAttributes, RecruitmentConfigLogCreationAttributes> {
  public id!: number;
  public configId!: number;
  public companyId!: number;
  public companyName?: string;
  public action!: ConfigLogAction;
  public changedFields!: string;
  public oldValues?: string;
  public newValues?: string;
  public versionBefore?: number;
  public versionAfter?: number;
  public operatorId?: number;
  public operatorName?: string;
  public operatorRole?: string;
  public operationRemark?: string;
  public isComplianceChecked!: boolean;
  public complianceIssues?: string;
  public isDuplicateDetected!: boolean;
  public effectiveMode?: 'global' | 'backend_only';

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

RecruitmentConfigLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    configId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    action: {
      type: DataTypes.ENUM('create', 'update', 'enable', 'disable', 'batch_replace'),
      allowNull: false,
      comment: '操作类型',
    },
    changedFields: {
      type: DataTypes.STRING(500),
      defaultValue: '',
      comment: '变更字段列表，逗号分隔',
    },
    oldValues: {
      type: DataTypes.TEXT,
      comment: '变更前值 JSON',
    },
    newValues: {
      type: DataTypes.TEXT,
      comment: '变更后值 JSON',
    },
    versionBefore: {
      type: DataTypes.INTEGER,
      comment: '变更前版本号',
    },
    versionAfter: {
      type: DataTypes.INTEGER,
      comment: '变更后版本号',
    },
    operatorId: {
      type: DataTypes.INTEGER,
      comment: '操作人ID',
    },
    operatorName: {
      type: DataTypes.STRING(50),
      comment: '操作人姓名',
    },
    operatorRole: {
      type: DataTypes.STRING(20),
      comment: '操作人角色',
    },
    operationRemark: {
      type: DataTypes.STRING(500),
      comment: '操作备注',
    },
    isComplianceChecked: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '是否通过合规校验',
    },
    complianceIssues: {
      type: DataTypes.STRING(500),
      comment: '合规问题，逗号分隔',
    },
    isDuplicateDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否检测到重复配置',
    },
    effectiveMode: {
      type: DataTypes.ENUM('global', 'backend_only'),
      defaultValue: 'global',
      comment: '生效模式 global-全局 backend_only-仅后台',
    },
  },
  {
    sequelize,
    tableName: 'recruitment_config_log',
    comment: '企业招聘配置变更日志表',
    indexes: [
      { fields: ['configId'] },
      { fields: ['companyId'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
    ],
  }
);

export default RecruitmentConfigLog;

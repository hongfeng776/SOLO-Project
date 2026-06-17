import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { CompanyChangeAction } from '../constants/recruitment.enum';

interface CompanyChangeLogAttributes {
  id: number;
  companyId: number;
  action: CompanyChangeAction;
  changedFields: string;
  oldValues?: string;
  newValues?: string;
  operatorId?: number;
  operatorName?: string;
  needAudit: boolean;
  auditStatus?: 'pending' | 'approved' | 'rejected';
  auditorId?: number;
  auditorName?: string;
  auditRemark?: string;
  auditTime?: Date;
  effectiveMode?: 'global' | 'backend_only';
  remark?: string;
}

interface CompanyChangeLogCreationAttributes extends Optional<CompanyChangeLogAttributes, 'id' | 'needAudit' | 'effectiveMode'> {}

class CompanyChangeLog extends Model<CompanyChangeLogAttributes, CompanyChangeLogCreationAttributes> implements CompanyChangeLogAttributes {
  public id!: number;
  public companyId!: number;
  public action!: CompanyChangeAction;
  public changedFields!: string;
  public oldValues?: string;
  public newValues?: string;
  public operatorId?: number;
  public operatorName?: string;
  public needAudit!: boolean;
  public auditStatus?: 'pending' | 'approved' | 'rejected';
  public auditorId?: number;
  public auditorName?: string;
  public auditRemark?: string;
  public auditTime?: Date;
  public effectiveMode?: 'global' | 'backend_only';
  public remark?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

CompanyChangeLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '变更日志ID',
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '企业ID',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作类型 create/update/batch_update/update_approve/update_reject',
    },
    changedFields: {
      type: DataTypes.STRING(255),
      allowNull: false,
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
    operatorId: {
      type: DataTypes.INTEGER,
      comment: '操作人ID',
    },
    operatorName: {
      type: DataTypes.STRING(50),
      comment: '操作人姓名',
    },
    needAudit: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否需要审核',
    },
    auditStatus: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      comment: '审核状态 pending-待审核 approved-已通过 rejected-已驳回',
    },
    auditorId: {
      type: DataTypes.INTEGER,
      comment: '审核人ID',
    },
    auditorName: {
      type: DataTypes.STRING(50),
      comment: '审核人姓名',
    },
    auditRemark: {
      type: DataTypes.STRING(500),
      comment: '审核备注',
    },
    auditTime: {
      type: DataTypes.DATE,
      comment: '审核时间',
    },
    effectiveMode: {
      type: DataTypes.ENUM('global', 'backend_only'),
      defaultValue: 'global',
      comment: '生效模式 global-全局生效 backend_only-仅后台生效',
    },
    remark: {
      type: DataTypes.STRING(500),
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'company_change_log',
    comment: '企业信息变更日志表',
    indexes: [
      { fields: ['companyId'] },
      { fields: ['operatorId'] },
      { fields: ['auditStatus'] },
      { fields: ['created_at'] },
    ],
  }
);

export default CompanyChangeLog;

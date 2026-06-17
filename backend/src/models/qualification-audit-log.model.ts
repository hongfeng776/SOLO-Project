import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

interface QualificationAuditLogAttributes {
  id: number;
  qualificationId: number;
  action: string;
  fromStatus: string;
  toStatus: string;
  operatorId?: number;
  operatorName?: string;
  remark?: string;
}

interface QualificationAuditLogCreationAttributes
  extends Optional<QualificationAuditLogAttributes, 'id'> {}

class QualificationAuditLog
  extends Model<
    QualificationAuditLogAttributes,
    QualificationAuditLogCreationAttributes
  >
  implements QualificationAuditLogAttributes
{
  public id!: number;
  public qualificationId!: number;
  public action!: string;
  public fromStatus!: string;
  public toStatus!: string;
  public operatorId?: number;
  public operatorName?: string;
  public remark?: string;

  public readonly created_at!: Date;
}

QualificationAuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    qualificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资质ID',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '操作动作',
    },
    fromStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '原状态',
    },
    toStatus: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: '新状态',
    },
    operatorId: {
      type: DataTypes.INTEGER,
      comment: '操作人ID',
    },
    operatorName: {
      type: DataTypes.STRING(50),
      comment: '操作人姓名',
    },
    remark: {
      type: DataTypes.TEXT,
      comment: '备注',
    },
  },
  {
    sequelize,
    tableName: 'qualification_audit_log',
    comment: '资质审核日志表',
    timestamps: true,
    updatedAt: false,
    createdAt: 'created_at',
  }
);

export default QualificationAuditLog;

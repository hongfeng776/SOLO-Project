import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { AuditAction, AuditStage, AuditStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface PromoterAuditLogAttributes {
  id: string;
  promoterId: string;
  action: AuditAction;
  fromStage: AuditStage;
  toStage: AuditStage;
  fromStatus: AuditStatus;
  toStatus: AuditStatus;
  operatorId?: string;
  operatorName?: string;
  remark?: string;
  rejectReasonCode?: string;
  rejectCustomRemark?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PromoterAuditLogCreationAttributes extends Optional<PromoterAuditLogAttributes, 'id' | 'operatorId' | 'operatorName' | 'remark' | 'rejectReasonCode' | 'rejectCustomRemark' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class PromoterAuditLog extends Model<PromoterAuditLogAttributes, PromoterAuditLogCreationAttributes> implements PromoterAuditLogAttributes {
  public id!: string;
  public promoterId!: string;
  public action!: AuditAction;
  public fromStage!: AuditStage;
  public toStage!: AuditStage;
  public fromStatus!: AuditStatus;
  public toStatus!: AuditStatus;
  public operatorId?: string;
  public operatorName?: string;
  public remark?: string;
  public rejectReasonCode?: string;
  public rejectCustomRemark?: string;
  public metadata?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PromoterAuditLog.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    promoterId: {
      type: DataTypes.STRING(36),
      allowNull: false,
      references: {
        model: 'promoters',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    fromStage: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    toStage: {
      type: DataTypes.TINYINT,
      allowNull: false,
    },
    fromStatus: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    toStatus: {
      type: DataTypes.STRING(30),
      allowNull: false,
    },
    operatorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    operatorName: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejectReasonCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    rejectCustomRemark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const raw = this.getDataValue('metadata');
        return raw ? JSON.parse(raw) : null;
      },
      set(value: any) {
        this.setDataValue('metadata', value ? JSON.stringify(value) : undefined as any);
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'promoter_audit_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
      {
        name: 'idx_action',
        fields: ['action'],
      },
      {
        name: 'idx_operator_id',
        fields: ['operator_id'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
      {
        name: 'idx_from_stage_to_stage',
        fields: ['from_stage', 'to_stage'],
      },
    ],
  }
);

export { PromoterAuditLog, PromoterAuditLogAttributes, PromoterAuditLogCreationAttributes };
export default PromoterAuditLog;

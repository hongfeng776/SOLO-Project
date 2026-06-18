import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface PromoterChangeLogAttributes {
  id: string;
  promoterId: string;
  operatorId?: string;
  operatorName?: string;
  fieldName: string;
  fieldLabel?: string;
  oldValue?: string;
  newValue?: string;
  changeType?: string;
  remark?: string;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

interface PromoterChangeLogCreationAttributes extends Optional<PromoterChangeLogAttributes, 'id' | 'operatorId' | 'operatorName' | 'fieldLabel' | 'oldValue' | 'newValue' | 'changeType' | 'remark' | 'metadata' | 'createdAt' | 'updatedAt'> {}

class PromoterChangeLog extends Model<PromoterChangeLogAttributes, PromoterChangeLogCreationAttributes> implements PromoterChangeLogAttributes {
  public id!: string;
  public promoterId!: string;
  public operatorId?: string;
  public operatorName?: string;
  public fieldName!: string;
  public fieldLabel?: string;
  public oldValue?: string;
  public newValue?: string;
  public changeType?: string;
  public remark?: string;
  public metadata?: any;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

PromoterChangeLog.init(
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
    operatorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    operatorName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    fieldName: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    fieldLabel: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    oldValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    changeType: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    remark: {
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
    tableName: 'promoter_change_logs',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
      {
        name: 'idx_operator_id',
        fields: ['operator_id'],
      },
      {
        name: 'idx_field_name',
        fields: ['field_name'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
    ],
  }
);

export { PromoterChangeLog, PromoterChangeLogAttributes, PromoterChangeLogCreationAttributes };
export default PromoterChangeLog;

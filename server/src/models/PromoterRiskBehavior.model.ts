import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface PromoterRiskBehaviorAttributes {
  id: string;
  promoterId: string;
  behaviorType: string;
  behaviorDesc?: string;
  ipAddress?: string;
  deviceId?: string;
  location?: string;
  orderId?: string;
  amount?: number;
  riskFlagged?: boolean;
  riskType?: string;
  riskScore?: number;
  metadata?: any;
  createdAt: Date;
}

interface PromoterRiskBehaviorCreationAttributes extends Optional<PromoterRiskBehaviorAttributes, 'id' | 'behaviorDesc' | 'ipAddress' | 'deviceId' | 'location' | 'orderId' | 'amount' | 'riskFlagged' | 'riskType' | 'riskScore' | 'metadata' | 'createdAt'> {}

class PromoterRiskBehavior extends Model<PromoterRiskBehaviorAttributes, PromoterRiskBehaviorCreationAttributes> implements PromoterRiskBehaviorAttributes {
  public id!: string;
  public promoterId!: string;
  public behaviorType!: string;
  public behaviorDesc?: string;
  public ipAddress?: string;
  public deviceId?: string;
  public location?: string;
  public orderId?: string;
  public amount?: number;
  public riskFlagged?: boolean;
  public riskType?: string;
  public riskScore?: number;
  public metadata?: any;
  public readonly createdAt!: Date;
}

PromoterRiskBehavior.init(
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
    behaviorType: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    behaviorDesc: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    ipAddress: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    deviceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    orderId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'orders',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    riskFlagged: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    riskType: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    riskScore: {
      type: DataTypes.DECIMAL(5, 2),
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
  },
  {
    sequelize,
    tableName: 'promoter_risk_behaviors',
    timestamps: false,
    underscored: true,
    indexes: [
      {
        name: 'idx_promoter_id',
        fields: ['promoter_id'],
      },
      {
        name: 'idx_behavior_type',
        fields: ['behavior_type'],
      },
      {
        name: 'idx_risk_flagged',
        fields: ['risk_flagged'],
      },
      {
        name: 'idx_created_at',
        fields: ['created_at'],
      },
      {
        name: 'idx_order_id',
        fields: ['order_id'],
      },
    ],
  }
);

export { PromoterRiskBehavior, PromoterRiskBehaviorAttributes, PromoterRiskBehaviorCreationAttributes };
export default PromoterRiskBehavior;

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { BlacklistType } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface PromoterBlacklistAttributes {
  id: string;
  type: BlacklistType;
  value: string;
  reason?: string;
  operatorId?: string;
  source?: string;
  expiredAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface PromoterBlacklistCreationAttributes extends Optional<PromoterBlacklistAttributes, 'id' | 'reason' | 'operatorId' | 'source' | 'expiredAt' | 'isActive' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class PromoterBlacklist extends Model<PromoterBlacklistAttributes, PromoterBlacklistCreationAttributes> implements PromoterBlacklistAttributes {
  public id!: string;
  public type!: BlacklistType;
  public value!: string;
  public reason?: string;
  public operatorId?: string;
  public source?: string;
  public expiredAt?: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

PromoterBlacklist.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    type: {
      type: DataTypes.ENUM(BlacklistType.PHONE, BlacklistType.ID_CARD, BlacklistType.NAME, BlacklistType.WECHAT),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    operatorId: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    source: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    expiredAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
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
    tableName: 'promoter_blacklists',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_type_value',
        fields: ['type', 'value'],
        unique: true,
      },
      {
        name: 'idx_is_active',
        fields: ['is_active'],
      },
      {
        name: 'idx_expired_at',
        fields: ['expired_at'],
      },
    ],
  }
);

export { PromoterBlacklist, PromoterBlacklistAttributes, PromoterBlacklistCreationAttributes };
export default PromoterBlacklist;

import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ChannelBlacklistType } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ChannelBlacklistAttributes {
  id: string;
  type: ChannelBlacklistType;
  value: string;
  companyName?: string;
  reason?: string;
  addedBy?: string;
  addedByName?: string;
  source?: string;
  expiredAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ChannelBlacklistCreationAttributes extends Optional<ChannelBlacklistAttributes,
  'id' | 'isActive' | 'createdAt' | 'updatedAt'> {}

class ChannelBlacklist extends Model<ChannelBlacklistAttributes, ChannelBlacklistCreationAttributes> implements ChannelBlacklistAttributes {
  public id!: string;
  public type!: ChannelBlacklistType;
  public value!: string;
  public companyName?: string;
  public reason?: string;
  public addedBy?: string;
  public addedByName?: string;
  public source?: string;
  public expiredAt?: Date;
  public isActive!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChannelBlacklist.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    value: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    companyName: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    addedBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    addedByName: {
      type: DataTypes.STRING(100),
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
    tableName: 'channel_blacklists',
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'idx_type_value', fields: ['type', 'value'] },
      { name: 'idx_is_active', fields: ['is_active'] },
      { name: 'idx_company_name', fields: ['company_name'] },
    ],
  }
);

export { ChannelBlacklist, ChannelBlacklistAttributes, ChannelBlacklistCreationAttributes };
export default ChannelBlacklist;

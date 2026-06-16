import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { v4 as uuidv4 } from 'uuid';

interface ChannelExtensionAttributes {
  id: string;
  channelId: string;
  extensionType: string;
  config: any;
  commissionRules?: any;
  settlementRules?: any;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}

interface ChannelExtensionCreationAttributes extends Optional<ChannelExtensionAttributes, 'id' | 'commissionRules' | 'settlementRules' | 'status' | 'createdAt' | 'updatedAt'> {}

class ChannelExtension extends Model<ChannelExtensionAttributes, ChannelExtensionCreationAttributes> implements ChannelExtensionAttributes {
  public id!: string;
  public channelId!: string;
  public extensionType!: string;
  public config!: any;
  public commissionRules?: any;
  public settlementRules?: any;
  public status!: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChannelExtension.init(
  {
    id: { type: DataTypes.STRING(36), primaryKey: true, defaultValue: () => uuidv4() },
    channelId: { type: DataTypes.STRING(36), allowNull: false, references: { model: 'channels', key: 'id' } },
    extensionType: { type: DataTypes.STRING(50), allowNull: false },
    config: { type: DataTypes.JSON, allowNull: false },
    commissionRules: { type: DataTypes.JSON, allowNull: true },
    settlementRules: { type: DataTypes.JSON, allowNull: true },
    status: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
    createdAt: { type: DataTypes.DATE, allowNull: false },
    updatedAt: { type: DataTypes.DATE, allowNull: false },
  },
  {
    sequelize,
    tableName: 'channel_extensions',
    timestamps: true,
    underscored: true,
    indexes: [
      { name: 'idx_channel_id', fields: ['channel_id'] },
      { name: 'idx_extension_type', fields: ['extension_type'] },
      { name: 'idx_status', fields: ['status'] },
    ],
  }
);

export { ChannelExtension, ChannelExtensionAttributes, ChannelExtensionCreationAttributes };
export default ChannelExtension;

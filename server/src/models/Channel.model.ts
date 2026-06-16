import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { ChannelStatus, ChannelType } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface ChannelAttributes {
  id: string;
  name: string;
  code: string;
  type: ChannelType;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  commissionRate: number;
  status: ChannelStatus;
  remark?: string;
  sort?: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface ChannelCreationAttributes extends Optional<ChannelAttributes, 'id' | 'type' | 'commissionRate' | 'status' | 'sort' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Channel extends Model<ChannelAttributes, ChannelCreationAttributes> implements ChannelAttributes {
  public id!: string;
  public name!: string;
  public code!: string;
  public type!: ChannelType;
  public contactName?: string;
  public contactPhone?: string;
  public contactEmail?: string;
  public commissionRate!: number;
  public status!: ChannelStatus;
  public remark?: string;
  public sort?: number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Channel.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM(ChannelType.WECHAT, ChannelType.DOUYIN, ChannelType.KUAISHOU, ChannelType.XIAOHONGSHU, ChannelType.WEIBO, ChannelType.OTHER),
      allowNull: false,
      defaultValue: ChannelType.OTHER,
    },
    contactName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    contactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    contactEmail: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    commissionRate: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
      defaultValue: 0,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: ChannelStatus.ENABLED,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    sort: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
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
    tableName: 'channels',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_code',
        fields: ['code'],
      },
      {
        name: 'idx_type',
        fields: ['type'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
    ],
  }
);

export { Channel, ChannelAttributes, ChannelCreationAttributes };
export default Channel;

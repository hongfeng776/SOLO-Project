import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { PromoterLevel, PromoterStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface PromoterAttributes {
  id: string;
  channelId?: string;
  code: string;
  name: string;
  nickname?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  wechatId?: string;
  idCard?: string;
  level: PromoterLevel;
  status: PromoterStatus;
  parentId?: string;
  totalOrders?: number;
  totalAmount?: number;
  totalCommission?: number;
  availableCommission?: number;
  frozenCommission?: number;
  registerAt?: Date;
  lastActiveAt?: Date;
  remark?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface PromoterCreationAttributes extends Optional<PromoterAttributes, 'id' | 'channelId' | 'nickname' | 'avatar' | 'phone' | 'email' | 'wechatId' | 'idCard' | 'level' | 'status' | 'parentId' | 'totalOrders' | 'totalAmount' | 'totalCommission' | 'availableCommission' | 'frozenCommission' | 'registerAt' | 'lastActiveAt' | 'remark' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class Promoter extends Model<PromoterAttributes, PromoterCreationAttributes> implements PromoterAttributes {
  public id!: string;
  public channelId?: string;
  public code!: string;
  public name!: string;
  public nickname?: string;
  public avatar?: string;
  public phone?: string;
  public email?: string;
  public wechatId?: string;
  public idCard?: string;
  public level!: PromoterLevel;
  public status!: PromoterStatus;
  public parentId?: string;
  public totalOrders?: number;
  public totalAmount?: number;
  public totalCommission?: number;
  public availableCommission?: number;
  public frozenCommission?: number;
  public registerAt?: Date;
  public lastActiveAt?: Date;
  public remark?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

Promoter.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    channelId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'channels',
        key: 'id',
      },
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    wechatId: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    idCard: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    level: {
      type: DataTypes.ENUM(PromoterLevel.L1, PromoterLevel.L2, PromoterLevel.L3, PromoterLevel.L4, PromoterLevel.L5),
      allowNull: false,
      defaultValue: PromoterLevel.L1,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: PromoterStatus.NORMAL,
    },
    parentId: {
      type: DataTypes.STRING(36),
      allowNull: true,
      references: {
        model: 'promoters',
        key: 'id',
      },
    },
    totalOrders: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    totalCommission: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    availableCommission: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    frozenCommission: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
    },
    registerAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    remark: {
      type: DataTypes.TEXT,
      allowNull: true,
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
    tableName: 'promoters',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_code',
        fields: ['code'],
      },
      {
        name: 'idx_phone',
        fields: ['phone'],
      },
      {
        name: 'idx_channel_id',
        fields: ['channel_id'],
      },
      {
        name: 'idx_parent_id',
        fields: ['parent_id'],
      },
      {
        name: 'idx_level',
        fields: ['level'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
    ],
  }
);

export { Promoter, PromoterAttributes, PromoterCreationAttributes };
export default Promoter;

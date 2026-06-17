import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { UserRole, UserStatus } from '../constants/enum';
import { v4 as uuidv4 } from 'uuid';

interface UserAttributes {
  id: string;
  username: string;
  password: string;
  nickname: string;
  avatar?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  position?: string;
  positionLevel?: number;
  createdBy?: string;
  createdByName?: string;
  activatedAt?: Date;
  lastActiveAt?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'nickname' | 'role' | 'status' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public username!: string;
  public password!: string;
  public nickname!: string;
  public avatar?: string;
  public email?: string;
  public phone?: string;
  public role!: UserRole;
  public status!: UserStatus;
  public position?: string;
  public positionLevel?: number;
  public createdBy?: string;
  public createdByName?: string;
  public activatedAt?: Date;
  public lastActiveAt?: Date;
  public lastLoginAt?: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
  public readonly deletedAt?: Date;
}

User.init(
  {
    id: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      defaultValue: () => uuidv4(),
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    nickname: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: '',
    },
    avatar: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM(UserRole.ADMIN, UserRole.USER, UserRole.GUEST),
      allowNull: false,
      defaultValue: UserRole.USER,
    },
    status: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: UserStatus.ACTIVE,
    },
    position: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    positionLevel: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1,
        max: 10,
      },
    },
    createdBy: {
      type: DataTypes.STRING(36),
      allowNull: true,
    },
    createdByName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    activatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastActiveAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
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
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: 'idx_username',
        fields: ['username'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
    ],
  }
);

export { User, UserAttributes, UserCreationAttributes };
export default User;

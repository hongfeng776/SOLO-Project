import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { UserRole } from '../constants/recruitment.enum';
import bcrypt from 'bcryptjs';

interface UserAttributes {
  id: number;
  username: string;
  password: string;
  realName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  companyId?: number;
  department?: string;
  position?: string;
  status: number;
  lastLoginTime?: Date;
  lastLoginIp?: string;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'status'> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: number;
  public username!: string;
  public password!: string;
  public realName?: string;
  public email?: string;
  public phone?: string;
  public avatar?: string;
  public role!: UserRole;
  public companyId?: number;
  public department?: string;
  public position?: string;
  public status!: number;
  public lastLoginTime?: Date;
  public lastLoginIp?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  public readonly deleted_at?: Date;

  public async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '用户ID',
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '用户名',
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '密码',
    },
    realName: {
      type: DataTypes.STRING(50),
      comment: '真实姓名',
    },
    email: {
      type: DataTypes.STRING(100),
      comment: '邮箱',
    },
    phone: {
      type: DataTypes.STRING(20),
      comment: '手机号',
    },
    avatar: {
      type: DataTypes.STRING(255),
      comment: '头像',
    },
    role: {
      type: DataTypes.ENUM('admin', 'hr', 'interviewer'),
      defaultValue: UserRole.HR,
      comment: '用户角色',
    },
    companyId: {
      type: DataTypes.INTEGER,
      comment: '所属企业ID',
    },
    department: {
      type: DataTypes.STRING(50),
      comment: '所属部门',
    },
    position: {
      type: DataTypes.STRING(100),
      comment: '职位',
    },
    status: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: '状态 0-禁用 1-启用',
    },
    lastLoginTime: {
      type: DataTypes.DATE,
      comment: '最后登录时间',
    },
    lastLoginIp: {
      type: DataTypes.STRING(50),
      comment: '最后登录IP',
    },
  },
  {
    sequelize,
    tableName: 'user',
    comment: '用户表',
    hooks: {
      beforeCreate: async (user: User) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user: User) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

User.prototype.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

export default User;

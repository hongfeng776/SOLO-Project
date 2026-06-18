import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { UserRole, AccountStatus } from '../constants/recruitment.enum';
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
  accountStatus: AccountStatus;
  expireAt?: Date;
  permissions?: string;
  dataScope?: string;
  isMainAccount: boolean;
  operationCount?: number;
  lastOperationTime?: Date;
  loginCount?: number;
  isAnomalyLogin: boolean;
  anomalyReason?: string;
  lastLoginDevice?: string;
  lastLoginLocation?: string;
  remark?: string;
  lastLoginTime?: Date;
  lastLoginIp?: string;
  onlineStatus?: string;
  lastOnlineTime?: Date;
  lockedDevices?: string;
  lastLoginAnomalyType?: string;
  lastLoginRiskLevel?: string;
  twoFactorEnabled?: boolean;
  twoFactorType?: string;
  loginRiskScore?: number;
  consecutiveFailedAttempts?: number;
  lastFailedLoginTime?: Date;
  trustedDevices?: string;
  trustedIps?: string;
  lastPasswordChangeTime?: Date;
  passwordResetRequired?: boolean;
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'role' | 'status' | 'accountStatus' | 'isMainAccount' | 'isAnomalyLogin'> {}

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
  public accountStatus!: AccountStatus;
  public expireAt?: Date;
  public permissions?: string;
  public dataScope?: string;
  public isMainAccount!: boolean;
  public operationCount?: number;
  public lastOperationTime?: Date;
  public loginCount?: number;
  public isAnomalyLogin!: boolean;
  public anomalyReason?: string;
  public lastLoginDevice?: string;
  public lastLoginLocation?: string;
  public remark?: string;
  public lastLoginTime?: Date;
  public lastLoginIp?: string;
  public onlineStatus?: string;
  public lastOnlineTime?: Date;
  public lockedDevices?: string;
  public lastLoginAnomalyType?: string;
  public lastLoginRiskLevel?: string;
  public twoFactorEnabled?: boolean;
  public twoFactorType?: string;
  public loginRiskScore?: number;
  public consecutiveFailedAttempts?: number;
  public lastFailedLoginTime?: Date;
  public trustedDevices?: string;
  public trustedIps?: string;
  public lastPasswordChangeTime?: Date;
  public passwordResetRequired?: boolean;

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
    accountStatus: {
      type: DataTypes.ENUM('normal', 'frozen', 'expired'),
      defaultValue: AccountStatus.NORMAL,
      comment: '账号状态 normal-正常 frozen-冻结 expired-过期',
    },
    expireAt: {
      type: DataTypes.DATE,
      comment: '账号过期时间',
    },
    permissions: {
      type: DataTypes.TEXT,
      comment: '操作权限列表，JSON格式',
    },
    dataScope: {
      type: DataTypes.STRING(50),
      comment: '数据查看范围 all-全部 dept-本部门 self-仅自己',
    },
    isMainAccount: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否主账号',
    },
    operationCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '操作次数',
    },
    lastOperationTime: {
      type: DataTypes.DATE,
      comment: '最后操作时间',
    },
    loginCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '登录次数',
    },
    isAnomalyLogin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否异常登录',
    },
    anomalyReason: {
      type: DataTypes.STRING(255),
      comment: '异常原因',
    },
    lastLoginDevice: {
      type: DataTypes.STRING(100),
      comment: '最后登录设备',
    },
    lastLoginLocation: {
      type: DataTypes.STRING(100),
      comment: '最后登录地点',
    },
    remark: {
      type: DataTypes.STRING(500),
      comment: '账号备注',
    },
    lastLoginTime: {
      type: DataTypes.DATE,
      comment: '最后登录时间',
    },
    lastLoginIp: {
      type: DataTypes.STRING(50),
      comment: '最后登录IP',
    },
    onlineStatus: {
      type: DataTypes.STRING(20),
      defaultValue: 'offline',
      comment: '在线状态 online-在线 offline-离线 busy-忙碌 away-离开',
    },
    lastOnlineTime: {
      type: DataTypes.DATE,
      comment: '最后在线时间',
    },
    lockedDevices: {
      type: DataTypes.TEXT,
      comment: '锁定的设备列表（JSON格式）',
    },
    lastLoginAnomalyType: {
      type: DataTypes.STRING(50),
      comment: '最后登录异常类型',
    },
    lastLoginRiskLevel: {
      type: DataTypes.STRING(20),
      comment: '最后登录风险等级',
    },
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否开启二次验证',
    },
    twoFactorType: {
      type: DataTypes.STRING(20),
      comment: '二次验证类型',
    },
    loginRiskScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '登录风险评分 0-100',
    },
    consecutiveFailedAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '连续失败登录次数',
    },
    lastFailedLoginTime: {
      type: DataTypes.DATE,
      comment: '最后失败登录时间',
    },
    trustedDevices: {
      type: DataTypes.TEXT,
      comment: '可信设备列表（JSON格式）',
    },
    trustedIps: {
      type: DataTypes.TEXT,
      comment: '可信IP列表（JSON格式）',
    },
    lastPasswordChangeTime: {
      type: DataTypes.DATE,
      comment: '最后密码修改时间',
    },
    passwordResetRequired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否需要重置密码',
    },
  },
  {
    sequelize,
    tableName: 'user',
    comment: '用户表',
    indexes: [
      { fields: ['username'], unique: true },
      { fields: ['companyId'] },
      { fields: ['role'] },
      { fields: ['accountStatus'] },
      { fields: ['isMainAccount'] },
      { fields: ['isAnomalyLogin'] },
    ],
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

import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';

export type LoginStatus = 'success' | 'failed' | 'anomaly';

interface LoginLogAttributes {
  id: number;
  userId?: number;
  username?: string;
  companyId?: number;
  companyName?: string;
  loginTime: Date;
  loginIp?: string;
  loginLocation?: string;
  loginDevice?: string;
  userAgent?: string;
  status: LoginStatus;
  failReason?: string;
  isAnomaly: boolean;
  anomalyType?: string;
  anomalyDetail?: string;
  browserInfo?: string;
  osInfo?: string;
  screenResolution?: string;
}

interface LoginLogCreationAttributes extends Optional<LoginLogAttributes, 'id' | 'loginTime' | 'isAnomaly'> {}

class LoginLog extends Model<LoginLogAttributes, LoginLogCreationAttributes> implements LoginLogAttributes {
  public id!: number;
  public userId?: number;
  public username?: string;
  public companyId?: number;
  public companyName?: string;
  public loginTime!: Date;
  public loginIp?: string;
  public loginLocation?: string;
  public loginDevice?: string;
  public userAgent?: string;
  public status!: LoginStatus;
  public failReason?: string;
  public isAnomaly!: boolean;
  public anomalyType?: string;
  public anomalyDetail?: string;
  public browserInfo?: string;
  public osInfo?: string;
  public screenResolution?: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

LoginLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '日志ID',
    },
    userId: {
      type: DataTypes.INTEGER,
      comment: '用户ID',
    },
    username: {
      type: DataTypes.STRING(50),
      comment: '用户名',
    },
    companyId: {
      type: DataTypes.INTEGER,
      comment: '企业ID',
    },
    companyName: {
      type: DataTypes.STRING(100),
      comment: '企业名称',
    },
    loginTime: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      comment: '登录时间',
    },
    loginIp: {
      type: DataTypes.STRING(50),
      comment: '登录IP',
    },
    loginLocation: {
      type: DataTypes.STRING(100),
      comment: '登录地点',
    },
    loginDevice: {
      type: DataTypes.STRING(100),
      comment: '登录设备',
    },
    userAgent: {
      type: DataTypes.STRING(500),
      comment: '用户代理',
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'anomaly'),
      defaultValue: 'success',
      comment: '登录状态 success-成功 failed-失败 anomaly-异常',
    },
    failReason: {
      type: DataTypes.STRING(255),
      comment: '失败原因',
    },
    isAnomaly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否异常登录',
    },
    anomalyType: {
      type: DataTypes.STRING(50),
      comment: '异常类型',
    },
    anomalyDetail: {
      type: DataTypes.STRING(500),
      comment: '异常详情',
    },
    browserInfo: {
      type: DataTypes.STRING(100),
      comment: '浏览器信息',
    },
    osInfo: {
      type: DataTypes.STRING(100),
      comment: '操作系统信息',
    },
    screenResolution: {
      type: DataTypes.STRING(50),
      comment: '屏幕分辨率',
    },
  },
  {
    sequelize,
    tableName: 'login_log',
    comment: '登录日志表',
    indexes: [
      { fields: ['userId'] },
      { fields: ['username'] },
      { fields: ['companyId'] },
      { fields: ['status'] },
      { fields: ['loginTime'] },
      { fields: ['isAnomaly'] },
    ],
  }
);

export default LoginLog;

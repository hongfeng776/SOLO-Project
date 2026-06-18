import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { LoginAnomalyType, RiskLevel, TwoFactorType, LoginRiskAction } from '../constants/recruitment.enum';

export type LoginStatus = 'success' | 'failed' | 'anomaly' | 'pending_verify';

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
  deviceFingerprint?: string;
  deviceLocked?: boolean;
  userAgent?: string;
  status: LoginStatus;
  failReason?: string;
  isAnomaly: boolean;
  anomalyType?: LoginAnomalyType;
  anomalyDetail?: string;
  riskLevel?: RiskLevel;
  riskAction?: LoginRiskAction;
  riskScore?: number;
  requireTwoFactor?: boolean;
  twoFactorType?: TwoFactorType;
  twoFactorVerified?: boolean;
  twoFactorVerifyTime?: Date;
  verificationToken?: string;
  browserInfo?: string;
  osInfo?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  networkType?: string;
  isp?: string;
  proxyDetected?: boolean;
  vpnDetected?: boolean;
  behaviorScore?: number;
  markedRisk?: boolean;
  markedRiskBy?: number;
  markedRiskTime?: Date;
  markedRiskReason?: string;
  clearedRisk?: boolean;
  clearedRiskBy?: number;
  clearedRiskTime?: Date;
  riskHandleRemark?: string;
  latitude?: number;
  longitude?: number;
  source?: string;
  sessionId?: string;
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
  public deviceFingerprint?: string;
  public deviceLocked?: boolean;
  public userAgent?: string;
  public status!: LoginStatus;
  public failReason?: string;
  public isAnomaly!: boolean;
  public anomalyType?: LoginAnomalyType;
  public anomalyDetail?: string;
  public riskLevel?: RiskLevel;
  public riskAction?: LoginRiskAction;
  public riskScore?: number;
  public requireTwoFactor?: boolean;
  public twoFactorType?: TwoFactorType;
  public twoFactorVerified?: boolean;
  public twoFactorVerifyTime?: Date;
  public verificationToken?: string;
  public browserInfo?: string;
  public osInfo?: string;
  public screenResolution?: string;
  public timezone?: string;
  public language?: string;
  public networkType?: string;
  public isp?: string;
  public proxyDetected?: boolean;
  public vpnDetected?: boolean;
  public behaviorScore?: number;
  public markedRisk?: boolean;
  public markedRiskBy?: number;
  public markedRiskTime?: Date;
  public markedRiskReason?: string;
  public clearedRisk?: boolean;
  public clearedRiskBy?: number;
  public clearedRiskTime?: Date;
  public riskHandleRemark?: string;
  public latitude?: number;
  public longitude?: number;
  public source?: string;
  public sessionId?: string;

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
    deviceFingerprint: {
      type: DataTypes.STRING(255),
      comment: '设备指纹',
    },
    deviceLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '设备是否被锁定',
    },
    userAgent: {
      type: DataTypes.STRING(500),
      comment: '用户代理',
    },
    status: {
      type: DataTypes.ENUM('success', 'failed', 'anomaly', 'pending_verify'),
      defaultValue: 'success',
      comment: '登录状态 success-成功 failed-失败 anomaly-异常 pending_verify-待验证',
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
    riskLevel: {
      type: DataTypes.STRING(20),
      comment: '风险等级 low-低 medium-中 high-高 critical-极高',
    },
    riskAction: {
      type: DataTypes.STRING(20),
      comment: '风控处理动作',
    },
    riskScore: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '风险评分 0-100',
    },
    requireTwoFactor: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否需要二次验证',
    },
    twoFactorType: {
      type: DataTypes.STRING(20),
      comment: '二次验证类型 sms-短信 email-邮箱 totp-动态口令 question-安全问题',
    },
    twoFactorVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '二次验证是否通过',
    },
    twoFactorVerifyTime: {
      type: DataTypes.DATE,
      comment: '二次验证时间',
    },
    verificationToken: {
      type: DataTypes.STRING(100),
      comment: '验证令牌',
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
    timezone: {
      type: DataTypes.STRING(50),
      comment: '时区',
    },
    language: {
      type: DataTypes.STRING(20),
      comment: '浏览器语言',
    },
    networkType: {
      type: DataTypes.STRING(20),
      comment: '网络类型 wifi/4g/5g',
    },
    isp: {
      type: DataTypes.STRING(50),
      comment: '网络服务商',
    },
    proxyDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否检测到代理',
    },
    vpnDetected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否检测到VPN',
    },
    behaviorScore: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
      comment: '行为评分 0-100',
    },
    markedRisk: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否标记为风险记录',
    },
    markedRiskBy: {
      type: DataTypes.INTEGER,
      comment: '标记风险的操作人ID',
    },
    markedRiskTime: {
      type: DataTypes.DATE,
      comment: '标记风险时间',
    },
    markedRiskReason: {
      type: DataTypes.STRING(500),
      comment: '标记风险原因',
    },
    clearedRisk: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: '是否已清除风险标记',
    },
    clearedRiskBy: {
      type: DataTypes.INTEGER,
      comment: '清除风险的操作人ID',
    },
    clearedRiskTime: {
      type: DataTypes.DATE,
      comment: '清除风险时间',
    },
    riskHandleRemark: {
      type: DataTypes.STRING(500),
      comment: '风险处理备注',
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 6),
      comment: '纬度',
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 6),
      comment: '经度',
    },
    source: {
      type: DataTypes.STRING(50),
      comment: '登录来源',
    },
    sessionId: {
      type: DataTypes.STRING(100),
      comment: '会话ID',
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
      { fields: ['riskLevel'] },
      { fields: ['markedRisk'] },
      { fields: ['deviceFingerprint'] },
      { fields: ['loginIp'] },
    ],
  }
);

export default LoginLog;

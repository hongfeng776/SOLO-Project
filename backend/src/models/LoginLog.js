const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const LoginLog = sequelize.define(
  'LoginLog',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, comment: '登录日志ID' },
    userId: { type: DataTypes.INTEGER, allowNull: true, comment: '用户ID(登录成功才有)' },
    uid: { type: DataTypes.STRING(32), allowNull: true, comment: '用户UID' },
    username: { type: DataTypes.STRING(50), allowNull: false, comment: '登录账号(用户名/手机号)' },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'failed', 'blocked', 'verified', 'risk'),
      defaultValue: 'pending',
      allowNull: false,
      comment: '登录状态: pending待验证 success成功 failed失败 blocked风控拦截 verified二次验证通过 risk标记风险'
    },
    riskLevel: {
      type: DataTypes.ENUM('none', 'low', 'medium', 'high', 'critical'),
      defaultValue: 'none',
      allowNull: false,
      comment: '风险等级'
    },
    failReason: { type: DataTypes.STRING(200), allowNull: true, comment: '失败/拦截原因' },

    deviceId: { type: DataTypes.STRING(128), allowNull: true, comment: '设备唯一标识(UUID)' },
    deviceName: { type: DataTypes.STRING(200), allowNull: true, comment: '设备名称' },
    deviceBrand: { type: DataTypes.STRING(100), allowNull: true, comment: '设备品牌' },
    deviceModel: { type: DataTypes.STRING(100), allowNull: true, comment: '设备型号' },
    os: { type: DataTypes.STRING(50), allowNull: true, comment: '操作系统: Windows/iOS/Android/Mac/Linux' },
    osVersion: { type: DataTypes.STRING(50), allowNull: true, comment: '系统版本' },
    browser: { type: DataTypes.STRING(50), allowNull: true, comment: '浏览器: Chrome/Safari/Firefox等' },
    browserVersion: { type: DataTypes.STRING(50), allowNull: true, comment: '浏览器版本' },
    screenSize: { type: DataTypes.STRING(20), allowNull: true, comment: '屏幕分辨率' },
    deviceLanguage: { type: DataTypes.STRING(10), allowNull: true, comment: '设备语言' },
    timezone: { type: DataTypes.STRING(30), allowNull: true, comment: '时区' },
    userAgent: { type: DataTypes.STRING(500), allowNull: true, comment: '完整UserAgent' },
    fingerprint: { type: DataTypes.STRING(256), allowNull: true, comment: '浏览器指纹(Canvas/WebGL等)' },

    ip: { type: DataTypes.STRING(50), allowNull: false, comment: '登录IP' },
    ipv6: { type: DataTypes.STRING(50), allowNull: true, comment: 'IPv6地址' },
    ipLocation: { type: DataTypes.STRING(200), allowNull: true, comment: 'IP属地: 省/市/运营商' },
    country: { type: DataTypes.STRING(50), allowNull: true },
    region: { type: DataTypes.STRING(50), allowNull: true },
    city: { type: DataTypes.STRING(50), allowNull: true },
    isp: { type: DataTypes.STRING(50), allowNull: true, comment: '运营商' },
    lat: { type: DataTypes.DECIMAL(10, 6), allowNull: true, comment: '纬度' },
    lng: { type: DataTypes.DECIMAL(10, 6), allowNull: true, comment: '经度' },
    isProxy: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否代理IP' },
    isVpn: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否VPN' },
    isTor: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否Tor节点' },
    isDatacenter: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否机房IP' },

    isNewDevice: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否新设备' },
    isNewIp: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否新IP' },
    isAbroad: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否境外登录' },
    isOffsite: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否异地登录(相对常用地)' },
    isMultiDevice: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否多设备同时在线冲突' },
    multiDeviceIds: { type: DataTypes.JSON, defaultValue: [], allowNull: false, comment: '同时在线的其他设备ID' },
    frequencyFlag: {
      type: DataTypes.ENUM('normal', 'high_hour', 'high_day', 'burst'),
      defaultValue: 'normal',
      comment: '频次标记: 正常/小时级高频/日级高频/突发登录'
    },
    scriptDetected: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '脚本登录检测' },
    forgedDetected: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '伪造登录检测' },
    seleniumDetected: { type: DataTypes.BOOLEAN, defaultValue: false, comment: 'Selenium自动化检测' },
    headlessDetected: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '无头浏览器检测' },
    captchaPassed: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否通过验证码' },
    twoFaPassed: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否通过二次验证' },
    twoFaMethod: { type: DataTypes.STRING(30), allowNull: true, comment: '二次验证方式: sms/email/totp' },
    twoFaCodeId: { type: DataTypes.STRING(64), allowNull: true },

    onlineDuration: { type: DataTypes.INTEGER, defaultValue: 0, comment: '本次在线时长(秒)' },
    logoutAt: { type: DataTypes.DATE, allowNull: true, comment: '登出时间' },
    logoutType: {
      type: DataTypes.ENUM('manual', 'expired', 'kicked', 'forced'),
      allowNull: true,
      comment: '登出方式'
    },
    sessionId: { type: DataTypes.STRING(128), allowNull: true, comment: '会话ID' },
    tokenId: { type: DataTypes.STRING(128), allowNull: true, comment: 'Token标识' },
    isMarkedRisk: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否被人工标记为风险' },
    riskMarkedById: { type: DataTypes.INTEGER, allowNull: true },
    riskMarkedByName: { type: DataTypes.STRING(50), allowNull: true },
    riskMarkedAt: { type: DataTypes.DATE, allowNull: true },
    riskMarkedReason: { type: DataTypes.STRING(500), allowNull: true },
    isCleared: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否被清除为正常记录' },
    clearedById: { type: DataTypes.INTEGER, allowNull: true },
    clearedByName: { type: DataTypes.STRING(50), allowNull: true },
    clearedAt: { type: DataTypes.DATE, allowNull: true },
    riskReportId: { type: DataTypes.BIGINT, allowNull: true, comment: '关联风控报告ID' },
    referer: { type: DataTypes.STRING(500), allowNull: true },
    loginEndpoint: { type: DataTypes.STRING(100), allowNull: true }
  },
  { tableName: 'login_logs', comment: '登录日志表', indexes: [
    { fields: ['userId'] }, { fields: ['username'] }, { fields: ['status'] }, { fields: ['riskLevel'] },
    { fields: ['ip'] }, { fields: ['deviceId'] }, { fields: ['createdAt'] }, { fields: ['isMarkedRisk'] }
  ]}
)

LoginLog.STATUSES = ['pending', 'success', 'failed', 'blocked', 'verified', 'risk']
LoginLog.RISK_LEVELS = ['none', 'low', 'medium', 'high', 'critical']

module.exports = LoginLog

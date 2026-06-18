const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const LoginDevice = sequelize.define(
  'LoginDevice',
  {
    id: { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true, comment: '设备ID' },
    userId: { type: DataTypes.INTEGER, allowNull: false, comment: '用户ID' },
    uid: { type: DataTypes.STRING(32), allowNull: false, comment: '用户UID' },
    deviceId: { type: DataTypes.STRING(128), allowNull: false, comment: '设备唯一标识' },
    deviceName: { type: DataTypes.STRING(200), allowNull: true },
    deviceBrand: { type: DataTypes.STRING(100), allowNull: true },
    deviceModel: { type: DataTypes.STRING(100), allowNull: true },
    os: { type: DataTypes.STRING(50), allowNull: true },
    osVersion: { type: DataTypes.STRING(50), allowNull: true },
    browser: { type: DataTypes.STRING(50), allowNull: true },
    browserVersion: { type: DataTypes.STRING(50), allowNull: true },
    fingerprint: { type: DataTypes.STRING(256), allowNull: true },
    screenSize: { type: DataTypes.STRING(20), allowNull: true },

    status: {
      type: DataTypes.ENUM('trusted', 'normal', 'restricted', 'blocked', 'locked'),
      defaultValue: 'normal',
      allowNull: false,
      comment: '设备状态: trusted可信白名单/normal正常/restricted受限登录需验证/blocked拦截/locked永久锁定'
    },
    statusUpdatedAt: { type: DataTypes.DATE, allowNull: true },

    firstLoginAt: { type: DataTypes.DATE, allowNull: false, comment: '首次登录时间' },
    lastLoginAt: { type: DataTypes.DATE, allowNull: false, comment: '最后登录时间' },
    lastLoginIp: { type: DataTypes.STRING(50), allowNull: true },
    lastLoginLocation: { type: DataTypes.STRING(200), allowNull: true },
    totalLoginCount: { type: DataTypes.INTEGER, defaultValue: 1, comment: '累计登录次数' },
    totalSuccessCount: { type: DataTypes.INTEGER, defaultValue: 0, comment: '累计成功次数' },
    totalFailCount: { type: DataTypes.INTEGER, defaultValue: 0, comment: '累计失败次数' },

    isTrusted: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否白名单可信设备' },
    trustedById: { type: DataTypes.INTEGER, allowNull: true },
    trustedByName: { type: DataTypes.STRING(50), allowNull: true },
    trustedAt: { type: DataTypes.DATE, allowNull: true },

    isLocked: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '是否锁定' },
    lockedById: { type: DataTypes.INTEGER, allowNull: true },
    lockedByName: { type: DataTypes.STRING(50), allowNull: true },
    lockedAt: { type: DataTypes.DATE, allowNull: true },
    lockReason: { type: DataTypes.STRING(500), allowNull: true },
    lockExpireAt: { type: DataTypes.DATE, allowNull: true, comment: '锁定到期时间，null为永久' },

    isOnline: { type: DataTypes.BOOLEAN, defaultValue: false, comment: '当前是否在线' },
    lastOnlineAt: { type: DataTypes.DATE, allowNull: true },
    activeIpList: { type: DataTypes.JSON, defaultValue: [], comment: '此设备最近使用IP列表' },

    commonLocation: { type: DataTypes.STRING(200), allowNull: true, comment: '常用登录地' },
    riskCount: { type: DataTypes.INTEGER, defaultValue: 0, comment: '关联风险登录次数' },
    remark: { type: DataTypes.STRING(500), allowNull: true }
  },
  { tableName: 'login_devices', comment: '登录设备管控表', indexes: [
    { unique: true, fields: ['userId', 'deviceId'] },
    { fields: ['userId'] }, { fields: ['status'] }, { fields: ['isLocked'] }, { fields: ['lastLoginAt'] }
  ]}
)

LoginDevice.STATUSES = ['trusted', 'normal', 'restricted', 'blocked', 'locked']

module.exports = LoginDevice

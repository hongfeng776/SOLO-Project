const { sequelize, DataTypes } = require('../config/database');

const PRIVILEGE_TYPE_PERMISSION_MAP = {
  WATCH_PRIVILEGE: { canWatchHD: true, canWatchUHD: true, canWatchExclusive: false, canEarlyAccess: true, canAdFree: false, canOffline: false, canScreenCast: true, canDolby: true },
  AD_FREE: { canWatchHD: false, canWatchUHD: false, canWatchExclusive: false, canEarlyAccess: false, canAdFree: true, canOffline: false, canScreenCast: false, canDolby: false },
  EXCLUSIVE_CONTENT: { canWatchHD: true, canWatchUHD: false, canWatchExclusive: true, canEarlyAccess: false, canAdFree: false, canOffline: false, canScreenCast: false, canDolby: false },
  OFFLINE_DOWNLOAD: { canWatchHD: false, canWatchUHD: false, canWatchExclusive: false, canEarlyAccess: false, canAdFree: false, canOffline: true, canScreenCast: false, canDolby: false },
  COUPON: { canWatchHD: false, canWatchUHD: false, canWatchExclusive: false, canEarlyAccess: false, canAdFree: false, canOffline: false, canScreenCast: false, canDolby: false },
  BADGE: { canWatchHD: false, canWatchUHD: false, canWatchExclusive: false, canEarlyAccess: false, canAdFree: false, canOffline: false, canScreenCast: false, canDolby: false },
  PRIORITY: { canWatchHD: false, canWatchUHD: false, canWatchExclusive: false, canEarlyAccess: false, canAdFree: false, canOffline: false, canScreenCast: false, canDolby: false },
  CUSTOMER_SERVICE: { canWatchHD: false, canWatchUHD: false, canWatchExclusive: false, canEarlyAccess: false, canAdFree: false, canOffline: false, canScreenCast: false, canDolby: false },
  SCREEN_CAST: { canWatchHD: true, canWatchUHD: false, canWatchExclusive: false, canEarlyAccess: false, canAdFree: false, canOffline: false, canScreenCast: true, canDolby: false },
  DOLBY: { canWatchHD: true, canWatchUHD: false, canWatchExclusive: false, canEarlyAccess: false, canAdFree: false, canOffline: false, canScreenCast: false, canDolby: true },
  CUSTOM: {},
};

const generatePrivilegeCode = (type) => {
  const prefix = type ? type.substring(0, 3).toUpperCase() : 'PVL';
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}${ts}${rand}`;
};

const MemberPrivilege = sequelize.define('member_privilege', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  privilegeCode: {
    type: DataTypes.STRING(32),
    field: 'privilege_code',
    allowNull: false,
    unique: true,
    comment: '权益编码，唯一标识',
  },
  privilegeName: {
    type: DataTypes.STRING(80),
    field: 'privilege_name',
    allowNull: false,
    comment: '权益名称',
  },
  privilegeType: {
    type: DataTypes.STRING(32),
    field: 'privilege_type',
    allowNull: false,
    comment: '权益类型: WATCH_PRIVILEGE/AD_FREE/EXCLUSIVE_CONTENT/OFFLINE_DOWNLOAD/COUPON/BADGE/PRIORITY/CUSTOMER_SERVICE/SCREEN_CAST/DOLBY/CUSTOM',
  },
  applicableLevels: {
    type: DataTypes.TEXT,
    field: 'applicable_levels',
    allowNull: false,
    comment: '适配会员等级层级列表(JSON数组)',
    get() {
      const value = this.getDataValue('applicableLevels');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('applicableLevels', JSON.stringify(value || []));
    },
  },
  effectiveStartTime: {
    type: DataTypes.DATE,
    field: 'effective_start_time',
    allowNull: false,
    comment: '生效开始时间',
  },
  effectiveEndTime: {
    type: DataTypes.DATE,
    field: 'effective_end_time',
    allowNull: false,
    comment: '生效结束时间',
  },
  usageLimit: {
    type: DataTypes.INTEGER,
    field: 'usage_limit',
    defaultValue: -1,
    comment: '使用上限(总次数), -1无限',
  },
  dailyLimit: {
    type: DataTypes.INTEGER,
    field: 'daily_limit',
    defaultValue: -1,
    comment: '每日使用上限, -1无限',
  },
  monthlyLimit: {
    type: DataTypes.INTEGER,
    field: 'monthly_limit',
    defaultValue: -1,
    comment: '每月使用上限, -1无限',
  },
  permissionSwitches: {
    type: DataTypes.TEXT,
    field: 'permission_switches',
    allowNull: true,
    comment: '权限开关配置(JSON,根据权益类型联动匹配)',
    get() {
      const value = this.getDataValue('permissionSwitches');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('permissionSwitches', value ? JSON.stringify(value) : null);
    },
  },
  usageRules: {
    type: DataTypes.TEXT,
    field: 'usage_rules',
    allowNull: true,
    comment: '使用规则(JSON)',
    get() {
      const value = this.getDataValue('usageRules');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('usageRules', value ? JSON.stringify(value) : null);
    },
  },
  status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态 1:生效 2:暂停 3:下线',
  },
  scopeType: {
    type: DataTypes.STRING(16),
    field: 'scope_type',
    defaultValue: 'ALL',
    comment: '生效范围 ALL:全量用户 NEW_USER:仅新用户',
  },
  configBatch: {
    type: DataTypes.STRING(64),
    field: 'config_batch',
    allowNull: true,
    comment: '配置批次号',
  },
  sortOrder: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'sort_order',
    defaultValue: 0,
    comment: '排序号',
  },
  description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '权益描述',
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注',
  },
  version: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 1,
    comment: '版本号(乐观锁)',
  },
  createdBy: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'created_by',
    allowNull: true,
    comment: '创建人ID',
  },
  createdByName: {
    type: DataTypes.STRING(50),
    field: 'created_by_name',
    allowNull: true,
    comment: '创建人姓名',
  },
  updatedBy: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'updated_by',
    allowNull: true,
    comment: '更新人ID',
  },
  updatedByName: {
    type: DataTypes.STRING(50),
    field: 'updated_by_name',
    allowNull: true,
    comment: '更新人姓名',
  },
}, {
  tableName: 'biz_member_privilege',
  comment: '会员权益配置表',
  indexes: [
    { name: 'idx_privilege_code', unique: true, fields: ['privilege_code'] },
    { name: 'idx_privilege_type', fields: ['privilege_type'] },
    { name: 'idx_status', fields: ['status'] },
    { name: 'idx_config_batch', fields: ['config_batch'] },
    { name: 'idx_effective_time', fields: ['effective_start_time', 'effective_end_time'] },
    { name: 'idx_scope_type', fields: ['scope_type'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
});

const MemberPrivilegeLog = sequelize.define('member_privilege_log', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  privilegeId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'privilege_id',
    allowNull: false,
    comment: '关联权益ID',
  },
  privilegeCode: {
    type: DataTypes.STRING(32),
    field: 'privilege_code',
    allowNull: false,
    comment: '权益编码',
  },
  modifyType: {
    type: DataTypes.STRING(32),
    field: 'modify_type',
    allowNull: false,
    comment: '变更类型: CREATE/EDIT/STATUS_ACTIVATE/STATUS_PAUSE/STATUS_OFFLINE/BATCH_ONLINE/BATCH_PAUSE/BATCH_LIMIT_CHANGE',
  },
  modifyTypeLabel: {
    type: DataTypes.STRING(32),
    field: 'modify_type_label',
    allowNull: true,
    comment: '变更类型中文标签',
  },
  configBatch: {
    type: DataTypes.STRING(64),
    field: 'config_batch',
    allowNull: true,
    comment: '配置批次号',
  },
  beforeSnapshot: {
    type: DataTypes.TEXT,
    field: 'before_snapshot',
    allowNull: true,
    comment: '变更前快照(JSON)',
    get() {
      const value = this.getDataValue('beforeSnapshot');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('beforeSnapshot', value ? JSON.stringify(value) : null);
    },
  },
  afterSnapshot: {
    type: DataTypes.TEXT,
    field: 'after_snapshot',
    allowNull: true,
    comment: '变更后快照(JSON)',
    get() {
      const value = this.getDataValue('afterSnapshot');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('afterSnapshot', value ? JSON.stringify(value) : null);
    },
  },
  changedFields: {
    type: DataTypes.TEXT,
    field: 'changed_fields',
    allowNull: true,
    comment: '变更字段列表(JSON数组)',
    get() {
      const value = this.getDataValue('changedFields');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('changedFields', JSON.stringify(value || []));
    },
  },
  affectUserCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'affect_user_count',
    defaultValue: 0,
    comment: '受影响用户数',
  },
  operatorId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'operator_id',
    allowNull: true,
    comment: '操作人ID',
  },
  operatorName: {
    type: DataTypes.STRING(50),
    field: 'operator_name',
    allowNull: true,
    comment: '操作人姓名',
  },
  operatorRemark: {
    type: DataTypes.STRING(500),
    field: 'operator_remark',
    allowNull: true,
    comment: '操作备注',
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    field: 'ip_address',
    allowNull: true,
    comment: '操作IP',
  },
}, {
  tableName: 'biz_member_privilege_log',
  comment: '会员权益配置变更日志表',
  indexes: [
    { name: 'idx_privilege_id', fields: ['privilege_id'] },
    { name: 'idx_privilege_code', fields: ['privilege_code'] },
    { name: 'idx_config_batch', fields: ['config_batch'] },
    { name: 'idx_modify_type', fields: ['modify_type'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
});

const MemberPrivilegeRedemption = sequelize.define('member_privilege_redemption', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  privilegeId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'privilege_id',
    allowNull: false,
    comment: '关联权益ID',
  },
  privilegeCode: {
    type: DataTypes.STRING(32),
    field: 'privilege_code',
    allowNull: false,
    comment: '权益编码',
  },
  privilegeName: {
    type: DataTypes.STRING(80),
    field: 'privilege_name',
    allowNull: true,
    comment: '权益名称(冗余)',
  },
  privilegeType: {
    type: DataTypes.STRING(32),
    field: 'privilege_type',
    allowNull: true,
    comment: '权益类型(冗余)',
  },
  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'user_id',
    allowNull: false,
    comment: '用户ID',
  },
  uid: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '用户UID',
  },
  memberLevelTier: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'member_level_tier',
    allowNull: true,
    comment: '用户当时等级层级',
  },
  redemptionType: {
    type: DataTypes.STRING(32),
    field: 'redemption_type',
    allowNull: false,
    comment: '核销类型: USE使用/GRANT授予/REVOKE撤销/EXPIRE过期',
  },
  redemptionCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'redemption_count',
    defaultValue: 1,
    comment: '核销数量',
  },
  redemptionBatch: {
    type: DataTypes.STRING(64),
    field: 'redemption_batch',
    allowNull: true,
    comment: '核销批次号',
  },
  configBatch: {
    type: DataTypes.STRING(64),
    field: 'config_batch',
    allowNull: true,
    comment: '关联配置批次号',
  },
  operatorId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'operator_id',
    allowNull: true,
    comment: '操作人ID(授予/撤销时)',
  },
  operatorName: {
    type: DataTypes.STRING(50),
    field: 'operator_name',
    allowNull: true,
    comment: '操作人姓名',
  },
  extraData: {
    type: DataTypes.TEXT,
    field: 'extra_data',
    allowNull: true,
    comment: '扩展数据(JSON)',
    get() {
      const value = this.getDataValue('extraData');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('extraData', value ? JSON.stringify(value) : null);
    },
  },
}, {
  tableName: 'biz_member_privilege_redemption',
  comment: '会员权益核销记录表',
  indexes: [
    { name: 'idx_privilege_id', fields: ['privilege_id'] },
    { name: 'idx_privilege_code', fields: ['privilege_code'] },
    { name: 'idx_user_id', fields: ['user_id'] },
    { name: 'idx_uid', fields: ['uid'] },
    { name: 'idx_redemption_type', fields: ['redemption_type'] },
    { name: 'idx_redemption_batch', fields: ['redemption_batch'] },
    { name: 'idx_config_batch', fields: ['config_batch'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
});

MemberPrivilege.hasMany(MemberPrivilegeLog, { foreignKey: 'privilege_id', as: 'modifyLogs' });
MemberPrivilegeLog.belongsTo(MemberPrivilege, { foreignKey: 'privilege_id', as: 'privilege' });

MemberPrivilege.hasMany(MemberPrivilegeRedemption, { foreignKey: 'privilege_id', as: 'redemptions' });
MemberPrivilegeRedemption.belongsTo(MemberPrivilege, { foreignKey: 'privilege_id', as: 'privilege' });

module.exports = {
  MemberPrivilege,
  MemberPrivilegeLog,
  MemberPrivilegeRedemption,
  PRIVILEGE_TYPE_PERMISSION_MAP,
  generatePrivilegeCode,
};

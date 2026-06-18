const { sequelize, DataTypes } = require('../config/database');

const EndUser = sequelize.define('end_user', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  uid: {
    type: DataTypes.STRING(32),
    allowNull: false,
    unique: true,
    comment: '用户UID，对外展示',
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名/登录账号',
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '昵称',
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码',
  },
  realName: {
    type: DataTypes.STRING(50),
    field: 'real_name',
    allowNull: true,
    comment: '真实姓名',
  },
  idCardNo: {
    type: DataTypes.STRING(32),
    field: 'id_card_no',
    allowNull: true,
    comment: '身份证号',
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '头像URL',
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '邮箱',
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '手机号',
  },
  gender: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '性别 0:未知 1:男 2:女',
  },
  birthday: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '生日',
  },
  region: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '所在地区',
  },
  signature: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '个性签名',
  },
  userType: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'user_type',
    defaultValue: 1,
    comment: '账号类型 1:普通用户 2:创作者 3:会员用户',
  },
  creatorLevel: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'creator_level',
    defaultValue: 0,
    comment: '创作者等级 0:普通 1:初级 2:中级 3:高级 4:头部',
  },
  memberLevel: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'member_level',
    defaultValue: 0,
    comment: '会员等级 0:非会员 1:VIP 2:SVIP 3:年度VIP 4:终身会员',
  },
  accountStatus: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'account_status',
    defaultValue: 1,
    comment: '账号状态 1:正常 2:限流 3:禁言 4:临时封禁 5:永久封禁',
  },
  isVerified: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'is_verified',
    defaultValue: 0,
    comment: '是否实名认证 0:否 1:是',
  },
  banReason: {
    type: DataTypes.STRING(500),
    field: 'ban_reason',
    allowNull: true,
    comment: '封禁/限流原因',
  },
  banStartTime: {
    type: DataTypes.DATE,
    field: 'ban_start_time',
    allowNull: true,
    comment: '封禁开始时间',
  },
  banEndTime: {
    type: DataTypes.DATE,
    field: 'ban_end_time',
    allowNull: true,
    comment: '封禁结束时间(临时封禁)',
  },
  flowLimitLevel: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'flow_limit_level',
    defaultValue: 0,
    comment: '限流等级 0:无限流 1:轻度 2:中度 3:重度',
  },
  muteEndTime: {
    type: DataTypes.DATE,
    field: 'mute_end_time',
    allowNull: true,
    comment: '禁言结束时间',
  },
  violationCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'violation_count',
    defaultValue: 0,
    comment: '违规次数',
  },
  activityScore: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'activity_score',
    defaultValue: 0,
    comment: '活跃度积分',
  },
  activityLevel: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'activity_level',
    defaultValue: 0,
    comment: '活跃度等级 0:沉睡 1:低 2:中 3:高 4:活跃',
  },
  registerSource: {
    type: DataTypes.STRING(32),
    field: 'register_source',
    allowNull: true,
    comment: '注册来源',
  },
  registerIp: {
    type: DataTypes.STRING(50),
    field: 'register_ip',
    allowNull: true,
    comment: '注册IP',
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    field: 'last_login_at',
    allowNull: true,
    comment: '最后登录时间',
  },
  lastLoginIp: {
    type: DataTypes.STRING(50),
    field: 'last_login_ip',
    allowNull: true,
    comment: '最后登录IP',
  },
  loginCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'login_count',
    defaultValue: 0,
    comment: '登录次数',
  },
  watchCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'watch_count',
    defaultValue: 0,
    comment: '观看次数',
  },
  publishCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'publish_count',
    defaultValue: 0,
    comment: '投稿次数',
  },
  commentCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'comment_count',
    defaultValue: 0,
    comment: '评论次数',
  },
  followerCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'follower_count',
    defaultValue: 0,
    comment: '粉丝数',
  },
  followingCount: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'following_count',
    defaultValue: 0,
    comment: '关注数',
  },
  userTags: {
    type: DataTypes.TEXT,
    field: 'user_tags',
    allowNull: true,
    comment: '用户标签(JSON数组)',
    get() {
      const value = this.getDataValue('userTags');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('userTags', JSON.stringify(value || []));
    },
  },
  riskTags: {
    type: DataTypes.TEXT,
    field: 'risk_tags',
    allowNull: true,
    comment: '风险标签(JSON数组)',
    get() {
      const value = this.getDataValue('riskTags');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('riskTags', JSON.stringify(value || []));
    },
  },
  operationBatch: {
    type: DataTypes.STRING(64),
    field: 'operation_batch',
    allowNull: true,
    comment: '最后一次批量操作批次号',
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '运营备注',
  },
  createdBy: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'created_by',
    allowNull: true,
    comment: '创建人ID(后台)',
  },
  updatedBy: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'updated_by',
    allowNull: true,
    comment: '更新人ID(后台)',
  },
}, {
  tableName: 'end_user',
  comment: '平台终端用户表',
  indexes: [
    { name: 'idx_uid', unique: true, fields: ['uid'] },
    { name: 'idx_username', unique: true, fields: ['username'] },
    { name: 'idx_account_status', fields: ['account_status'] },
    { name: 'idx_user_type', fields: ['user_type'] },
    { name: 'idx_activity_level', fields: ['activity_level'] },
    { name: 'idx_violation_count', fields: ['violation_count'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
});

const AccountStatusLog = sequelize.define('account_status_log', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
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
  fromStatus: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'from_status',
    defaultValue: 0,
    comment: '变更前状态',
  },
  toStatus: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'to_status',
    allowNull: false,
    comment: '变更后状态',
  },
  changeReason: {
    type: DataTypes.STRING(500),
    field: 'change_reason',
    allowNull: true,
    comment: '变更原因',
  },
  changeRemark: {
    type: DataTypes.STRING(500),
    field: 'change_remark',
    allowNull: true,
    comment: '变更备注',
  },
  durationDays: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'duration_days',
    allowNull: true,
    comment: '持续天数(临时封禁/禁言)',
  },
  flowLimitLevel: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'flow_limit_level',
    defaultValue: 0,
    comment: '限流等级',
  },
  operationType: {
    type: DataTypes.STRING(32),
    field: 'operation_type',
    allowNull: false,
    comment: '操作类型 MANUAL:手动 BATCH:批量 SYSTEM:系统',
  },
  operationBatch: {
    type: DataTypes.STRING(64),
    field: 'operation_batch',
    allowNull: true,
    comment: '操作批次号',
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
  affectedPermissions: {
    type: DataTypes.TEXT,
    field: 'affected_permissions',
    allowNull: true,
    comment: '受影响权限(JSON)',
    get() {
      const value = this.getDataValue('affectedPermissions');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('affectedPermissions', value ? JSON.stringify(value) : null);
    },
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
  ipAddress: {
    type: DataTypes.STRING(50),
    field: 'ip_address',
    allowNull: true,
    comment: '操作IP',
  },
  isReverted: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'is_reverted',
    defaultValue: 0,
    comment: '是否已撤销 0:否 1:是',
  },
  revertedAt: {
    type: DataTypes.DATE,
    field: 'reverted_at',
    allowNull: true,
    comment: '撤销时间',
  },
  revertLogId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'revert_log_id',
    allowNull: true,
    comment: '撤销对应的日志ID',
  },
}, {
  tableName: 'account_status_log',
  comment: '账号状态变更日志表',
  indexes: [
    { name: 'idx_user_id', fields: ['user_id'] },
    { name: 'idx_uid', fields: ['uid'] },
    { name: 'idx_operation_batch', fields: ['operation_batch'] },
    { name: 'idx_operator_id', fields: ['operator_id'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
});

EndUser.hasMany(AccountStatusLog, { foreignKey: 'user_id', as: 'statusLogs' });
AccountStatusLog.belongsTo(EndUser, { foreignKey: 'user_id', as: 'user' });

module.exports = { EndUser, AccountStatusLog };

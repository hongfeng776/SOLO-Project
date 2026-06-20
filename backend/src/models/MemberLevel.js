const { sequelize, DataTypes } = require('../config/database');
const { EndUser } = require('./EndUser');

const MemberLevel = sequelize.define('member_level', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  levelCode: {
    type: DataTypes.STRING(32),
    field: 'level_code',
    allowNull: false,
    unique: true,
    comment: '等级编码，唯一标识',
  },
  levelName: {
    type: DataTypes.STRING(50),
    field: 'level_name',
    allowNull: false,
    comment: '等级名称',
  },
  levelTier: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'level_tier',
    allowNull: false,
    unique: true,
    comment: '等级层级(1~N)，数字越大等级越高',
  },
  minScore: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'min_score',
    allowNull: false,
    defaultValue: 0,
    comment: '升级最低分值(含)',
  },
  maxScore: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'max_score',
    allowNull: false,
    defaultValue: 0,
    comment: '升级最高分值(不含，下一级起始)',
  },
  iconUrl: {
    type: DataTypes.STRING(500),
    field: 'icon_url',
    allowNull: true,
    comment: '等级图标URL',
  },
  badgeColor: {
    type: DataTypes.STRING(16),
    field: 'badge_color',
    allowNull: true,
    comment: '徽章主色(HEX)',
  },
  cardBgColor: {
    type: DataTypes.STRING(16),
    field: 'card_bg_color',
    allowNull: true,
    comment: '卡片背景色(HEX)',
  },
  privileges: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '专属权益列表(JSON数组)',
    get() {
      const value = this.getDataValue('privileges');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('privileges', JSON.stringify(value || []));
    },
  },
  upgradeConditions: {
    type: DataTypes.TEXT,
    field: 'upgrade_conditions',
    allowNull: true,
    comment: '升级条件配置(JSON)',
    get() {
      const value = this.getDataValue('upgradeConditions');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('upgradeConditions', value ? JSON.stringify(value) : null);
    },
  },
  configBatch: {
    type: DataTypes.STRING(64),
    field: 'config_batch',
    allowNull: true,
    comment: '配置批次号',
  },
  isEnabled: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'is_enabled',
    defaultValue: 1,
    comment: '是否启用 0:停用 1:启用',
  },
  isCoreHighest: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'is_core_highest',
    defaultValue: 0,
    comment: '是否核心最高等级 0:否 1:是(禁止随意修改停用)',
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
    comment: '等级描述',
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
  tableName: 'biz_member_level',
  comment: '会员等级配置表',
  indexes: [
    { name: 'idx_level_code', unique: true, fields: ['level_code'] },
    { name: 'idx_level_tier', unique: true, fields: ['level_tier'] },
    { name: 'idx_is_enabled', fields: ['is_enabled'] },
    { name: 'idx_config_batch', fields: ['config_batch'] },
    { name: 'idx_score_range', fields: ['min_score', 'max_score'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
});

const MemberLevelLog = sequelize.define('member_level_log', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  levelId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'level_id',
    allowNull: false,
    comment: '关联等级ID',
  },
  levelCode: {
    type: DataTypes.STRING(32),
    field: 'level_code',
    allowNull: false,
    comment: '等级编码',
  },
  modifyType: {
    type: DataTypes.STRING(32),
    field: 'modify_type',
    allowNull: false,
    comment: '变更类型: CREATE/EDIT/ENABLE/DISABLE/SCORE_ADJUST/BATCH_SYNC',
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
  needRecalc: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'need_recalc',
    defaultValue: 0,
    comment: '是否需要用户等级重算 0:否 1:是',
  },
  recalcStatus: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'recalc_status',
    defaultValue: 0,
    comment: '重算状态 0:无需 1:待执行 2:执行中 3:完成 4:失败',
  },
  recalcStartTime: {
    type: DataTypes.DATE,
    field: 'recalc_start_time',
    allowNull: true,
    comment: '重算开始时间',
  },
  recalcEndTime: {
    type: DataTypes.DATE,
    field: 'recalc_end_time',
    allowNull: true,
    comment: '重算结束时间',
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
    comment: '操作人备注',
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    field: 'ip_address',
    allowNull: true,
    comment: '操作IP',
  },
}, {
  tableName: 'biz_member_level_log',
  comment: '会员等级配置变更日志表',
  indexes: [
    { name: 'idx_level_id', fields: ['level_id'] },
    { name: 'idx_level_code', fields: ['level_code'] },
    { name: 'idx_config_batch', fields: ['config_batch'] },
    { name: 'idx_modify_type', fields: ['modify_type'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
});

const MemberLevelUpgradeRecord = sequelize.define('member_level_upgrade_record', {
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
  fromLevelId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'from_level_id',
    allowNull: true,
    comment: '升级前等级ID',
  },
  fromLevelTier: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'from_level_tier',
    allowNull: true,
    comment: '升级前等级层级',
  },
  fromLevelCode: {
    type: DataTypes.STRING(32),
    field: 'from_level_code',
    allowNull: true,
    comment: '升级前等级编码',
  },
  toLevelId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'to_level_id',
    allowNull: false,
    comment: '升级后等级ID',
  },
  toLevelTier: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'to_level_tier',
    allowNull: false,
    comment: '升级后等级层级',
  },
  toLevelCode: {
    type: DataTypes.STRING(32),
    field: 'to_level_code',
    allowNull: false,
    comment: '升级后等级编码',
  },
  triggerScore: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'trigger_score',
    defaultValue: 0,
    comment: '触发升级时的积分值',
  },
  upgradeReason: {
    type: DataTypes.STRING(200),
    field: 'upgrade_reason',
    allowNull: true,
    comment: '升级原因',
  },
  upgradeType: {
    type: DataTypes.STRING(32),
    field: 'upgrade_type',
    defaultValue: 'AUTO',
    comment: '升级方式: AUTO自动/MANUAL手动/BATCH批量/SCORE_ADJUST分值调整触发',
  },
  configBatch: {
    type: DataTypes.STRING(64),
    field: 'config_batch',
    allowNull: true,
    comment: '关联配置批次号',
  },
  operationBatch: {
    type: DataTypes.STRING(64),
    field: 'operation_batch',
    allowNull: true,
    comment: '操作批次号',
  },
  isReverted: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'is_reverted',
    defaultValue: 0,
    comment: '是否已撤销 0:否 1:是',
  },
  operatorId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'operator_id',
    allowNull: true,
    comment: '操作人ID(手动升级时)',
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
  tableName: 'biz_member_level_upgrade_record',
  comment: '会员升级记录表',
  indexes: [
    { name: 'idx_user_id', fields: ['user_id'] },
    { name: 'idx_uid', fields: ['uid'] },
    { name: 'idx_from_level_tier', fields: ['from_level_tier'] },
    { name: 'idx_to_level_tier', fields: ['to_level_tier'] },
    { name: 'idx_config_batch', fields: ['config_batch'] },
    { name: 'idx_operation_batch', fields: ['operation_batch'] },
    { name: 'idx_upgrade_type', fields: ['upgrade_type'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
});

MemberLevel.hasMany(MemberLevelLog, { foreignKey: 'level_id', as: 'modifyLogs' });
MemberLevelLog.belongsTo(MemberLevel, { foreignKey: 'level_id', as: 'memberLevel' });

MemberLevelUpgradeRecord.belongsTo(MemberLevel, { foreignKey: 'from_level_id', as: 'fromLevel' });
MemberLevelUpgradeRecord.belongsTo(MemberLevel, { foreignKey: 'to_level_id', as: 'toLevel' });
MemberLevelUpgradeRecord.belongsTo(EndUser, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  MemberLevel,
  MemberLevelLog,
  MemberLevelUpgradeRecord,
};

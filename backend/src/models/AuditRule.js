const { sequelize, DataTypes } = require('../config/database');

const AuditRule = sequelize.define('audit_rule', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  rule_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '规则编码',
  },
  rule_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '规则名称',
  },
  rule_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '规则类型 content/comment/image/video/user/keyword/score',
  },
  rule_category: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: '规则分类 sensitive/fake/quality/risk/compliance',
  },
  rule_description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '规则描述',
  },
  applicable_category: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '适用品类(JSON数组)',
    get() {
      const value = this.getDataValue('applicable_category');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('applicable_category', value ? JSON.stringify(value || []) : '[]');
    },
  },
  applicable_risk_levels: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '适用风险等级(JSON数组)',
    get() {
      const value = this.getDataValue('applicable_risk_levels');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('applicable_risk_levels', value ? JSON.stringify(value || []) : '[]');
    },
  },
  effective_start_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '生效开始时间',
  },
  effective_end_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '生效结束时间',
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
    comment: '优先级 0-100',
  },
  rule_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '规则状态 0:草稿 1:已启用 2:已停用 3:已过期 4:待审核',
  },
  is_core_default: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否核心默认规则 0:否 1:是',
  },
  is_system_default: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否系统默认规则 0:否 1:是',
  },
  version: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 1,
    comment: '版本号',
  },
  effect_batch: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '生效批次号',
  },
  trigger_conditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '触发条件(JSON)',
    get() {
      const value = this.getDataValue('trigger_conditions');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('trigger_conditions', value ? JSON.stringify(value) : null);
    },
  },
  actions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '执行动作(JSON)',
    get() {
      const value = this.getDataValue('actions');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('actions', value ? JSON.stringify(value) : null);
    },
  },
  rule_params: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '规则参数(JSON)',
    get() {
      const value = this.getDataValue('rule_params');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('rule_params', value ? JSON.stringify(value) : null);
    },
  },
  sort_order: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序',
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注',
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '创建人ID',
  },
  created_by_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '创建人姓名',
  },
  updated_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '更新人ID',
  },
  updated_by_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '更新人姓名',
  },
  published_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '发布时间',
  },
  last_enabled_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后启用时间',
  },
}, {
  tableName: 'biz_audit_rule',
  comment: '审核规则表',
  indexes: [
    { fields: ['rule_type', 'rule_status'] },
    { fields: ['rule_code'], unique: true },
    { fields: ['rule_name'] },
    { fields: ['rule_category'] },
    { fields: ['priority'] },
    { fields: ['rule_status'] },
    { fields: ['is_core_default'] },
    { fields: ['effective_start_time'] },
    { fields: ['effective_end_time'] },
    { fields: ['created_at'] },
  ],
});

module.exports = { AuditRule };

const { sequelize, DataTypes } = require('../config/database');

const AuditRuleModifyLog = sequelize.define('audit_rule_modify_log', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
    comment: '主键ID',
  },
  rule_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '规则ID',
  },
  rule_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '规则编码',
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
  modify_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '修改类型 create/update/enable/disable/delete/publish/rollback',
  },
  modify_type_label: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '修改类型标签',
  },
  modifier_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '修改人ID',
  },
  modifier_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '修改人姓名',
  },
  modify_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '修改时间',
  },
  change_summary: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '变更摘要',
  },
  before_snapshot: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '修改前快照(JSON)',
    get() {
      const value = this.getDataValue('before_snapshot');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('before_snapshot', value ? JSON.stringify(value) : null);
    },
  },
  after_snapshot: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '修改后快照(JSON)',
    get() {
      const value = this.getDataValue('after_snapshot');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('after_snapshot', value ? JSON.stringify(value) : null);
    },
  },
  changed_fields: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '变更字段列表(JSON数组)',
    get() {
      const value = this.getDataValue('changed_fields');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('changed_fields', value ? JSON.stringify(value || []) : '[]');
    },
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注',
  },
}, {
  tableName: 'biz_audit_rule_modify_log',
  comment: '审核规则修改日志表',
  indexes: [
    { fields: ['rule_id'] },
    { fields: ['rule_code'] },
    { fields: ['modify_type'] },
    { fields: ['modifier_id'] },
    { fields: ['modify_time'] },
    { fields: ['version'] },
  ],
});

module.exports = { AuditRuleModifyLog };

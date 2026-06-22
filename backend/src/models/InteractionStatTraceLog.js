const { sequelize, DataTypes } = require('../config/database');

const InteractionStatTraceLog = sequelize.define('interaction_stat_trace_log', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '内容ID',
  },
  stat_batch: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '统计批次号',
  },
  stat_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: '统计日期',
  },
  trace_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '溯源类型:DUPLICATE_STAT/ABNORMAL_FLUCTUATION/INCONSISTENT_DATA/FAKE_INTERACTION',
  },
  trace_desc: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '溯源描述',
  },
  before_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const v = this.getDataValue('before_data');
      return v ? JSON.parse(v) : null;
    },
    set(v) {
      this.setDataValue('before_data', v ? JSON.stringify(v) : null);
    },
  },
  after_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const v = this.getDataValue('after_data');
      return v ? JSON.parse(v) : null;
    },
    set(v) {
      this.setDataValue('after_data', v ? JSON.stringify(v) : null);
    },
  },
  operator_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
  },
  operator_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  severity: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '严重级别 1:低 2:中 3:高',
  },
  resolved: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否已处理 1:是 0:否',
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
  },
}, {
  tableName: 'biz_interaction_stat_trace_log',
  comment: '互动数据溯源日志表',
  indexes: [
    { fields: ['content_id'] },
    { fields: ['stat_batch'] },
    { fields: ['stat_date'] },
    { fields: ['trace_type'] },
    { fields: ['severity'] },
    { fields: ['created_at'] },
  ],
});

module.exports = { InteractionStatTraceLog };

const { sequelize, DataTypes } = require('../config/database');

const DanmakuManageLog = sequelize.define('danmaku_manage_log', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  danmaku_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '弹幕ID',
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '关联视频内容ID',
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '弹幕用户ID',
  },
  operation_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '操作类型:APPROVE/TEMP_BLOCK/PERMA_BAN/UNBLOCK/DELETE/BATCH_APPROVE/BATCH_BLOCK/BATCH_CLEAN/BATCH_ARCHIVE',
  },
  operation_desc: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '操作描述',
  },
  before_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '操作前数据(JSON)',
    get() {
      const value = this.getDataValue('before_data');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('before_data', value ? JSON.stringify(value) : null);
    },
  },
  after_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '操作后数据(JSON)',
    get() {
      const value = this.getDataValue('after_data');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('after_data', value ? JSON.stringify(value) : null);
    },
  },
  operator_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '操作人ID',
  },
  operator_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人姓名',
  },
  operation_batch: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '批量操作批次号',
  },
  is_hot_video: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否热门视频弹幕操作 1:是 0:否',
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作IP地址',
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '操作备注',
  },
}, {
  tableName: 'biz_danmaku_manage_log',
  comment: '弹幕管控操作日志表',
  indexes: [
    { fields: ['danmaku_id'] },
    { fields: ['content_id'] },
    { fields: ['user_id'] },
    { fields: ['operation_type'] },
    { fields: ['operator_id'] },
    { fields: ['operation_batch'] },
    { fields: ['created_at'] },
  ],
});

module.exports = { DanmakuManageLog };

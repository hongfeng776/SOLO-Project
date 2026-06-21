const { sequelize, DataTypes } = require('../config/database');

const CommentManageLog = sequelize.define('comment_manage_log', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  comment_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '评论ID',
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '关联内容ID',
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '评论用户ID',
  },
  operation_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '操作类型:PIN/CANCEL_PIN/ESSENCE/CANCEL_ESSENCE/BLOCK/DELETE/BATCH_PIN/BATCH_BLOCK/BATCH_DELETE/BATCH_CLEAN',
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
  is_hot_comment: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否热门评论操作 1:是 0:否',
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
  tableName: 'biz_comment_manage_log',
  comment: '评论管控操作日志表',
  indexes: [
    { fields: ['comment_id'] },
    { fields: ['content_id'] },
    { fields: ['user_id'] },
    { fields: ['operation_type'] },
    { fields: ['operator_id'] },
    { fields: ['operation_batch'] },
    { fields: ['created_at'] },
  ],
});

module.exports = { CommentManageLog };

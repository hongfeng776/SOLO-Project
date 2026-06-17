const { sequelize, DataTypes } = require('../config/database');
const { Content } = require('./Content');

const ArticleVersion = sequelize.define('article_version', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '内容ID',
  },
  version_no: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '版本号',
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '标题',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '正文内容',
  },
  cover_images: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '封面图列表(JSON)',
    get() {
      const value = this.getDataValue('cover_images');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('cover_images', value ? JSON.stringify(value || []) : null);
    },
  },
  summary: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '摘要',
  },
  word_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '字数',
  },
  layout_template: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '排版模板',
  },
  edit_mode: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '编辑模式 0:全覆盖 1:增量',
  },
  publish_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '发布状态 0:草稿 1:审核中 2:已发布 3:已下线',
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
  change_log: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '变更说明(JSON数组)',
    get() {
      const value = this.getDataValue('change_log');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('change_log', value ? JSON.stringify(value || []) : null);
    },
  },
  audit_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '审核状态',
  },
  audit_remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '审核备注',
  },
  audit_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间',
  },
  auditor_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '审核人ID',
  },
  auditor_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '审核人姓名',
  },
}, {
  tableName: 'biz_article_version',
  comment: '图文版本记录表',
  indexes: [
    { fields: ['content_id'] },
    { fields: ['version_no'] },
    { fields: ['publish_status'] },
    { fields: ['created_at'] },
  ],
});

ArticleVersion.belongsTo(Content, { foreignKey: 'content_id', as: 'content' });

module.exports = { ArticleVersion };

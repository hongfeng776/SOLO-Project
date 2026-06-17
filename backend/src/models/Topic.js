const { sequelize, DataTypes } = require('../config/database');
const { User } = require('./User');

const Topic = sequelize.define('topic', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  topic_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '专题唯一编码 TOP+时间戳+随机数',
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '专题标题',
  },
  subtitle: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '副标题',
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '专题描述',
  },
  topic_type: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '专题类型 0:节日专题 1:热点专题 2:品类专题 3:人物专题 4:活动专题',
  },
  cover_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图',
  },
  cover_template: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '封面模板 festival-default/hot-style/category-banner/people-feature/activity-special',
  },
  banner_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Banner图',
  },
  icon_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '图标',
  },
  background_color: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '背景色',
  },
  sort_rule: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '排序规则 0:MANUAL手动 1:按热度 2:按时间 3:按权重 4:按推荐',
  },
  weight_score: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '权重分值 0-100',
  },
  hot_score: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '热度评分',
  },
  content_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '内容总数',
  },
  resource_link: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '专题访问链接',
  },
  status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '状态 0:草稿 1:未上线 2:已上线 3:已下线 4:已过期',
  },
  is_core: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否核心专题 1:是 0:否',
  },
  operation_batch: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '运营批次号',
  },
  operation_start_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '运营开始时间',
  },
  operation_end_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '运营结束时间',
  },
  creator_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '创建人ID',
  },
  creator_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '创建人姓名',
  },
  operator_ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作IP',
  },
  status_logs: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '状态变更日志(JSON数组)',
    get() {
      const value = this.getDataValue('status_logs');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('status_logs', value ? JSON.stringify(value || []) : null);
    },
  },
  traffic_stats: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '流量统计数据(JSON)',
    get() {
      const value = this.getDataValue('traffic_stats');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('traffic_stats', value ? JSON.stringify(value) : null);
    },
  },
  tags: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '标签(逗号分隔)',
    get() {
      const value = this.getDataValue('tags');
      return value ? value.split(',').filter(Boolean) : [];
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('tags', value.join(','));
      } else if (typeof value === 'string') {
        this.setDataValue('tags', value);
      } else {
        this.setDataValue('tags', '');
      }
    },
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
  updated_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '更新人ID',
  },
}, {
  tableName: 'biz_topic',
  comment: '内容专题表',
  indexes: [
    { fields: ['topic_code'], unique: true },
    { fields: ['title'] },
    { fields: ['topic_type'] },
    { fields: ['status'] },
    { fields: ['is_core'] },
    { fields: ['weight_score'] },
    { fields: ['hot_score'] },
    { fields: ['operation_batch'] },
    { fields: ['creator_id'] },
    { fields: ['operation_start_time'] },
    { fields: ['operation_end_time'] },
    { fields: ['topic_type', 'title'] },
  ],
});

Topic.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = { Topic };

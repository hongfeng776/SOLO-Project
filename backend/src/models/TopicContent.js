const { sequelize, DataTypes } = require('../config/database');
const { Topic } = require('./Topic');
const { Content } = require('./Content');

const TopicContent = sequelize.define('topic_content', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  topic_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '专题ID',
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '内容ID',
  },
  sort_order: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序',
  },
  weight_score: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '权重分值 0-100',
  },
  is_recommended: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否推荐 1:是 0:否',
  },
  mount_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '挂载时间',
  },
  operator_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '操作人ID',
  },
  operator_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '操作人姓名',
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
  tableName: 'biz_topic_content',
  comment: '专题内容关联表',
  indexes: [
    { fields: ['topic_id'] },
    { fields: ['content_id'] },
    { fields: ['topic_id', 'content_id'], unique: true },
    { fields: ['sort_order'] },
    { fields: ['is_recommended'] },
  ],
});

TopicContent.belongsTo(Topic, { foreignKey: 'topic_id', as: 'topic' });
TopicContent.belongsTo(Content, { foreignKey: 'content_id', as: 'content' });
Topic.hasMany(TopicContent, { foreignKey: 'topic_id', as: 'topicContents' });
Content.hasMany(TopicContent, { foreignKey: 'content_id', as: 'topicContents' });

module.exports = { TopicContent };

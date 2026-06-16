const { sequelize, DataTypes } = require('../config/database');
const { User } = require('./User');
const { Content } = require('./Content');

const Comment = sequelize.define('comment', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '关联内容ID',
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '评论用户ID',
  },
  parent_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    defaultValue: null,
    comment: '父评论ID(回复评论时填写)',
  },
  reply_to_user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '回复目标用户ID',
  },
  comment_content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '评论内容',
  },
  comment_images: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '评论图片列表(JSON数组)',
    get() {
      const value = this.getDataValue('comment_images');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('comment_images', JSON.stringify(value || []));
    },
  },
  like_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '点赞数',
  },
  reply_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '回复数',
  },
  is_top: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否置顶 1:是 0:否',
  },
  is_hot: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否热门评论 1:是 0:否',
  },
  comment_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '评论状态 0:待审核 1:正常 2:隐藏 3:违规删除',
  },
  violation_level: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '违规等级 0:无违规 1:低风险 2:中风险 3:高风险',
  },
  violation_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '违规类型:spam/abuse/porn/politics/other',
  },
  filter_result: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '风控过滤结果(JSON)',
    get() {
      const value = this.getDataValue('filter_result');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('filter_result', value ? JSON.stringify(value) : null);
    },
  },
  audit_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '审核状态 0:未审核 1:审核通过 2:审核驳回',
  },
  audit_remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '审核备注',
  },
  auditor_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '审核人ID',
  },
  audit_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '审核时间',
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '评论IP地址',
  },
  source: {
    type: DataTypes.STRING(30),
    defaultValue: 'web',
    comment: '来源:web/ios/android/h5/mini',
  },
}, {
  tableName: 'biz_comment',
  comment: '评论表',
  indexes: [
    { fields: ['content_id'] },
    { fields: ['user_id'] },
    { fields: ['parent_id'] },
    { fields: ['comment_status'] },
    { fields: ['violation_level'] },
    { fields: ['created_at'] },
  ],
});

Comment.belongsTo(Content, { foreignKey: 'content_id', as: 'content' });
Comment.belongsTo(User, { foreignKey: 'user_id', as: 'commentUser' });
Comment.belongsTo(User, { foreignKey: 'auditor_id', as: 'auditor' });
Comment.hasMany(Comment, { foreignKey: 'parent_id', as: 'replies' });
Comment.belongsTo(Comment, { foreignKey: 'parent_id', as: 'parent' });

module.exports = { Comment };

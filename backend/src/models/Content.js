const { sequelize, DataTypes } = require('../config/database');
const { User } = require('./User');

const Content = sequelize.define('content', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  content_title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '内容标题',
  },
  content_subtitle: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '副标题',
  },
  content_category: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '内容分类 1:电影 2:电视剧 3:综艺 4:动漫 5:纪录片 6:短视频 7:直播',
  },
  cover_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图URL',
  },
  poster_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '海报图URL',
  },
  video_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '视频播放地址',
  },
  content_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '内容简介',
  },
  director: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '导演',
  },
  actors: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '主演',
  },
  release_year: {
    type: DataTypes.SMALLINT.UNSIGNED,
    allowNull: true,
    comment: '上映年份',
  },
  release_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '上映日期',
  },
  duration: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: '时长(分钟)',
  },
  area: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '地区',
  },
  language: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '语言',
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
  total_episodes: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '总集数',
  },
  updated_episodes: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '更新集数',
  },
  copyright_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '关联版权ID',
  },
  copyright_type: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: true,
    comment: '版权类型 1:独家 2:非独家 3:代理 4:公共',
  },
  rating: {
    type: DataTypes.DECIMAL(3, 1),
    defaultValue: 0,
    comment: '评分',
  },
  play_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    defaultValue: 0,
    comment: '播放量',
  },
  like_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    defaultValue: 0,
    comment: '点赞数',
  },
  collect_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    defaultValue: 0,
    comment: '收藏数',
  },
  comment_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    defaultValue: 0,
    comment: '评论数',
  },
  audit_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '审核状态 0:待审核 1:审核中 2:通过 3:驳回 4:下架',
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
  is_hot: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否热门 1:是 0:否',
  },
  is_recommend: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否推荐 1:是 0:否',
  },
  is_vip: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否VIP专享 1:是 0:否',
  },
  sort_order: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序',
  },
  status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态 1:上架 0:下架',
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
  tableName: 'biz_content',
  comment: '影视内容表',
  indexes: [
    { fields: ['content_title'] },
    { fields: ['content_category'] },
    { fields: ['audit_status'] },
    { fields: ['release_year'] },
    { fields: ['status'] },
  ],
});

Content.belongsTo(User, { foreignKey: 'auditor_id', as: 'auditor' });
Content.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = { Content };

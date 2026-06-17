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
  video_fingerprint: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '视频指纹(MD5/SHA1，用于去重)',
  },
  creator_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '创作者ID(关联平台用户)',
  },
  creator_uid: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '创作者UID(第三方/显示用)',
  },
  creator_level: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '创作者等级 0:普通 1:初级 2:中级 3:高级 4:头部',
  },
  hot_score: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0,
    comment: '热度评分',
  },
  hot_ranking: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '热度排名',
  },
  publish_batch: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '发布批次号',
  },
  content_rating: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '内容分级 0:全年龄 1:青少年 2:成人',
  },
  video_duration: {
    type: DataTypes.DECIMAL(8, 2),
    defaultValue: 0,
    comment: '视频时长(秒，短视频专用精确到秒)',
  },
  video_format: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '视频格式:mp4/webm/mov/avi等',
  },
  video_quality: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '画质等级 0:标清 1:高清 2:超清 3:蓝光',
  },
  file_size: {
    type: DataTypes.BIGINT.UNSIGNED,
    defaultValue: 0,
    comment: '文件大小(字节)',
  },
  bitrate_kbps: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '视频码率(kbps)',
  },
  frame_rate: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 30,
    comment: '帧率(fps)',
  },
  violation_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '违规次数',
  },
  last_violation_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '最近一次违规类型',
  },
  last_violation_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最近一次违规时间',
  },
  is_archived: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否归档 1:已归档 0:正常',
  },
  archived_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '归档时间',
  },
  share_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '分享次数',
  },
  danmaku_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '弹幕数',
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
    { fields: ['video_fingerprint'] },
    { fields: ['creator_id'] },
    { fields: ['creator_level'] },
    { fields: ['hot_score'] },
    { fields: ['publish_batch'] },
    { fields: ['content_rating'] },
    { fields: ['is_archived'] },
    { fields: ['violation_count'] },
  ],
});

Content.belongsTo(User, { foreignKey: 'auditor_id', as: 'auditor' });
Content.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

module.exports = { Content };

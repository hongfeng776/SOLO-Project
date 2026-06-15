const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Work = sequelize.define('Work', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true,
    comment: '作品ID'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '作品标题'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '作品描述'
  },
  cover_image: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图片地址'
  },
  author_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: '作者用户ID'
  },
  author_nickname: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '作者昵称'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '作品分类：illustration-插画，comic-漫画，animation-动画，game-游戏，novel-小说，photography-摄影'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态：1-已发布，0-草稿'
  },
  view_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '浏览量'
  },
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '点赞数'
  },
  comment_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '评论数'
  }
}, {
  tableName: 'works',
  comment: '作品表',
  indexes: [
    {
      name: 'idx_author_id',
      fields: ['author_id']
    },
    {
      name: 'idx_category',
      fields: ['category']
    },
    {
      name: 'idx_status',
      fields: ['status']
    }
  ]
});

module.exports = Work;

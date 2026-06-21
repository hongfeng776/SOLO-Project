const { sequelize, DataTypes } = require('../config/database');
const { Content } = require('./Content');
const { EndUser } = require('./EndUser');

const Danmaku = sequelize.define('danmaku', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '关联视频内容ID',
  },
  user_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '发送用户ID',
  },
  danmaku_content: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '弹幕内容',
  },
  play_time: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '播放时间点(秒)',
  },
  danmaku_type: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '弹幕类型 1:滚动 2:顶部 3:底部',
  },
  font_size: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 25,
    comment: '字体大小',
  },
  danmaku_color: {
    type: DataTypes.STRING(10),
    defaultValue: '#FFFFFF',
    comment: '弹幕颜色',
  },
  danmaku_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '弹幕状态 0:待审核 1:正常展示 2:临时屏蔽 3:永久封禁 4:已归档',
  },
  is_high_risk: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否高危违规 1:是 0:否',
  },
  violation_level: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '违规等级 0:正常 1:轻微 2:一般 3:严重',
  },
  violation_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '违规类型',
  },
  is_archived: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否已归档 1:是 0:否',
  },
  report_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '举报数',
  },
  like_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '点赞数',
  },
  is_real_time: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '是否实时弹幕 1:是 0:历史',
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '发送IP地址',
  },
  source: {
    type: DataTypes.STRING(20),
    defaultValue: 'web',
    comment: '来源 web/app/pc',
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注',
  },
}, {
  tableName: 'biz_danmaku',
  comment: '视频弹幕表',
  paranoid: true,
  indexes: [
    { fields: ['content_id'] },
    { fields: ['user_id'] },
    { fields: ['danmaku_status'] },
    { fields: ['is_high_risk'] },
    { fields: ['violation_level'] },
    { fields: ['is_archived'] },
    { fields: ['play_time'] },
    { fields: ['created_at'] },
    { fields: ['is_real_time'] },
  ],
});

Danmaku.belongsTo(Content, { foreignKey: 'content_id', as: 'content' });
Danmaku.belongsTo(EndUser, { foreignKey: 'user_id', as: 'user' });

module.exports = { Danmaku };

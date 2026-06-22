const { sequelize, DataTypes } = require('../config/database');
const { Content } = require('./Content');

const ContentInteractionStat = sequelize.define('content_interaction_stat', {
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
  stat_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: '统计日期',
  },
  comment_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '评论数',
  },
  danmaku_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '弹幕数',
  },
  like_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '点赞数',
  },
  share_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '转发数',
  },
  collect_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '收藏数',
  },
  play_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '播放数',
  },
  total_interactions: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '总互动数(评论+弹幕+点赞+转发+收藏)',
  },
  interaction_rate: {
    type: DataTypes.DECIMAL(8, 4),
    defaultValue: 0,
    comment: '互动率(总互动/播放量*100%)',
  },
  interaction_tag: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '互动标签 0:正常 1:优质 2:需优化 3:异常',
  },
  is_anomaly: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否数据异常 1:是 0:否',
  },
  anomaly_types: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '异常类型(逗号分隔):fake_interaction,abnormal_fluctuation,inconsistent_data',
    get() {
      const value = this.getDataValue('anomaly_types');
      return value ? value.split(',').filter(Boolean) : [];
    },
    set(value) {
      if (Array.isArray(value)) {
        this.setDataValue('anomaly_types', value.join(','));
      } else if (typeof value === 'string') {
        this.setDataValue('anomaly_types', value);
      } else {
        this.setDataValue('anomaly_types', '');
      }
    },
  },
  stat_batch: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: '统计批次号',
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注',
  },
}, {
  tableName: 'biz_content_interaction_stat',
  comment: '内容互动数据统计表',
  indexes: [
    { fields: ['content_id'] },
    { fields: ['stat_date'] },
    { fields: ['interaction_tag'] },
    { fields: ['is_anomaly'] },
    { fields: ['stat_batch'] },
    { fields: ['created_at'] },
    { fields: ['content_id', 'stat_date'], unique: true },
  ],
});

ContentInteractionStat.belongsTo(Content, { foreignKey: 'content_id', as: 'content' });

module.exports = { ContentInteractionStat };

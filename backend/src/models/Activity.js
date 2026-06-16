const { sequelize, DataTypes } = require('../config/database');

const Activity = sequelize.define('activity', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  activity_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '活动名称',
  },
  activity_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '活动编码',
  },
  activity_type: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '活动类型 1:优惠 2:抽奖 3:签到 4:节日 5:会员促销',
  },
  activity_theme: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '活动主题',
  },
  activity_image: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '活动主图URL',
  },
  activity_banner: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '活动Banner图URL',
  },
  activity_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '活动详情描述',
  },
  activity_rules: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '活动规则说明',
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '活动开始时间',
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '活动结束时间',
  },
  signup_start: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '报名开始时间',
  },
  signup_end: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '报名结束时间',
  },
  activity_config: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '活动配置(JSON)',
    get() {
      const value = this.getDataValue('activity_config');
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      this.setDataValue('activity_config', JSON.stringify(value || {}));
    },
  },
  prize_pool: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '奖品池(JSON)',
    get() {
      const value = this.getDataValue('prize_pool');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('prize_pool', JSON.stringify(value || []));
    },
  },
  total_budget: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '活动总预算',
  },
  used_budget: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '已使用预算',
  },
  participant_limit: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '参与人数上限(0为不限)',
  },
  participant_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '实际参与人数',
  },
  page_view: {
    type: DataTypes.BIGINT.UNSIGNED,
    defaultValue: 0,
    comment: '活动页面浏览量',
  },
  unique_visitor: {
    type: DataTypes.BIGINT.UNSIGNED,
    defaultValue: 0,
    comment: '活动独立访客数',
  },
  share_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '分享次数',
  },
  activity_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '活动状态 0:草稿 1:已发布 2:进行中 3:已结束 4:已取消',
  },
  is_hot: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否热门 1:是 0:否',
  },
  is_top: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否置顶 1:是 0:否',
  },
  sort_order: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序',
  },
  redirect_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '活动跳转链接',
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
  tableName: 'biz_activity',
  comment: '营销活动表',
  indexes: [
    { fields: ['activity_type'] },
    { fields: ['activity_status'] },
    { fields: ['start_time', 'end_time'] },
  ],
});

module.exports = { Activity };

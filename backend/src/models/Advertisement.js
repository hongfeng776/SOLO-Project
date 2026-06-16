const { sequelize, DataTypes } = require('../config/database');

const Advertisement = sequelize.define('advertisement', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  ad_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '广告名称',
  },
  ad_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '广告编码',
  },
  ad_type: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '广告类型 1:Banner 2:开屏 3:插屏 4:信息流 5:激励视频',
  },
  ad_position: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '投放位置',
  },
  ad_title: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '广告标题',
  },
  ad_subtitle: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '广告副标题',
  },
  ad_image: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '广告图片URL',
  },
  ad_video: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '广告视频URL',
  },
  redirect_url: {
    type: DataTypes.STRING(1000),
    allowNull: true,
    comment: '跳转链接',
  },
  redirect_type: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '跳转类型 1:外链 2:站内内容 3:小程序 4:应用下载',
  },
  target_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '关联目标ID(如内容ID)',
  },
  advertiser_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '广告主名称',
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '投放开始时间',
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '投放结束时间',
  },
  budget_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '预算金额',
  },
  spent_amount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '已消耗金额',
  },
  impression_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    defaultValue: 0,
    comment: '曝光量',
  },
  click_count: {
    type: DataTypes.BIGINT.UNSIGNED,
    defaultValue: 0,
    comment: '点击量',
  },
  ctr: {
    type: DataTypes.DECIMAL(5, 2),
    defaultValue: 0,
    comment: '点击率(%)',
  },
  frequency_cap: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '频率限制(每日次数,0为不限)',
  },
  target_audience: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '定向人群设置(JSON)',
    get() {
      const value = this.getDataValue('target_audience');
      return value ? JSON.parse(value) : {};
    },
    set(value) {
      this.setDataValue('target_audience', JSON.stringify(value || {}));
    },
  },
  ad_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '广告状态 0:草稿 1:待投放 2:投放中 3:已暂停 4:已结束',
  },
  sort_order: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序',
  },
  audit_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '审核状态 0:待审核 1:通过 2:驳回',
  },
  audit_remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '审核备注',
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
  tableName: 'biz_advertisement',
  comment: '广告投放表',
  indexes: [
    { fields: ['ad_type'] },
    { fields: ['ad_status'] },
    { fields: ['start_time', 'end_time'] },
  ],
});

module.exports = { Advertisement };

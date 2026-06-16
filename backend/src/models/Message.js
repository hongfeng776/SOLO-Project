const { sequelize, DataTypes } = require('../config/database');

const Message = sequelize.define('message', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  message_type: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '消息类型 1:系统通知 2:审核通知 3:版权预警 4:活动通知 5:评论回复 6:会员通知 7:广告通知',
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '消息标题',
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '消息内容',
  },
  sender_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '发送者ID(系统消息为null)',
  },
  receiver_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '接收者ID(null为全员消息)',
  },
  is_broadcast: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否全员广播 1:是 0:否',
  },
  is_read: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '是否已读 1:已读 0:未读',
  },
  read_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '阅读时间',
  },
  link_type: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: '关联类型:content/copyright/advertisement/activity/user/comment/member',
  },
  link_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '关联业务ID',
  },
  link_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '跳转链接',
  },
  priority: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '优先级 0:普通 1:重要 2:紧急',
  },
  extra_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '扩展数据(JSON)',
    get() {
      const value = this.getDataValue('extra_data');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('extra_data', value ? JSON.stringify(value) : null);
    },
  },
  push_channel: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '推送渠道:in_app/email/sms/push，逗号分隔',
  },
  push_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    comment: '推送状态 0:未推送 1:已推送 2:推送失败',
  },
  push_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '推送时间',
  },
  scheduled_time: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '定时推送时间',
  },
}, {
  tableName: 'sys_message',
  comment: '消息通知表',
  indexes: [
    { fields: ['message_type'] },
    { fields: ['receiver_id', 'is_read'] },
    { fields: ['is_broadcast'] },
    { fields: ['link_type', 'link_id'] },
    { fields: ['scheduled_time'] },
    { fields: ['created_at'] },
  ],
});

module.exports = { Message };

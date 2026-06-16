const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '通知ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '用户ID'
  },
  type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '通知类型: system-系统, order-订单, merchant-商家, approval-审批'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '通知标题'
  },
  content: {
    type: DataTypes.TEXT,
    comment: '通知内容'
  },
  relatedId: {
    type: DataTypes.INTEGER,
    comment: '关联业务ID'
  },
  isRead: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否已读: 0-未读, 1-已读'
  }
}, {
  tableName: 'notifications',
  comment: '通知消息表'
});

module.exports = Notification;

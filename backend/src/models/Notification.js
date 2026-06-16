const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const Notification = sequelize.define(
  'Notification',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '通知ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '接收用户ID'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '通知标题'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '通知内容'
    },
    type: {
      type: DataTypes.ENUM('system', 'audit', 'violation', 'appeal', 'member', 'resource'),
      defaultValue: 'system',
      allowNull: false,
      comment: '通知类型'
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '关联业务ID'
    },
    relatedType: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '关联业务类型'
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
      comment: '是否已读'
    },
    readTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '阅读时间'
    },
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
      defaultValue: 'normal',
      allowNull: false,
      comment: '优先级'
    }
  },
  {
    tableName: 'notifications',
    comment: '系统通知表',
    indexes: [
      { fields: ['userId'] },
      { fields: ['isRead'] },
      { fields: ['type'] },
      { fields: ['createdAt'] }
    ]
  }
)

module.exports = Notification

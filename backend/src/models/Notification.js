const { DataTypes } = require('sequelize')
const { sequelize } = require('../config/database')

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '内容'
  },
  type: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '类型：1系统 2业务 3风控 4财务'
  },
  targetType: {
    type: DataTypes.TINYINT,
    allowNull: false,
    comment: '推送对象类型：1全部 2角色 3个人'
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '推送对象ID'
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '发送者ID'
  },
  senderName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '发送者'
  },
  priority: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '优先级：1普通 2重要 3紧急'
  },
  isRead: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否已读：0未读 1已读'
  },
  readTime: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '阅读时间'
  },
  bizType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '业务类型'
  },
  bizId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '业务ID'
  },
  extra: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: '扩展数据'
  }
}, {
  tableName: 'biz_notification',
  comment: '消息通知表',
  indexes: [
    { fields: ['targetType'] },
    { fields: ['targetId'] },
    { fields: ['type'] },
    { fields: ['isRead'] },
    { fields: ['createTime'] }
  ]
})

module.exports = Notification

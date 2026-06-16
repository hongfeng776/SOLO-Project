const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const Member = sequelize.define(
  'Member',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '会员ID'
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      comment: '用户ID'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '用户名'
    },
    level: {
      type: DataTypes.ENUM('normal', 'bronze', 'silver', 'gold', 'platinum'),
      defaultValue: 'normal',
      allowNull: false,
      comment: '会员等级'
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '积分'
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '余额'
    },
    expireTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '会员过期时间'
    },
    totalDownload: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '累计下载次数'
    },
    totalConsume: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
      allowNull: false,
      comment: '累计消费金额'
    }
  },
  {
    tableName: 'members',
    comment: '会员表'
  }
)

module.exports = Member

const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const Violation = sequelize.define(
  'Violation',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '违规记录ID'
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资源ID'
    },
    resourceType: {
      type: DataTypes.ENUM('image', 'video', 'audio', 'template'),
      allowNull: false,
      comment: '资源类型'
    },
    resourceTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '资源标题'
    },
    violationType: {
      type: DataTypes.ENUM('porn', 'violence', 'politics', 'ad', 'copyright', 'other'),
      allowNull: false,
      comment: '违规类型'
    },
    violationLevel: {
      type: DataTypes.ENUM('minor', 'moderate', 'severe'),
      defaultValue: 'minor',
      allowNull: false,
      comment: '违规等级'
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '违规描述'
    },
    evidence: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '违规证据(JSON)'
    },
    source: {
      type: DataTypes.ENUM('auto', 'manual', 'report'),
      defaultValue: 'manual',
      allowNull: false,
      comment: '来源'
    },
    handlerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '处置人ID'
    },
    handlerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '处置人名称'
    },
    action: {
      type: DataTypes.ENUM('warning', 'removed', 'banned', 'appeal_allowed'),
      allowNull: true,
      comment: '处置动作'
    },
    actionTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '处置时间'
    },
    status: {
      type: DataTypes.ENUM('pending', 'processed', 'appealed', 'revoked'),
      defaultValue: 'pending',
      allowNull: false,
      comment: '状态'
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '资源作者ID'
    }
  },
  {
    tableName: 'violations',
    comment: '违规记录表',
    indexes: [
      { fields: ['resourceId'] },
      { fields: ['status'] },
      { fields: ['violationType'] },
      { fields: ['violationLevel'] },
      { fields: ['authorId'] }
    ]
  }
)

module.exports = Violation

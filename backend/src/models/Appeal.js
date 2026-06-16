const { DataTypes } = require('sequelize')
const { sequelize } = require('./db')

const Appeal = sequelize.define(
  'Appeal',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      comment: '申诉ID'
    },
    violationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '违规记录ID'
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '资源ID'
    },
    resourceTitle: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '资源标题'
    },
    appellantId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '申诉人ID'
    },
    appellantName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '申诉人名称'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '申诉理由'
    },
    evidence: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '申诉证据(JSON)'
    },
    reviewerId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '复核人ID'
    },
    reviewerName: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: '复核人名称'
    },
    reviewResult: {
      type: DataTypes.ENUM('upheld', 'overturned', 'partial'),
      allowNull: true,
      comment: '复核结果'
    },
    reviewOpinion: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: '复核意见'
    },
    reviewTime: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '复核时间'
    },
    status: {
      type: DataTypes.ENUM('pending', 'reviewing', 'approved', 'rejected'),
      defaultValue: 'pending',
      allowNull: false,
      comment: '状态'
    }
  },
  {
    tableName: 'appeals',
    comment: '用户申诉表',
    indexes: [
      { fields: ['violationId'] },
      { fields: ['appellantId'] },
      { fields: ['status'] }
    ]
  }
)

module.exports = Appeal

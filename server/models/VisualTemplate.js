const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const VisualTemplate = sequelize.define('VisualTemplate', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '模板名称'
  },
  cover: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图片路径'
  },
  style_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '风格类型'
  },
  scene: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '适用场景'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态 0-停用 1-启用'
  },
  use_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '使用次数'
  }
}, {
  tableName: 'visual_templates',
  indexes: [
    { fields: ['style_type'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

module.exports = VisualTemplate;

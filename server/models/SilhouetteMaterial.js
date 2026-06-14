const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const SilhouetteMaterial = sequelize.define('SilhouetteMaterial', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '素材名称'
  },
  cover: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '封面图片路径'
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '宽度(px)'
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '高度(px)'
  },
  scene: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: '适配场景'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '分类'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 2,
    comment: '状态 0-下架 1-上架 2-待审核'
  },
  use_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '使用次数'
  }
}, {
  tableName: 'silhouette_materials',
  indexes: [
    { fields: ['category'] },
    { fields: ['status'] },
    { fields: ['created_at'] }
  ]
});

module.exports = SilhouetteMaterial;

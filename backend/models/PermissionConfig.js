const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');

const PermissionConfig = sequelize.define('PermissionConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '配置ID'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    comment: '用户ID'
  },
  permissionType: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '权限类型: base-基础权限, travel-出行特权, marketing-营销权益, business-商旅专属'
  },
  permissionKey: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '权限标识'
  },
  permissionName: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '权限名称'
  },
  isEnabled: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否启用: 0-禁用, 1-启用'
  },
  configValue: {
    type: DataTypes.TEXT,
    comment: '权限配置值(JSON格式，如折扣率、积分倍率等)'
  },
  validFrom: {
    type: DataTypes.DATE,
    comment: '生效开始时间'
  },
  validTo: {
    type: DataTypes.DATE,
    comment: '生效结束时间'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 1-生效中, 0-已过期, 2-已取消'
  },
  source: {
    type: DataTypes.STRING(30),
    defaultValue: 'manual',
    comment: '权限来源: manual-手动配置, level-等级自带, activity-活动赠送, batch-批量配置'
  },
  remark: {
    type: DataTypes.STRING(500),
    comment: '备注'
  }
}, {
  tableName: 'permission_configs',
  comment: '用户权限配置表',
  indexes: [
    {
      unique: true,
      fields: ['userId', 'permissionType', 'permissionKey']
    }
  ]
});

PermissionConfig.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(PermissionConfig, { foreignKey: 'userId', as: 'permissions' });

module.exports = PermissionConfig;

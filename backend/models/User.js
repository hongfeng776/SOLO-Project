const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const Role = require('./Role');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码(加密后)'
  },
  nickname: {
    type: DataTypes.STRING(50),
    comment: '昵称'
  },
  realName: {
    type: DataTypes.STRING(50),
    comment: '真实姓名'
  },
  roleId: {
    type: DataTypes.INTEGER,
    references: {
      model: Role,
      key: 'id'
    },
    comment: '角色ID'
  },
  status: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '状态: 1-启用, 0-禁用, 2-冻结'
  },
  avatar: {
    type: DataTypes.STRING(255),
    comment: '头像URL'
  },
  phone: {
    type: DataTypes.STRING(20),
    unique: true,
    comment: '手机号'
  },
  email: {
    type: DataTypes.STRING(100),
    comment: '邮箱'
  },
  idCard: {
    type: DataTypes.STRING(20),
    unique: true,
    comment: '身份证号'
  },
  userLevel: {
    type: DataTypes.TINYINT,
    defaultValue: 1,
    comment: '用户等级: 1-普通用户, 2-商旅用户, 3-VIP用户'
  },
  registerChannel: {
    type: DataTypes.STRING(30),
    defaultValue: 'web',
    comment: '注册渠道: app, wechat, web, offline, third_party'
  },
  tags: {
    type: DataTypes.TEXT,
    comment: '用户标签(JSON数组字符串)'
  },
  isAbnormal: {
    type: DataTypes.TINYINT,
    defaultValue: 0,
    comment: '是否异常用户: 0-正常, 1-异常'
  },
  abnormalType: {
    type: DataTypes.STRING(50),
    comment: '异常类型: fake_reg-虚假注册, info_missing-信息缺失, duplicate-重复注册'
  },
  abnormalRemark: {
    type: DataTypes.STRING(500),
    comment: '异常备注'
  },
  freezeReason: {
    type: DataTypes.STRING(500),
    comment: '冻结原因'
  },
  freezeTime: {
    type: DataTypes.DATE,
    comment: '冻结时间'
  },
  lastLoginTime: {
    type: DataTypes.DATE,
    comment: '最后登录时间'
  },
  lastLoginIp: {
    type: DataTypes.STRING(50),
    comment: '最后登录IP'
  },
  orderCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '订单数量'
  },
  totalAmount: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0,
    comment: '累计消费金额'
  },
  benefits: {
    type: DataTypes.TEXT,
    comment: '用户权益(JSON字符串)'
  },
  permissions: {
    type: DataTypes.TEXT,
    comment: '用户权限(JSON字符串)'
  }
}, {
  tableName: 'users',
  comment: '用户表'
});

User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });

module.exports = User;

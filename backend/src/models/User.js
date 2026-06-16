const { sequelize, DataTypes } = require('../config/database');

const Role = sequelize.define('role', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  role_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '角色编码',
  },
  role_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '角色名称',
  },
  description: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '角色描述',
  },
  permissions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '权限列表(JSON数组)',
    get() {
      const value = this.getDataValue('permissions');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('permissions', JSON.stringify(value || []));
    },
  },
  sort_order: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '排序',
  },
  status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态 1:启用 0:禁用',
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '创建人ID',
  },
  updated_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '更新人ID',
  },
}, {
  tableName: 'sys_role',
  comment: '系统角色表',
});

const User = sequelize.define('user', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名',
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码',
  },
  real_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '真实姓名',
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '邮箱',
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '手机号',
  },
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '头像URL',
  },
  role_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '角色ID',
    references: {
      model: Role,
      key: 'id',
    },
  },
  department: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '所属部门',
  },
  status: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '状态 1:正常 0:禁用 2:锁定',
  },
  last_login_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间',
  },
  last_login_ip: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '最后登录IP',
  },
  login_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
    comment: '登录次数',
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注',
  },
  created_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '创建人ID',
  },
  updated_by: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '更新人ID',
  },
}, {
  tableName: 'sys_user',
  comment: '系统用户表',
});

User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
Role.hasMany(User, { foreignKey: 'role_id', as: 'users' });

module.exports = { User, Role };

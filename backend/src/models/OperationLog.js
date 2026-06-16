const { sequelize, DataTypes } = require('../config/database');

const OperationLog = sequelize.define('operation_log', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  operator_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '操作人ID',
  },
  operator_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人姓名',
  },
  operation_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '操作类型:CREATE/UPDATE/DELETE/AUDIT/BATCH_DELETE/EXPORT/LOGIN/LOGOUT/CHANGE_STATUS/CHANGE_PASSWORD',
  },
  operation_module: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作模块:content/copyright/advertisement/activity/user/role/comment/member/auth/system',
  },
  operation_desc: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '操作描述',
  },
  target_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作对象类型',
  },
  target_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: '操作对象ID(支持批量,逗号分隔)',
  },
  target_name: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '操作对象名称',
  },
  before_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '变更前数据(JSON)',
    get() {
      const value = this.getDataValue('before_data');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('before_data', value ? JSON.stringify(value) : null);
    },
  },
  after_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '变更后数据(JSON)',
    get() {
      const value = this.getDataValue('after_data');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('after_data', value ? JSON.stringify(value) : null);
    },
  },
  request_method: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '请求方法:GET/POST/PUT/DELETE',
  },
  request_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '请求URL',
  },
  request_params: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '请求参数(JSON)',
    get() {
      const value = this.getDataValue('request_params');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('request_params', value ? JSON.stringify(value) : null);
    },
  },
  response_code: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '响应状态码',
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作IP地址',
  },
  user_agent: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '浏览器User-Agent',
  },
  duration: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: '请求耗时(ms)',
  },
  is_success: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
    comment: '是否成功 1:成功 0:失败',
  },
  error_message: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '错误信息',
  },
}, {
  tableName: 'sys_operation_log',
  comment: '操作日志表',
  indexes: [
    { fields: ['operator_id'] },
    { fields: ['operation_type'] },
    { fields: ['operation_module'] },
    { fields: ['target_type', 'target_id'] },
    { fields: ['is_success'] },
    { fields: ['created_at'] },
  ],
});

module.exports = { OperationLog };

const { sequelize, DataTypes } = require('../config/database');
const { Content } = require('./Content');

const ContentStatusLog = sequelize.define('content_status_log', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  content_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '内容ID',
  },
  from_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: true,
    comment: '变更前状态',
  },
  to_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    comment: '变更后状态',
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
  change_reason: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '变更原因',
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注',
  },
  operation_type: {
    type: DataTypes.STRING(30),
    allowNull: true,
    comment: '操作类型:CREATE/AUDIT/MANUAL/BATCH',
  },
  extra_data: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '扩展数据(JSON)',
    get() {
      const value = this.getDataValue('extra_data');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('extra_data', value ? JSON.stringify(value) : null);
    },
  },
  ip_address: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作IP',
  },
}, {
  tableName: 'biz_content_status_log',
  comment: '内容状态变更日志表',
  indexes: [
    { fields: ['content_id'] },
    { fields: ['from_status'] },
    { fields: ['to_status'] },
    { fields: ['operator_id'] },
    { fields: ['created_at'] },
  ],
});

ContentStatusLog.belongsTo(Content, { foreignKey: 'content_id', as: 'content' });

module.exports = { ContentStatusLog };

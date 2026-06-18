const { sequelize, DataTypes } = require('../config/database');

const CopyrightValidity = sequelize.define('copyright_validity', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  config_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '配置名称',
  },
  enabled: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '是否启用 1:启用 0:停用',
  },
  warning_threshold: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 30,
    comment: '预警阈值',
  },
  threshold_unit: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '阈值单位 1:天 2:周 3:月',
  },
  threshold_days: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 30,
    comment: '阈值换算天数',
  },
  expire_handler_rule: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '过期处理规则 1:自动下架内容 2:自动下架+停止流量 3:仅停止流量 4:仅记录留存',
  },
  related_content_scope: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '关联内容范围 1:全部关联内容 2:仅已上架内容 3:指定内容类型',
  },
  push_channels: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '推送渠道配置(JSON)',
    get() {
      const value = this.getDataValue('push_channels');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('push_channels', JSON.stringify(value || []));
    },
  },
  receiver_roles: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '接收角色配置(JSON)',
    get() {
      const value = this.getDataValue('receiver_roles');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('receiver_roles', JSON.stringify(value || []));
    },
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注',
  },
  version: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '版本号',
  },
  last_scan_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后扫描时间',
  },
  scan_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '扫描次数',
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
  tableName: 'biz_copyright_validity_config',
  comment: '版权有效期管控配置表',
  indexes: [
    { fields: ['config_name'] },
    { fields: ['enabled'] },
    { fields: ['threshold_unit'] },
    { fields: ['expire_handler_rule'] },
    { fields: ['related_content_scope'] },
    { fields: ['last_scan_at'] },
    { fields: ['version'] },
    { unique: true, fields: ['config_name', 'enabled'] },
  ],
});

const CopyrightValidityLog = sequelize.define('copyright_validity_log', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  config_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '配置ID',
  },
  copyright_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: false,
    comment: '版权ID',
  },
  copyright_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '版权编号',
  },
  validity_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '有效期状态 1:正常 2:预警 3:已过期',
  },
  validity_status_label: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '有效期状态标签',
  },
  remaining_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '剩余天数',
  },
  end_date: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: '版权到期日期',
  },
  event_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '事件类型 SCAN/WARNING/EXPIRE/HANDLE/RENEW',
  },
  event_type_label: {
    type: DataTypes.STRING(20),
    comment: '事件类型标签',
  },
  action_result: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '动作结果 1:成功 0:失败 2:跳过',
  },
  action_detail: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '动作详情(JSON)',
    get() {
      const value = this.getDataValue('action_detail');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('action_detail', value ? JSON.stringify(value) : null);
    },
  },
  push_status: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '推送状态 0:未推送 1:已推送 2:推送失败',
  },
  push_channels: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '推送渠道结果(JSON)',
    get() {
      const value = this.getDataValue('push_channels');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('push_channels', JSON.stringify(value || []));
    },
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
  batch_no: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '批次号',
  },
  exception_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '异常类型',
  },
  exception_detail: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '异常详情',
  },
  environment_mode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'prod',
    comment: '环境模式 test/prod',
  },
}, {
  tableName: 'biz_copyright_validity_log',
  comment: '版权有效期管控日志表',
  indexes: [
    { fields: ['config_id'] },
    { fields: ['copyright_id'] },
    { fields: ['copyright_code'] },
    { fields: ['validity_status'] },
    { fields: ['event_type'] },
    { fields: ['batch_no'] },
    { fields: ['push_status'] },
    { fields: ['exception_type'] },
    { fields: ['created_at'] },
    { fields: ['config_id', 'event_type'] },
  ],
});

const CopyrightValidityTask = sequelize.define('copyright_validity_task', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  task_no: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '任务编号',
  },
  task_type: {
    type: DataTypes.STRING(30),
    allowNull: false,
    comment: '任务类型 RENEW_WARNING/REMOVE/ARCHIVE',
  },
  task_type_label: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '任务类型标签',
  },
  config_id: {
    type: DataTypes.BIGINT.UNSIGNED,
    allowNull: true,
    comment: '配置ID',
  },
  environment_mode: {
    type: DataTypes.STRING(10),
    allowNull: false,
    defaultValue: 'prod',
    comment: '环境模式 test/prod',
  },
  total_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '总数',
  },
  success_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '成功数',
  },
  failed_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '失败数',
  },
  skipped_count: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '跳过数',
  },
  status: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '状态 0:待执行 1:执行中 2:已完成 3:已失败 4:已取消',
  },
  status_label: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '状态标签',
  },
  progress: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    comment: '进度百分比',
  },
  task_params: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '任务参数(JSON)',
    get() {
      const value = this.getDataValue('task_params');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('task_params', value ? JSON.stringify(value) : null);
    },
  },
  copyright_ids: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '目标版权ID列表(JSON)',
    get() {
      const value = this.getDataValue('copyright_ids');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('copyright_ids', JSON.stringify(value || []));
    },
  },
  result_summary: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '结果摘要(JSON)',
    get() {
      const value = this.getDataValue('result_summary');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('result_summary', value ? JSON.stringify(value) : null);
    },
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注',
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
  started_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '开始时间',
  },
  completed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '完成时间',
  },
}, {
  tableName: 'biz_copyright_validity_task',
  comment: '版权有效期批量任务表',
  indexes: [
    { unique: true, fields: ['task_no'] },
    { fields: ['task_type'] },
    { fields: ['config_id'] },
    { fields: ['status'] },
    { fields: ['environment_mode'] },
    { fields: ['created_at'] },
  ],
});

module.exports = { CopyrightValidity, CopyrightValidityLog, CopyrightValidityTask };

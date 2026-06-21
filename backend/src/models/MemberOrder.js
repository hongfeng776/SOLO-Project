const { sequelize, DataTypes } = require('../config/database');

const generateOrderNo = () => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `MO${dateStr}${rand}`;
};

const MemberOrder = sequelize.define('member_order', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  orderNo: {
    type: DataTypes.STRING(32),
    field: 'order_no',
    allowNull: false,
    unique: true,
    comment: '订单编号，唯一标识',
  },
  userId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'user_id',
    allowNull: false,
    comment: '用户ID',
  },
  uid: {
    type: DataTypes.STRING(32),
    allowNull: false,
    comment: '用户UID',
  },
  packageType: {
    type: DataTypes.STRING(32),
    field: 'package_type',
    allowNull: false,
    comment: '套餐类型: MONTH/QUARTER/YEAR/LIFETIME',
  },
  packageName: {
    type: DataTypes.STRING(80),
    field: 'package_name',
    allowNull: false,
    comment: '套餐名称',
  },
  memberLevelTier: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'member_level_tier',
    allowNull: false,
    comment: '对应的会员等级层级',
  },
  originalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'original_amount',
    allowNull: false,
    defaultValue: 0,
    comment: '原始金额(元)',
  },
  payAmount: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'pay_amount',
    allowNull: false,
    defaultValue: 0,
    comment: '实付金额(元)',
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'discount_amount',
    defaultValue: 0,
    comment: '优惠金额(元)',
  },
  orderStatus: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'order_status',
    defaultValue: 0,
    comment: '订单状态: 0待支付 1支付成功 2支付失败 3订单过期 4退款完成',
  },
  payChannel: {
    type: DataTypes.STRING(32),
    field: 'pay_channel',
    allowNull: true,
    comment: '支付渠道: ALIPAY/WECHAT/APPLE/GOOGLE/OFFLINE',
  },
  payTime: {
    type: DataTypes.DATE,
    field: 'pay_time',
    allowNull: true,
    comment: '支付时间',
  },
  payTradeNo: {
    type: DataTypes.STRING(64),
    field: 'pay_trade_no',
    allowNull: true,
    comment: '第三方支付流水号',
  },
  payBatch: {
    type: DataTypes.STRING(64),
    field: 'pay_batch',
    allowNull: true,
    comment: '支付批次号',
  },
  expireTime: {
    type: DataTypes.DATE,
    field: 'expire_time',
    allowNull: true,
    comment: '订单过期时间',
  },
  privilegeSnapshot: {
    type: DataTypes.TEXT,
    field: 'privilege_snapshot',
    allowNull: true,
    comment: '套餐权益快照(JSON)',
    get() {
      const value = this.getDataValue('privilegeSnapshot');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('privilegeSnapshot', value ? JSON.stringify(value) : null);
    },
  },
  durationDays: {
    type: DataTypes.INTEGER.UNSIGNED,
    field: 'duration_days',
    defaultValue: 30,
    comment: '套餐时长(天)',
  },
  isVerified: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'is_verified',
    defaultValue: 0,
    comment: '是否已核验 0:否 1:是',
  },
  verifyTime: {
    type: DataTypes.DATE,
    field: 'verify_time',
    allowNull: true,
    comment: '核验时间',
  },
  verifyBatch: {
    type: DataTypes.STRING(64),
    field: 'verify_batch',
    allowNull: true,
    comment: '核验批次号',
  },
  isAbnormal: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'is_abnormal',
    defaultValue: 0,
    comment: '是否异常订单 0:否 1:是',
  },
  abnormalReason: {
    type: DataTypes.STRING(500),
    field: 'abnormal_reason',
    allowNull: true,
    comment: '异常原因',
  },
  abnormalResolved: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'abnormal_resolved',
    defaultValue: 0,
    comment: '异常是否已处理 0:否 1:是',
  },
  operationBatch: {
    type: DataTypes.STRING(64),
    field: 'operation_batch',
    allowNull: true,
    comment: '操作批次号',
  },
  remark: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '备注',
  },
  createdBy: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'created_by',
    allowNull: true,
    comment: '创建人ID',
  },
  updatedBy: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'updated_by',
    allowNull: true,
    comment: '更新人ID',
  },
}, {
  tableName: 'biz_member_order',
  comment: '会员订单表',
  indexes: [
    { name: 'idx_order_no', unique: true, fields: ['order_no'] },
    { name: 'idx_user_id', fields: ['user_id'] },
    { name: 'idx_uid', fields: ['uid'] },
    { name: 'idx_order_status', fields: ['order_status'] },
    { name: 'idx_package_type', fields: ['package_type'] },
    { name: 'idx_pay_channel', fields: ['pay_channel'] },
    { name: 'idx_pay_batch', fields: ['pay_batch'] },
    { name: 'idx_is_abnormal', fields: ['is_abnormal'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
});

const MemberOrderLog = sequelize.define('member_order_log', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'order_id',
    allowNull: false,
    comment: '关联订单ID',
  },
  orderNo: {
    type: DataTypes.STRING(32),
    field: 'order_no',
    allowNull: false,
    comment: '订单编号',
  },
  logType: {
    type: DataTypes.STRING(32),
    field: 'log_type',
    allowNull: false,
    comment: '日志类型: CREATE/CANCEL/PAY_SUCCESS/PAY_FAIL/EXPIRE/VERIFY/REFUND/APPEAL/BATCH_CLOSE/BATCH_VERIFY',
  },
  logTypeLabel: {
    type: DataTypes.STRING(32),
    field: 'log_type_label',
    allowNull: true,
    comment: '日志类型中文标签',
  },
  operationBatch: {
    type: DataTypes.STRING(64),
    field: 'operation_batch',
    allowNull: true,
    comment: '操作批次号',
  },
  beforeSnapshot: {
    type: DataTypes.TEXT,
    field: 'before_snapshot',
    allowNull: true,
    comment: '变更前快照(JSON)',
    get() {
      const value = this.getDataValue('beforeSnapshot');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('beforeSnapshot', value ? JSON.stringify(value) : null);
    },
  },
  afterSnapshot: {
    type: DataTypes.TEXT,
    field: 'after_snapshot',
    allowNull: true,
    comment: '变更后快照(JSON)',
    get() {
      const value = this.getDataValue('afterSnapshot');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('afterSnapshot', value ? JSON.stringify(value) : null);
    },
  },
  changedFields: {
    type: DataTypes.TEXT,
    field: 'changed_fields',
    allowNull: true,
    comment: '变更字段(JSON数组)',
    get() {
      const value = this.getDataValue('changedFields');
      return value ? JSON.parse(value) : [];
    },
    set(value) {
      this.setDataValue('changedFields', JSON.stringify(value || []));
    },
  },
  operatorId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'operator_id',
    allowNull: true,
    comment: '操作人ID',
  },
  operatorName: {
    type: DataTypes.STRING(50),
    field: 'operator_name',
    allowNull: true,
    comment: '操作人姓名',
  },
  operatorRemark: {
    type: DataTypes.STRING(500),
    field: 'operator_remark',
    allowNull: true,
    comment: '操作备注',
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    field: 'ip_address',
    allowNull: true,
    comment: '操作IP',
  },
}, {
  tableName: 'biz_member_order_log',
  comment: '会员订单日志表',
  indexes: [
    { name: 'idx_order_id', fields: ['order_id'] },
    { name: 'idx_order_no', fields: ['order_no'] },
    { name: 'idx_log_type', fields: ['log_type'] },
    { name: 'idx_operation_batch', fields: ['operation_batch'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
});

const MemberOrderRefund = sequelize.define('member_order_refund', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true,
  },
  orderId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'order_id',
    allowNull: false,
    comment: '关联订单ID',
  },
  orderNo: {
    type: DataTypes.STRING(32),
    field: 'order_no',
    allowNull: false,
    comment: '订单编号',
  },
  refundNo: {
    type: DataTypes.STRING(32),
    field: 'refund_no',
    allowNull: false,
    unique: true,
    comment: '退款编号',
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    field: 'refund_amount',
    allowNull: false,
    comment: '退款金额(元)',
  },
  refundReason: {
    type: DataTypes.STRING(500),
    field: 'refund_reason',
    allowNull: false,
    comment: '退款原因',
  },
  refundChannel: {
    type: DataTypes.STRING(32),
    field: 'refund_channel',
    allowNull: true,
    comment: '退款渠道',
  },
  refundTradeNo: {
    type: DataTypes.STRING(64),
    field: 'refund_trade_no',
    allowNull: true,
    comment: '退款流水号',
  },
  refundStatus: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'refund_status',
    defaultValue: 0,
    comment: '退款状态: 0处理中 1退款成功 2退款失败',
  },
  privilegeRevoked: {
    type: DataTypes.TINYINT.UNSIGNED,
    field: 'privilege_revoked',
    defaultValue: 0,
    comment: '权益是否已收回 0:否 1:是',
  },
  operatorId: {
    type: DataTypes.BIGINT.UNSIGNED,
    field: 'operator_id',
    allowNull: true,
    comment: '操作人ID',
  },
  operatorName: {
    type: DataTypes.STRING(50),
    field: 'operator_name',
    allowNull: true,
    comment: '操作人姓名',
  },
  extraData: {
    type: DataTypes.TEXT,
    field: 'extra_data',
    allowNull: true,
    comment: '扩展数据(JSON)',
    get() {
      const value = this.getDataValue('extraData');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('extraData', value ? JSON.stringify(value) : null);
    },
  },
}, {
  tableName: 'biz_member_order_refund',
  comment: '会员订单退款表',
  indexes: [
    { name: 'idx_order_id', fields: ['order_id'] },
    { name: 'idx_order_no', fields: ['order_no'] },
    { name: 'idx_refund_no', unique: true, fields: ['refund_no'] },
    { name: 'idx_refund_status', fields: ['refund_status'] },
    { name: 'idx_created_at', fields: ['created_at'] },
  ],
});

MemberOrder.hasMany(MemberOrderLog, { foreignKey: 'order_id', as: 'orderLogs' });
MemberOrderLog.belongsTo(MemberOrder, { foreignKey: 'order_id', as: 'order' });

MemberOrder.hasMany(MemberOrderRefund, { foreignKey: 'order_id', as: 'refunds' });
MemberOrderRefund.belongsTo(MemberOrder, { foreignKey: 'order_id', as: 'order' });

module.exports = {
  MemberOrder,
  MemberOrderLog,
  MemberOrderRefund,
  generateOrderNo,
};

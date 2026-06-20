const { DataTypes, Op, sequelize } = require('./_db');
const helpers = require('../utils/helpers');

const FEEDBACK_TYPE = {
  BUG: { value: 'BUG', label: 'Bug反馈', color: '#F56C6C', type: 'danger', handler: '技术组' },
  SUGGESTION: { value: 'SUGGESTION', label: '建议反馈', color: '#409EFF', type: 'primary', handler: '产品组' },
  COMPLAINT: { value: 'COMPLAINT', label: '投诉反馈', color: '#E6A23C', type: 'warning', handler: '客服主管' },
};

const FEEDBACK_STATUS = {
  PENDING: { value: 1, label: '待处理', color: '#909399', type: 'info' },
  PROCESSING: { value: 2, label: '处理中', color: '#409EFF', type: 'primary' },
  RESOLVED: { value: 3, label: '已解决', color: '#67C23A', type: 'success' },
  REJECTED: { value: 4, label: '驳回关闭', color: '#F56C6C', type: 'danger' },
};

const FEEDBACK_PRIORITY = {
  LOW: { value: 1, label: '低', color: '#909399', type: 'info' },
  MEDIUM: { value: 2, label: '中', color: '#409EFF', type: 'primary' },
  HIGH: { value: 3, label: '高', color: '#E6A23C', type: 'warning' },
  URGENT: { value: 4, label: '紧急', color: '#F56C6C', type: 'danger' },
};

const FEEDBACK_SOURCE = {
  APP: { value: 'APP', label: 'APP端', color: '#409EFF', type: 'primary' },
  WEB: { value: 'WEB', label: '网页端', color: '#67C23A', type: 'success' },
  EMAIL: { value: 'EMAIL', label: '邮件', color: '#E6A23C', type: 'warning' },
  PHONE: { value: 'PHONE', label: '电话', color: '#909399', type: 'info' },
};

const FEEDBACK_BATCH_ACTION = {
  ARCHIVE: { value: 'ARCHIVE', label: '批量归档', color: '#67C23A', type: 'success' },
  URGENT: { value: 'URGENT', label: '批量加急', color: '#F56C6C', type: 'danger' },
  CLOSE: { value: 'CLOSE', label: '批量关闭', color: '#909399', type: 'info' },
};

const FEEDBACK_TIMELINESS = {
  NORMAL: { value: 1, label: '时效正常', color: '#67C23A', type: 'success' },
  OVERDUE: { value: 2, label: '即将超时', color: '#E6A23C', type: 'warning' },
  CRITICAL_OVERDUE: { value: 3, label: '已超时', color: '#F56C6C', type: 'danger' },
};

const PRIORITY_TIMEOUT_HOURS = { 1: 168, 2: 72, 3: 24, 4: 4 };

const FeedbackRecord = sequelize.define('FeedbackRecord', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  feedbackNo: { type: DataTypes.STRING(30), unique: true, allowNull: false, comment: '反馈单号 FBK_yyyymmdd_NNNN' },
  userId: { type: DataTypes.INTEGER, allowNull: false, comment: '反馈用户ID' },
  uid: { type: DataTypes.STRING(50), allowNull: false, comment: '反馈用户UID' },
  feedbackType: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'BUG', comment: '反馈类型: BUG/SUGGESTION/COMPLAINT' },
  title: { type: DataTypes.STRING(200), allowNull: false, comment: '反馈标题' },
  content: { type: DataTypes.TEXT, allowNull: false, comment: '反馈内容' },
  attachments: { type: DataTypes.JSON, comment: '附件列表 [{name,url,size}]' },
  source: { type: DataTypes.STRING(20), defaultValue: 'APP', comment: '反馈来源: APP/WEB/EMAIL/PHONE' },
  status: { type: DataTypes.TINYINT, defaultValue: 1, comment: '状态: 1待处理/2处理中/3已解决/4驳回关闭' },
  priority: { type: DataTypes.TINYINT, defaultValue: 2, comment: '优先级: 1低/2中/3高/4紧急' },
  originalPriority: { type: DataTypes.TINYINT, comment: '初始优先级（用于追踪自动升级）' },
  handlerId: { type: DataTypes.INTEGER, comment: '处理人ID' },
  handlerName: { type: DataTypes.STRING(50), comment: '处理人姓名' },
  handlerGroup: { type: DataTypes.STRING(50), comment: '处理组别' },
  assignedAt: { type: DataTypes.DATE, comment: '接单时间' },
  resolvedAt: { type: DataTypes.DATE, comment: '解决时间' },
  resolution: { type: DataTypes.TEXT, comment: '处理方案' },
  result: { type: DataTypes.STRING(500), comment: '处理结果' },
  rejectReason: { type: DataTypes.STRING(500), comment: '驳回原因' },
  pushMessageId: { type: DataTypes.INTEGER, comment: '推送消息ID' },
  timeliness: { type: DataTypes.TINYINT, defaultValue: 1, comment: '时效: 1正常/2即将超时/3已超时' },
  deadlineAt: { type: DataTypes.DATE, comment: '处理截止时间' },
  isArchived: { type: DataTypes.TINYINT, defaultValue: 0, comment: '是否已归档' },
  archivedAt: { type: DataTypes.DATE, comment: '归档时间' },
  operationBatch: { type: DataTypes.STRING(30), comment: '操作批次号' },
  category: { type: DataTypes.STRING(50), comment: '内容品类/业务分类' },
  tags: { type: DataTypes.JSON, comment: '标签' },
}, {
  tableName: 'feedback_records',
  indexes: [
    { fields: ['feedbackNo'], unique: true },
    { fields: ['userId'] },
    { fields: ['status'] },
    { fields: ['feedbackType'] },
    { fields: ['priority'] },
    { fields: ['handlerId'] },
    { fields: ['isArchived'] },
    { fields: ['createdAt'] },
  ],
  hooks: {
    beforeValidate: (record) => {
      if (!record.feedbackNo) {
        const d = new Date();
        const ds = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
        record.feedbackNo = `FBK_${ds}_${String(Math.floor(Math.random() * 9000) + 1000)}`;
      }
      if (!record.originalPriority && record.priority) {
        record.originalPriority = record.priority;
      }
      if (!record.deadlineAt && record.priority) {
        const hours = PRIORITY_TIMEOUT_HOURS[record.priority] || 72;
        record.deadlineAt = new Date(Date.now() + hours * 3600000);
      }
    },
  },
});

const FeedbackLog = sequelize.define('FeedbackLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  feedbackId: { type: DataTypes.INTEGER, allowNull: false, comment: '反馈记录ID' },
  feedbackNo: { type: DataTypes.STRING(30), allowNull: false, comment: '反馈单号' },
  action: { type: DataTypes.STRING(30), allowNull: false, comment: '操作: CREATED/ASSIGNED/PROCESSING/RESOLVED/REJECTED/ARCHIVED/URGENT/BATCH_CLOSED/PRIORITY_UPGRADED' },
  fromStatus: { type: DataTypes.TINYINT, comment: '变更前状态' },
  toStatus: { type: DataTypes.TINYINT, comment: '变更后状态' },
  fromPriority: { type: DataTypes.TINYINT, comment: '变更前优先级' },
  toPriority: { type: DataTypes.TINYINT, comment: '变更后优先级' },
  operatorId: { type: DataTypes.INTEGER, comment: '操作人ID' },
  operatorName: { type: DataTypes.STRING(50), comment: '操作人姓名' },
  remark: { type: DataTypes.STRING(500), comment: '操作备注' },
  operationBatch: { type: DataTypes.STRING(30), comment: '操作批次号' },
  ipAddress: { type: DataTypes.STRING(50), comment: '操作IP' },
}, {
  tableName: 'feedback_logs',
  indexes: [
    { fields: ['feedbackId'] },
    { fields: ['feedbackNo'] },
    { fields: ['action'] },
    { fields: ['createdAt'] },
  ],
});

const FeedbackArchive = sequelize.define('FeedbackArchive', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  feedbackId: { type: DataTypes.INTEGER, allowNull: false, comment: '原反馈ID' },
  feedbackNo: { type: DataTypes.STRING(30), allowNull: false, comment: '反馈单号' },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  uid: { type: DataTypes.STRING(50), allowNull: false },
  feedbackType: { type: DataTypes.STRING(20), allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT },
  source: { type: DataTypes.STRING(20) },
  priority: { type: DataTypes.TINYINT },
  originalPriority: { type: DataTypes.TINYINT },
  handlerId: { type: DataTypes.INTEGER },
  handlerName: { type: DataTypes.STRING(50) },
  resolution: { type: DataTypes.TEXT },
  result: { type: DataTypes.STRING(500) },
  rejectReason: { type: DataTypes.STRING(500) },
  assignedAt: { type: DataTypes.DATE },
  resolvedAt: { type: DataTypes.DATE },
  archivedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  archiveBatch: { type: DataTypes.STRING(30), comment: '归档批次号' },
  processingHours: { type: DataTypes.FLOAT, comment: '处理耗时(小时)' },
  tags: { type: DataTypes.JSON },
}, {
  tableName: 'feedback_archives',
  indexes: [
    { fields: ['feedbackId'] },
    { fields: ['feedbackNo'] },
    { fields: ['archivedAt'] },
  ],
});

FeedbackRecord.hasMany(FeedbackLog, { foreignKey: 'feedbackId', as: 'logs' });
FeedbackLog.belongsTo(FeedbackRecord, { foreignKey: 'feedbackId', as: 'feedback' });

module.exports = {
  FeedbackRecord, FeedbackLog, FeedbackArchive,
  FEEDBACK_TYPE, FEEDBACK_STATUS, FEEDBACK_PRIORITY, FEEDBACK_SOURCE,
  FEEDBACK_BATCH_ACTION, FEEDBACK_TIMELINESS, PRIORITY_TIMEOUT_HOURS,
};

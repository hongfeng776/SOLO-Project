const { DataTypes, Op, sequelize } = require('./_db');
const helpers = require('../utils/helpers');

const SEGMENT_DIMENSION = {
  PLAY: { value: 'PLAY', label: '播放行为', field: 'playDurationDays', unit: '天', desc: '近30天有播放行为的天数' },
  INTERACTION: { value: 'INTERACTION', label: '互动行为', field: 'interactionCount', unit: '次', desc: '近30天评论/点赞/分享总次数' },
  CONSUMPTION: { value: 'CONSUMPTION', label: '消费能力', field: 'consumptionAmount', unit: '元', desc: '近90天累计消费金额' },
  PUBLISH: { value: 'PUBLISH', label: '投稿产出', field: 'publishCount', unit: '篇', desc: '近30天有效投稿数量' },
  COMPOSITE: { value: 'COMPOSITE', label: '综合评分', field: 'compositeScore', unit: '分', desc: '多维度加权综合得分' },
};

const SEGMENT_LEVEL = {
  L1: { value: 1, label: '新手层', color: '#909399', type: 'info' },
  L2: { value: 2, label: '活跃层', color: '#67C23A', type: 'success' },
  L3: { value: 3, label: '成长层', color: '#409EFF', type: 'primary' },
  L4: { value: 4, label: '高价值层', color: '#E6A23C', type: 'warning' },
  L5: { value: 5, label: '核心VIP层', color: '#F56C6C', type: 'danger' },
};

const SEGMENT_RULE_STATUS = {
  DRAFT: { value: 1, label: '草稿', color: '#909399', type: 'info' },
  ACTIVE: { value: 2, label: '生效中', color: '#67C23A', type: 'success' },
  PAUSED: { value: 3, label: '已暂停', color: '#E6A23C', type: 'warning' },
  EXPIRED: { value: 4, label: '已过期', color: '#F56C6C', type: 'danger' },
};

const SEGMENT_CHANGE_TYPE = {
  AUTO: { value: 'AUTO', label: '自动迭代', color: '#409EFF', type: 'primary' },
  MANUAL_UP: { value: 'MANUAL_UP', label: '手动上调', color: '#67C23A', type: 'success' },
  MANUAL_DOWN: { value: 'MANUAL_DOWN', label: '手动下调', color: '#F56C6C', type: 'danger' },
  RULE_CHANGE: { value: 'RULE_CHANGE', label: '规则变更', color: '#909399', type: 'info' },
};

const STRATEGY_TRIGGER_MODE = {
  INSTANT: { value: 1, label: '即时生效', color: '#67C23A', type: 'success' },
  SCHEDULED: { value: 2, label: '定时生效', color: '#409EFF', type: 'primary' },
  RECURRING: { value: 3, label: '周期推送', color: '#909399', type: 'info' },
};

const STRATEGY_STATUS = {
  PENDING: { value: 1, label: '待生效', color: '#909399', type: 'info' },
  RUNNING: { value: 2, label: '执行中', color: '#67C23A', type: 'success' },
  COMPLETED: { value: 3, label: '已完成', color: '#409EFF', type: 'primary' },
  CANCELLED: { value: 4, label: '已取消', color: '#F56C6C', type: 'danger' },
};

const STRATEGY_TYPE = {
  BENEFIT: { value: 'BENEFIT', label: '专属权益', icon: 'Medal' },
  PUSH: { value: 'PUSH', label: '推送通知', icon: 'Bell' },
  WELFARE: { value: 'WELFARE', label: '福利配置', icon: 'Present' },
  GUIDE: { value: 'GUIDE', label: '引导任务', icon: 'Guide' },
};

const BENEFIT_TYPE = {
  VIP_DAY: { value: 'VIP_DAY', label: '会员天数', unit: '天' },
  COUPON: { value: 'COUPON', label: '优惠券', unit: '张' },
  CREDIT: { value: 'CREDIT', label: '积分奖励', unit: '分' },
  BADGE: { value: 'BADGE', label: '专属徽章', unit: '个' },
  CONTENT: { value: 'CONTENT', label: '内容解锁', unit: '项' },
  PRIORITY: { value: 'PRIORITY', label: '优先特权', unit: '项' },
};

const UserSegmentRule = sequelize.define('UserSegmentRule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ruleName: { type: DataTypes.STRING(100), allowNull: false, comment: '规则名称' },
  ruleCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, comment: '规则编码' },
  description: { type: DataTypes.STRING(500), comment: '规则描述' },
  dimension: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'COMPOSITE', comment: '分层维度：PLAY/INTERACTION/CONSUMPTION/PUBLISH/COMPOSITE' },
  thresholds: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: '分层阈值配置：[{level:L2, min:10, max:30}, ...]',
    defaultValue: [],
  },
  weights: { type: DataTypes.JSON, comment: '综合维度下的权重配置：{play:0.3, interaction:0.3, consumption:0.2, publish:0.2}' },
  targetUserType: { type: DataTypes.JSON, comment: '适用用户类型：[1,2,3]，空表示全部' },
  targetMinLevel: { type: DataTypes.INTEGER, comment: '适用最小账号等级' },
  autoCalcEnabled: { type: DataTypes.TINYINT, defaultValue: 1, comment: '是否开启每日自动迭代' },
  calcCron: { type: DataTypes.STRING(50), defaultValue: '0 0 2 * * ?', comment: '自动计算cron表达式' },
  lastCalcAt: { type: DataTypes.DATE, comment: '上次计算时间' },
  nextCalcAt: { type: DataTypes.DATE, comment: '下次计算时间' },
  status: { type: DataTypes.TINYINT, defaultValue: 1, comment: '状态：1草稿 2生效中 3已暂停 4已过期' },
  effectiveStartAt: { type: DataTypes.DATE, comment: '规则生效开始时间' },
  effectiveEndAt: { type: DataTypes.DATE, comment: '规则生效结束时间' },
  priority: { type: DataTypes.INTEGER, defaultValue: 0, comment: '优先级，数字越大优先级越高' },
  tagTemplate: { type: DataTypes.JSON, comment: '各层级对应标签配置：{L1:[...], L2:[...]}', defaultValue: {} },
  extraConfig: { type: DataTypes.JSON, comment: '扩展配置', defaultValue: {} },
  creatorId: { type: DataTypes.INTEGER },
  creatorName: { type: DataTypes.STRING(50) },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  deletedAt: { type: DataTypes.DATE },
}, {
  tableName: 'user_segment_rules',
  paranoid: true,
  indexes: [
    { fields: ['ruleCode'], unique: true },
    { fields: ['status'] },
    { fields: ['dimension'] },
  ],
});

const UserSegmentTag = sequelize.define('UserSegmentTag', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false, comment: '用户ID' },
  uid: { type: DataTypes.STRING(30), allowNull: false, comment: '用户UID' },
  ruleId: { type: DataTypes.INTEGER, comment: '适用规则ID' },
  ruleCode: { type: DataTypes.STRING(50), comment: '规则编码' },
  currentLevel: { type: DataTypes.TINYINT, allowNull: false, comment: '当前层级 1-5' },
  previousLevel: { type: DataTypes.TINYINT, comment: '上一层级' },
  tags: { type: DataTypes.JSON, comment: '分层标签列表', defaultValue: [] },
  behaviorSnapshot: { type: DataTypes.JSON, comment: '行为数据快照', defaultValue: {} },
  scoreSnapshot: { type: DataTypes.JSON, comment: '分层得分快照', defaultValue: {} },
  assignedAt: { type: DataTypes.DATE, comment: '分层时间' },
  changedAt: { type: DataTypes.DATE, comment: '层级变更时间' },
  changeType: { type: DataTypes.STRING(20), comment: '变更类型：AUTO/MANUAL_UP/MANUAL_DOWN/RULE_CHANGE' },
  expireAt: { type: DataTypes.DATE, comment: '分层过期时间，用于手动设置到期降级' },
  remark: { type: DataTypes.STRING(500) },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'user_segment_tags',
  indexes: [
    { fields: ['userId'], unique: true },
    { fields: ['uid'] },
    { fields: ['ruleId'] },
    { fields: ['currentLevel'] },
  ],
});

const UserSegmentLog = sequelize.define('UserSegmentLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  uid: { type: DataTypes.STRING(30), allowNull: false },
  ruleId: { type: DataTypes.INTEGER },
  ruleCode: { type: DataTypes.STRING(50) },
  fromLevel: { type: DataTypes.TINYINT },
  toLevel: { type: DataTypes.TINYINT, allowNull: false },
  changeType: { type: DataTypes.STRING(20), allowNull: false },
  operationBatch: { type: DataTypes.STRING(50), comment: '操作批次号' },
  operatorId: { type: DataTypes.INTEGER },
  operatorName: { type: DataTypes.STRING(50) },
  adjustReason: { type: DataTypes.STRING(500), comment: '手动调整原因' },
  adjustRemark: { type: DataTypes.STRING(1000) },
  behaviorSnapshot: { type: DataTypes.JSON, comment: '变更时行为快照', defaultValue: {} },
  appliedStrategies: { type: DataTypes.JSON, comment: '联动生效的策略ID列表', defaultValue: [] },
  ipAddress: { type: DataTypes.STRING(50) },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, {
  tableName: 'user_segment_logs',
  indexes: [
    { fields: ['userId'] },
    { fields: ['uid'] },
    { fields: ['operationBatch'] },
    { fields: ['changeType'] },
    { fields: ['ruleId'] },
  ],
});

const SegmentStrategy = sequelize.define('SegmentStrategy', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  strategyName: { type: DataTypes.STRING(100), allowNull: false, comment: '策略名称' },
  strategyType: { type: DataTypes.STRING(20), allowNull: false, comment: 'BENEFIT/PUSH/WELFARE/GUIDE' },
  strategyCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, comment: '策略编码' },
  description: { type: DataTypes.STRING(500) },
  targetLevels: { type: DataTypes.JSON, allowNull: false, comment: '目标层级列表 [2,3,4,5]', defaultValue: [] },
  targetMinActivity: { type: DataTypes.JSON, comment: '目标活跃度范围 [1,2,3]' },
  targetUserType: { type: DataTypes.JSON, comment: '目标用户类型 [1,2,3]' },
  targetMinConsumption: { type: DataTypes.DECIMAL(12, 2), comment: '最低消费能力' },
  targetUserIds: { type: DataTypes.JSON, comment: '指定用户ID列表（精确指定时生效）', defaultValue: [] },
  benefitConfig: { type: DataTypes.JSON, comment: '权益配置：{type, value, expireDays}', defaultValue: {} },
  pushConfig: { type: DataTypes.JSON, comment: '推送配置：{title, content, templateId, channels}', defaultValue: {} },
  welfareConfig: { type: DataTypes.JSON, comment: '福利配置：{type, value, conditions}', defaultValue: {} },
  guideConfig: { type: DataTypes.JSON, comment: '引导配置：{taskIds, rewards}', defaultValue: {} },
  triggerMode: { type: DataTypes.TINYINT, defaultValue: 1, comment: '触发方式：1即时 2定时 3周期' },
  triggerTime: { type: DataTypes.DATE, comment: '定时生效时间' },
  recurringCron: { type: DataTypes.STRING(50), comment: '周期推送Cron' },
  executeBatch: { type: DataTypes.STRING(50), comment: '执行批次号' },
  status: { type: DataTypes.TINYINT, defaultValue: 1, comment: '状态：1待生效 2执行中 3已完成 4已取消' },
  executedAt: { type: DataTypes.DATE, comment: '执行时间' },
  targetUserCount: { type: DataTypes.INTEGER, defaultValue: 0, comment: '目标用户数' },
  successCount: { type: DataTypes.INTEGER, defaultValue: 0, comment: '成功数量' },
  failedCount: { type: DataTypes.INTEGER, defaultValue: 0, comment: '失败数量' },
  matchResult: { type: DataTypes.JSON, comment: '匹配用户概览', defaultValue: {} },
  extraConfig: { type: DataTypes.JSON, comment: '扩展配置', defaultValue: {} },
  creatorId: { type: DataTypes.INTEGER },
  creatorName: { type: DataTypes.STRING(50) },
  approverId: { type: DataTypes.INTEGER },
  approverName: { type: DataTypes.STRING(50) },
  approvedAt: { type: DataTypes.DATE },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  deletedAt: { type: DataTypes.DATE },
}, {
  tableName: 'segment_strategies',
  paranoid: true,
  indexes: [
    { fields: ['strategyCode'], unique: true },
    { fields: ['status'] },
    { fields: ['strategyType'] },
    { fields: ['triggerMode'] },
  ],
});

UserSegmentRule.hasMany(UserSegmentTag, { foreignKey: 'ruleId', as: 'tags' });
UserSegmentRule.hasMany(SegmentStrategy, { foreignKey: 'ruleId', as: 'strategies' });
UserSegmentTag.hasMany(UserSegmentLog, { foreignKey: 'userId', sourceKey: 'userId', as: 'logs', constraints: false });

const STATIC_ENUMS = {
  SEGMENT_DIMENSION, SEGMENT_LEVEL, SEGMENT_RULE_STATUS, SEGMENT_CHANGE_TYPE,
  STRATEGY_TRIGGER_MODE, STRATEGY_STATUS, STRATEGY_TYPE, BENEFIT_TYPE,
};

UserSegmentRule.beforeValidate(async (rule) => {
  if (!rule.ruleCode) {
    rule.ruleCode = 'SEG_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
});

SegmentStrategy.beforeValidate(async (strategy) => {
  if (!strategy.strategyCode) {
    strategy.strategyCode = 'STS_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
});

module.exports = {
  UserSegmentRule, UserSegmentTag, UserSegmentLog, SegmentStrategy,
  ...STATIC_ENUMS,
  STATIC_ENUMS,
  ...helpers.generateStaticExports(STATIC_ENUMS),
};

export * from './businessCode'

export const CHANNEL_TYPE_OPTIONS = [
  { label: '微信', value: 'wechat' },
  { label: '抖音', value: 'douyin' },
  { label: '快手', value: 'kuaishou' },
  { label: '小红书', value: 'xiaohongshu' },
  { label: '微博', value: 'weibo' },
  { label: '其他', value: 'other' },
] as const

export const PROMOTER_LEVEL_OPTIONS = [
  { label: 'L1 初级', value: 1 },
  { label: 'L2 中级', value: 2 },
  { label: 'L3 高级', value: 3 },
  { label: 'L4 金牌', value: 4 },
  { label: 'L5 钻石', value: 5 },
] as const

export const PROMOTER_LEVEL_MAP: Record<number, { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  1: { label: 'L1 初级', type: 'info' },
  2: { label: 'L2 中级', type: 'primary' },
  3: { label: 'L3 高级', type: 'success' },
  4: { label: 'L4 金牌', type: 'warning' },
  5: { label: 'L5 钻石', type: 'danger' },
}

export const PROMOTER_STATUS_OPTIONS = [
  { label: '正常', value: 1, type: 'success' },
  { label: '审核中', value: 2, type: 'primary' },
  { label: '冻结', value: 0, type: 'warning' },
  { label: '注销', value: -1, type: 'danger' },
  { label: '已拒绝', value: -2, type: 'danger' },
] as const

export const PROMOTER_STATUS_MAP: Record<number, { label: string; type: 'success' | 'warning' | 'danger' | 'info' | 'primary' }> = {
  1: { label: '正常', type: 'success' },
  2: { label: '审核中', type: 'primary' },
  0: { label: '冻结', type: 'warning' },
  '-1': { label: '注销', type: 'danger' },
  '-2': { label: '已拒绝', type: 'danger' },
}

export const ORDER_STATUS_OPTIONS = [
  { label: '待支付', value: 0, type: 'info' },
  { label: '已支付', value: 1, type: 'primary' },
  { label: '已发货', value: 2, type: 'warning' },
  { label: '已完成', value: 3, type: 'success' },
  { label: '已取消', value: 4, type: 'info' },
  { label: '退款中', value: 5, type: 'warning' },
  { label: '已退款', value: 6, type: 'danger' },
] as const

export const ORDER_STATUS_MAP: Record<number, { label: string; type: 'success' | 'danger' | 'warning' | 'info' | 'primary' }> = {
  0: { label: '待支付', type: 'info' },
  1: { label: '已支付', type: 'primary' },
  2: { label: '已发货', type: 'warning' },
  3: { label: '已完成', type: 'success' },
  4: { label: '已取消', type: 'info' },
  5: { label: '退款中', type: 'warning' },
  6: { label: '已退款', type: 'danger' },
}

export const COMMISSION_STATUS_OPTIONS = [
  { label: '待结算', value: 0, type: 'info' },
  { label: '结算中', value: 1, type: 'warning' },
  { label: '已结算', value: 2, type: 'success' },
  { label: '已提现', value: 3, type: 'primary' },
  { label: '已扣除', value: 4, type: 'danger' },
] as const

export const COMMISSION_STATUS_MAP: Record<number, { label: string; type: 'success' | 'danger' | 'warning' | 'info' | 'primary' }> = {
  0: { label: '待结算', type: 'info' },
  1: { label: '结算中', type: 'warning' },
  2: { label: '已结算', type: 'success' },
  3: { label: '已提现', type: 'primary' },
  4: { label: '已扣除', type: 'danger' },
}

export const MARKETING_TYPE_OPTIONS = [
  { label: '优惠券', value: 'coupon' },
  { label: '折扣', value: 'discount' },
  { label: '返现', value: 'cashback' },
  { label: '返利', value: 'rebate' },
  { label: '奖励金', value: 'bonus' },
] as const

export const MARKETING_TYPE_MAP: Record<string, { label: string }> = {
  coupon: { label: '优惠券' },
  discount: { label: '折扣' },
  cashback: { label: '返现' },
  rebate: { label: '返利' },
  bonus: { label: '奖励金' },
}

export const MARKETING_STATUS_OPTIONS = [
  { label: '草稿', value: 0, type: 'info' },
  { label: '进行中', value: 1, type: 'success' },
  { label: '已结束', value: 2, type: 'warning' },
  { label: '已取消', value: 3, type: 'danger' },
] as const

export const MARKETING_STATUS_MAP: Record<number, { label: string; type: 'success' | 'danger' | 'warning' | 'info' }> = {
  0: { label: '草稿', type: 'info' },
  1: { label: '进行中', type: 'success' },
  2: { label: '已结束', type: 'warning' },
  3: { label: '已取消', type: 'danger' },
}

export const WITHDRAW_STATUS_OPTIONS = [
  { label: '待审核', value: 0, type: 'warning' },
  { label: '审核通过', value: 1, type: 'primary' },
  { label: '审核拒绝', value: 2, type: 'danger' },
  { label: '打款中', value: 3, type: 'warning' },
  { label: '打款成功', value: 4, type: 'success' },
  { label: '打款失败', value: 5, type: 'danger' },
  { label: '已取消', value: 6, type: 'info' },
] as const

export const WITHDRAW_STATUS_MAP: Record<number, { label: string; type: 'success' | 'danger' | 'warning' | 'info' | 'primary' }> = {
  0: { label: '待审核', type: 'warning' },
  1: { label: '审核通过', type: 'primary' },
  2: { label: '审核拒绝', type: 'danger' },
  3: { label: '打款中', type: 'warning' },
  4: { label: '打款成功', type: 'success' },
  5: { label: '打款失败', type: 'danger' },
  6: { label: '已取消', type: 'info' },
}

export const WITHDRAW_METHOD_OPTIONS = [
  { label: '微信', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '银行卡', value: 'bank' },
] as const

export const WITHDRAW_METHOD_MAP: Record<string, { label: string }> = {
  wechat: { label: '微信' },
  alipay: { label: '支付宝' },
  bank: { label: '银行卡' },
}

export const PERMISSION_TYPE_OPTIONS = [
  { label: '目录', value: 'directory' },
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
] as const

export const PERMISSION_TYPE_MAP: Record<string, { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  directory: { label: '目录', type: 'primary' },
  menu: { label: '菜单', type: 'success' },
  button: { label: '按钮', type: 'warning' },
}

export const STATUS_OPTIONS = [
  { label: '启用', value: 1, type: 'success' },
  { label: '禁用', value: 0, type: 'danger' },
] as const

export const STATUS_MAP: Record<number | string, { label: string; type: 'success' | 'danger' | 'warning' | 'info' }> = {
  1: { label: '启用', type: 'success' },
  0: { label: '禁用', type: 'danger' },
  enable: { label: '启用', type: 'success' },
  disable: { label: '禁用', type: 'danger' },
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export const DEFAULT_PAGE_SIZE = 20

export const POSITION_LEVEL_OPTIONS = [
  { label: '超级管理员', value: 1 },
  { label: '系统管理员', value: 3 },
  { label: '运营经理', value: 5 },
  { label: '运营操作员', value: 7 },
  { label: '只读用户', value: 9 },
]

export const POSITION_LEVEL_MAP: Record<number, { label: string; color: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  1: { label: '超级管理员', color: 'danger' },
  3: { label: '系统管理员', color: 'warning' },
  5: { label: '运营经理', color: 'primary' },
  7: { label: '运营操作员', color: 'success' },
  9: { label: '只读用户', color: 'info' },
}

export const USER_ROLE_OPTIONS = [
  { label: '超级管理员', value: 'admin' },
  { label: '普通管理员', value: 'user' },
  { label: '访客', value: 'guest' },
]

export const USER_ROLE_MAP: Record<string, string> = {
  admin: '超级管理员',
  user: '普通管理员',
  guest: '访客',
}

export const ROLE_LEVEL_OPTIONS = [
  { label: '超级管理员', value: 1, color: 'danger' },
  { label: '系统管理员', value: 3, color: 'warning' },
  { label: '运营经理', value: 5, color: 'primary' },
  { label: '运营操作员', value: 7, color: 'success' },
  { label: '只读用户', value: 9, color: 'info' },
] as const

export const ROLE_LEVEL_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '超级管理员', color: 'danger' },
  3: { label: '系统管理员', color: 'warning' },
  5: { label: '运营经理', color: 'primary' },
  7: { label: '运营操作员', color: 'success' },
  9: { label: '只读用户', color: 'info' },
}

export const ROLE_SCENARIO_OPTIONS = [
  { label: '渠道运营', value: 'channel_operation' },
  { label: '推客管理', value: 'promoter_management' },
  { label: '订单审核', value: 'order_audit' },
  { label: '财务结算', value: 'financial_settlement' },
  { label: '营销策划', value: 'marketing' },
  { label: '数据查看', value: 'data_view' },
  { label: '系统运维', value: 'system_ops' },
  { label: '全功能权限', value: 'full_access' },
] as const

export const ROLE_SCENARIO_MAP: Record<string, string> = {
  channel_operation: '渠道运营',
  promoter_management: '推客管理',
  order_audit: '订单审核',
  financial_settlement: '财务结算',
  marketing: '营销策划',
  data_view: '数据查看',
  system_ops: '系统运维',
  full_access: '全功能权限',
}

export const PERMISSION_MODULE_OPTIONS = [
  { label: '数据看板', value: 'dashboard' },
  { label: '系统管理', value: 'system' },
  { label: '渠道管理', value: 'channel' },
  { label: '推客管理', value: 'promoter' },
  { label: '订单管理', value: 'order' },
  { label: '佣金管理', value: 'commission' },
  { label: '营销管理', value: 'marketing' },
  { label: '提现管理', value: 'withdraw' },
  { label: '日志管理', value: 'log' },
]
export const PERMISSION_MODULE_MAP: Record<string, string> = {
  dashboard: '数据看板',
  system: '系统管理',
  channel: '渠道管理',
  promoter: '推客管理',
  order: '订单管理',
  commission: '佣金管理',
  marketing: '营销管理',
  withdraw: '提现管理',
  log: '日志管理',
}
export const PERMISSION_LEVEL_OPTIONS = [
  { label: '一级菜单', value: 1 },
  { label: '二级菜单', value: 2 },
  { label: '三级菜单', value: 3 },
]
export const VISIBLE_RANGE_OPTIONS = [
  { label: '全部角色可见', value: 'all' },
  { label: '超级管理员可见', value: 'admin' },
  { label: '运营团队可见', value: 'manager' },
  { label: '仅指定角色可见', value: 'custom' },
]

export const CHANGE_TARGET_TYPE_OPTIONS = [
  { label: '角色', value: 'role' },
  { label: '权限菜单', value: 'permission' },
  { label: '用户', value: 'user' },
] as const

export const CHANGE_TARGET_TYPE_MAP: Record<string, string> = {
  role: '角色',
  permission: '权限菜单',
  user: '用户',
}

export const CHANGE_ACTION_OPTIONS = [
  { label: '创建', value: 'create', type: 'success' },
  { label: '编辑', value: 'update', type: 'primary' },
  { label: '删除', value: 'delete', type: 'danger' },
  { label: '批量分配', value: 'batch_assign', type: 'warning' },
  { label: '批量撤销', value: 'batch_revoke', type: 'danger' },
  { label: '批量复制', value: 'batch_copy', type: 'info' },
] as const

export const CHANGE_ACTION_MAP: Record<string, { label: string; type: string }> = {
  create: { label: '创建', type: 'success' },
  update: { label: '编辑', type: 'primary' },
  delete: { label: '删除', type: 'danger' },
  batch_assign: { label: '批量分配', type: 'warning' },
  batch_revoke: { label: '批量撤销', type: 'danger' },
  batch_copy: { label: '批量复制', type: 'info' },
}

export const EXPORT_FIELD_OPTIONS = [
  { label: '操作人', value: 'operatorName' },
  { label: '目标类型', value: 'targetType' },
  { label: '目标名称', value: 'targetName' },
  { label: '操作类型', value: 'action' },
  { label: '所属模块', value: 'module' },
  { label: '变更原因', value: 'reason' },
  { label: '影响账号数', value: 'affectedUserCount' },
  { label: 'IP地址', value: 'ip' },
  { label: '操作时间', value: 'createdAt' },
]

export const SORT_FIELD_OPTIONS = [
  { label: '操作时间', value: 'createdAt' },
  { label: '操作人', value: 'operatorName' },
  { label: '目标名称', value: 'targetName' },
  { label: '影响账号数', value: 'affectedUserCount' },
]

export const ANOMALY_THRESHOLD_OPTIONS = [
  { label: '10分钟≥20次', value: { window: 10, threshold: 20 } },
  { label: '5分钟≥15次', value: { window: 5, threshold: 15 } },
  { label: '30分钟≥50次', value: { window: 30, threshold: 50 } },
  { label: '1小时≥100次', value: { window: 60, threshold: 100 } },
]

export enum AuditStage {
  PENDING_SUBMIT = 0,
  FIRST_AUDIT = 1,
  SECOND_AUDIT = 2,
  COMPLETED = 3,
  REJECTED = -1,
}

export enum AuditStatus {
  PENDING = 'pending',
  FIRST_AUDITING = 'first_auditing',
  FIRST_PASSED = 'first_passed',
  SECOND_AUDITING = 'second_auditing',
  PASSED = 'passed',
  REJECTED = 'rejected',
  BLACKLISTED = 'blacklisted',
  LOCKED = 'locked',
}

export const AUDIT_STAGE_OPTIONS = [
  { label: '待提交', value: 0, type: 'info' },
  { label: '初审中', value: 1, type: 'primary' },
  { label: '复审中', value: 2, type: 'warning' },
  { label: '审核完成', value: 3, type: 'success' },
  { label: '已驳回', value: -1, type: 'danger' },
] as const

export const AUDIT_STAGE_MAP: Record<number, { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  0: { label: '待提交', type: 'info' },
  1: { label: '初审中', type: 'primary' },
  2: { label: '复审中', type: 'warning' },
  3: { label: '审核完成', type: 'success' },
  '-1': { label: '已驳回', type: 'danger' },
}

export const AUDIT_STATUS_OPTIONS = [
  { label: '待处理', value: 'pending', type: 'info' },
  { label: '初审中', value: 'first_auditing', type: 'primary' },
  { label: '初审通过', value: 'first_passed', type: 'success' },
  { label: '复审中', value: 'second_auditing', type: 'warning' },
  { label: '审核通过', value: 'passed', type: 'success' },
  { label: '已驳回', value: 'rejected', type: 'danger' },
  { label: '黑名单', value: 'blacklisted', type: 'danger' },
  { label: '锁定中', value: 'locked', type: 'warning' },
] as const

export const AUDIT_STATUS_MAP: Record<string, { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  pending: { label: '待处理', type: 'info' },
  first_auditing: { label: '初审中', type: 'primary' },
  first_passed: { label: '初审通过', type: 'success' },
  second_auditing: { label: '复审中', type: 'warning' },
  passed: { label: '审核通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  blacklisted: { label: '黑名单', type: 'danger' },
  locked: { label: '锁定中', type: 'warning' },
}

export const AUDIT_TAB_OPTIONS = [
  { label: '待初审', value: 'first', auditStageList: [1], auditStatusList: ['first_auditing'] },
  { label: '待复审', value: 'second', auditStageList: [2], auditStatusList: ['second_auditing'] },
  { label: '已驳回', value: 'rejected', auditStageList: [-1], auditStatusList: ['rejected'] },
  { label: '已通过', value: 'passed', auditStageList: [3], auditStatusList: ['passed'] },
  { label: '全部', value: 'all', auditStageList: undefined, auditStatusList: undefined },
] as const

export const REJECT_REASON_OPTIONS = [
  { code: 'incomplete_info', label: '申请信息不完整' },
  { code: 'invalid_phone', label: '手机号无效或已被使用' },
  { code: 'invalid_id_card', label: '身份证信息不合规' },
  { code: 'blacklist_match', label: '匹配黑名单记录' },
  { code: 'fraud_risk', label: '存在欺诈风险' },
  { code: 'duplicate_apply', label: '重复提交申请' },
  { code: 'data_tampered', label: '申请信息存在篡改痕迹' },
  { code: 'other', label: '其他原因' },
] as const

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  submit: '提交申请',
  first_pass: '初审通过',
  first_reject: '初审驳回',
  second_pass: '复审通过',
  second_reject: '复审驳回',
  rollback: '回退状态',
  blacklist_block: '黑名单拦截',
}

export const LOCK_WINDOW_DAYS_OPTIONS = [
  { label: '1天', value: 1 },
  { label: '3天', value: 3 },
  { label: '7天', value: 7 },
  { label: '15天', value: 15 },
  { label: '30天', value: 30 },
]

export const VERIFY_STATUS_OPTIONS = [
  { value: 0, label: '未认证', type: 'info' },
  { value: 1, label: '认证中', type: 'warning' },
  { value: 2, label: '已认证', type: 'success' },
  { value: -1, label: '已驳回', type: 'danger' },
] as const

export const VERIFY_STATUS_MAP: Record<number, { label: string; type: string }> = {
  0: { label: '未认证', type: 'info' },
  1: { label: '认证中', type: 'warning' },
  2: { label: '已认证', type: 'success' },
  '-1': { label: '已驳回', type: 'danger' },
}

export const QUALIFICATION_TYPE_OPTIONS = [
  { value: 'id_card', label: '身份证' },
  { value: 'business_license', label: '营业执照' },
  { value: 'agency_agreement', label: '代理协议' },
  { value: 'other', label: '其他' },
] as const

export const QUALIFICATION_TYPE_MAP: Record<string, string> = {
  id_card: '身份证',
  business_license: '营业执照',
  agency_agreement: '代理协议',
  other: '其他',
}

export const PROMOTE_STATUS_OPTIONS = [
  { value: 1, label: '正常推广', type: 'success' },
  { value: 0, label: '推广受限', type: 'warning' },
  { value: -1, label: '禁止推广', type: 'danger' },
]

export const PROMOTE_STATUS_MAP: Record<number, { label: string; type: string }> = {
  1: { label: '正常推广', type: 'success' },
  0: { label: '推广受限', type: 'warning' },
  '-1': { label: '禁止推广', type: 'danger' },
}

export const SETTLE_STATUS_OPTIONS = [
  { value: 1, label: '结算正常', type: 'success' },
  { value: 0, label: '结算冻结', type: 'warning' },
  { value: -1, label: '结算关闭', type: 'danger' },
]

export const SETTLE_STATUS_MAP: Record<number, { label: string; type: string }> = {
  1: { label: '结算正常', type: 'success' },
  0: { label: '结算冻结', type: 'warning' },
  '-1': { label: '结算关闭', type: 'danger' },
}

export const CHANGE_TYPE_OPTIONS = [
  { value: 'update', label: '信息修改', type: '' },
  { value: 'batch_update', label: '批量修改', type: '' },
  { value: 'level_up', label: '等级升级', type: 'success' },
  { value: 'level_down', label: '等级降级', type: 'warning' },
  { value: 'status_change', label: '状态变更', type: '' },
]

export const PROMOTER_TAB_OPTIONS = [
  { value: 'list', label: '推客列表', icon: 'List' },
  { value: 'edit', label: '编辑管控', icon: 'Edit' },
  { value: 'qualification', label: '资质审核', icon: 'Document' },
  { value: 'batch', label: '批量操作', icon: 'Operation' },
  { value: 'trace', label: '变更溯源', icon: 'Connection' },
] as const

export const LEVEL_RULE_THRESHOLDS = {
  L1: { minMonthlyAmount: 0, minMonthlyOrders: 0, minActiveDays: 0, minReputationScore: 0 },
  L2: { minMonthlyAmount: 10000, minMonthlyOrders: 50, minActiveDays: 10, minReputationScore: 90 },
  L3: { minMonthlyAmount: 50000, minMonthlyOrders: 200, minActiveDays: 20, minReputationScore: 95 },
  L4: { minMonthlyAmount: 200000, minMonthlyOrders: 800, minActiveDays: 25, minReputationScore: 97 },
  L5: { minMonthlyAmount: 1000000, minMonthlyOrders: 3000, minActiveDays: 28, minReputationScore: 99 },
}

export const MANUAL_ADJUST_STATUS_OPTIONS = [
  { value: 0, label: '待审核', type: 'warning' },
  { value: 1, label: '已通过', type: 'success' },
  { value: -1, label: '已驳回', type: 'danger' },
] as const

export const MANUAL_ADJUST_STATUS_MAP: Record<number, { label: string; type: string }> = {
  0: { label: '待审核', type: 'warning' },
  1: { label: '已通过', type: 'success' },
  '-1': { label: '已驳回', type: 'danger' },
}

export const LEVEL_CHANGE_SOURCE_OPTIONS = [
  { value: 'auto', label: '自动评级', type: 'primary' },
  { value: 'manual', label: '手动调整', type: 'warning' },
  { value: 'batch', label: '批量重置', type: 'info' },
  { value: 'rule_change', label: '规则变更', type: '' },
]

export const LEVEL_CHANGE_SOURCE_MAP: Record<string, { label: string; type: string }> = {
  auto: { label: '自动评级', type: 'primary' },
  manual: { label: '手动调整', type: 'warning' },
  batch: { label: '批量重置', type: 'info' },
  rule_change: { label: '规则变更', type: '' },
}

export const LOW_PERFORMANCE_THRESHOLD = {
  minOrders: 10,
  minAmount: 5000,
}

export const PROMOTER_LEVEL_SYSTEM_TABS = [
  { value: 'rules', label: '等级规则', icon: 'Setting' },
  { value: 'adjust', label: '手动调整', icon: 'Promotion' },
  { value: 'batch', label: '批量重评', icon: 'Operation' },
  { value: 'trace', label: '变更溯源', icon: 'Connection' },
] as const

export const RISK_LEVEL_OPTIONS = [
  { value: 'mild', label: '轻度风控', type: 'warning', color: '#e6a23c' },
  { value: 'moderate', label: '中度风控', type: 'danger', color: '#f56c6c' },
  { value: 'severe', label: '重度风控', type: 'danger', color: '#c0392b' },
] as const

export const RISK_LEVEL_MAP: Record<string, { label: string; type: string; color: string }> = {
  mild: { label: '轻度风控', type: 'warning', color: '#e6a23c' },
  moderate: { label: '中度风控', type: 'danger', color: '#f56c6c' },
  severe: { label: '重度风控', type: 'danger', color: '#c0392b' },
}

export const RISK_TYPE_OPTIONS = [
  { value: 'abnormal_promotion', label: '异常推广' },
  { value: 'brush_order', label: '刷单' },
  { value: 'fake_order', label: '虚假订单' },
  { value: 'complaint', label: '投诉举报' },
  { value: 'fraud', label: '欺诈风险' },
  { value: 'other', label: '其他' },
] as const

export const RISK_TYPE_MAP: Record<string, string> = {
  abnormal_promotion: '异常推广',
  brush_order: '刷单',
  fake_order: '虚假订单',
  complaint: '投诉举报',
  fraud: '欺诈风险',
  other: '其他',
}

export const RISK_CONTROL_STATUS_OPTIONS = [
  { value: 0, label: '正常', type: 'success' },
  { value: 1, label: '轻度风控', type: 'warning' },
  { value: 2, label: '中度风控', type: 'danger' },
  { value: 3, label: '重度风控', type: 'danger' },
]

export const RISK_CONTROL_STATUS_MAP: Record<number, { label: string; type: string }> = {
  0: { label: '正常', type: 'success' },
  1: { label: '轻度风控', type: 'warning' },
  2: { label: '中度风控', type: 'danger' },
  3: { label: '重度风控', type: 'danger' },
}

export const RISK_RELEASE_STATUS_OPTIONS = [
  { value: 0, label: '待审核', type: 'warning' },
  { value: 1, label: '已通过', type: 'success' },
  { value: -1, label: '已驳回', type: 'danger' },
] as const

export const RISK_RELEASE_STATUS_MAP: Record<number, { label: string; type: string }> = {
  0: { label: '待审核', type: 'warning' },
  1: { label: '已通过', type: 'success' },
  '-1': { label: '已驳回', type: 'danger' },
}

export const RISK_WARNING_LEVEL_OPTIONS = [
  { value: 'low', label: '低危', type: 'info' },
  { value: 'medium', label: '中危', type: 'warning' },
  { value: 'high', label: '高危', type: 'danger' },
] as const

export const RISK_WARNING_LEVEL_MAP: Record<string, { label: string; type: string }> = {
  low: { label: '低危', type: 'info' },
  medium: { label: '中危', type: 'warning' },
  high: { label: '高危', type: 'danger' },
}

export const RISK_RELEASE_STAGES = ['提交申请', '材料核验', '问题整改', '权限恢复1级', '权限恢复2级', '完全恢复'] as const

export const RISK_PERMISSION_LABELS: Record<string, string> = {
  canPromote: '推广权限',
  canJoinActivity: '活动参与',
  canWithdraw: '提现权限',
  canLogin: '登录权限',
}

export const HIGH_FREQUENCY_THRESHOLD = {
  riskCountIn30Days: 3,
  abnormalOrdersIn7Days: 10,
  complaintCountIn30Days: 2,
}

export const PROMOTER_RISK_TABS = [
  { value: 'control', label: '风险管控', icon: 'WarningFilled' },
  { value: 'release', label: '解除申请', icon: 'CircleCheck' },
  { value: 'batch', label: '批量处理', icon: 'Operation' },
  { value: 'trace', label: '行为溯源', icon: 'Connection' },
] as const

export const CHANNEL_AUDIT_STAGE_OPTIONS = [
  { label: '待提交', value: 0, type: 'info' },
  { label: '资料初审', value: 1, type: 'primary' },
  { label: '资质核验', value: 2, type: 'warning' },
  { label: '权限开通', value: 3, type: 'success' },
  { label: '审核完成', value: 4, type: 'success' },
  { label: '已驳回', value: -1, type: 'danger' },
] as const

export const CHANNEL_AUDIT_STAGE_MAP: Record<number, { label: string; type: string }> = {
  0: { label: '待提交', type: 'info' },
  1: { label: '资料初审', type: 'primary' },
  2: { label: '资质核验', type: 'warning' },
  3: { label: '权限开通', type: 'success' },
  4: { label: '审核完成', type: 'success' },
  '-1': { label: '已驳回', type: 'danger' },
}

export const CHANNEL_AUDIT_STATUS_OPTIONS = [
  { label: '待处理', value: 'pending', type: 'info' },
  { label: '资料初审中', value: 'data_auditing', type: 'primary' },
  { label: '资料初审通过', value: 'data_passed', type: 'success' },
  { label: '资质核验中', value: 'qualification_auditing', type: 'warning' },
  { label: '资质核验通过', value: 'qualification_passed', type: 'success' },
  { label: '权限开通中', value: 'permission_auditing', type: 'warning' },
  { label: '审核通过', value: 'passed', type: 'success' },
  { label: '已驳回', value: 'rejected', type: 'danger' },
  { label: '黑名单', value: 'blacklisted', type: 'danger' },
  { label: '锁定中', value: 'locked', type: 'warning' },
] as const

export const CHANNEL_AUDIT_STATUS_MAP: Record<string, { label: string; type: string }> = {
  pending: { label: '待处理', type: 'info' },
  data_auditing: { label: '资料初审中', type: 'primary' },
  data_passed: { label: '资料初审通过', type: 'success' },
  qualification_auditing: { label: '资质核验中', type: 'warning' },
  qualification_passed: { label: '资质核验通过', type: 'success' },
  permission_auditing: { label: '权限开通中', type: 'warning' },
  passed: { label: '审核通过', type: 'success' },
  rejected: { label: '已驳回', type: 'danger' },
  blacklisted: { label: '黑名单', type: 'danger' },
  locked: { label: '锁定中', type: 'warning' },
}

export const CHANNEL_AUDIT_TAB_OPTIONS = [
  { label: '待资料初审', value: 'data', auditStageList: [1], auditStatusList: ['data_auditing'] },
  { label: '待资质核验', value: 'qualification', auditStageList: [2], auditStatusList: ['qualification_auditing'] },
  { label: '待权限开通', value: 'permission', auditStageList: [3], auditStatusList: ['permission_auditing'] },
  { label: '已驳回', value: 'rejected', auditStageList: [-1], auditStatusList: ['rejected'] },
  { label: '已通过', value: 'passed', auditStageList: [4], auditStatusList: ['passed'] },
  { label: '全部', value: 'all', auditStageList: undefined, auditStatusList: undefined },
] as const

export const CHANNEL_REJECT_ISSUE_OPTIONS = [
  { code: 'missing_docs', label: '资料缺失' },
  { code: 'expired_qualification', label: '资质过期' },
  { code: 'false_info', label: '信息虚假' },
  { code: 'invalid_contact', label: '联系方式无效' },
  { code: 'duplicate_subject', label: '合作主体重复' },
  { code: 'blacklist_match', label: '匹配黑名单' },
  { code: 'credit_abnormal', label: '企业征信异常' },
  { code: 'other', label: '其他问题' },
] as const

export const CHANNEL_PRIORITY_OPTIONS = [
  { label: '普通渠道', value: 0, type: 'info' },
  { label: '重要渠道', value: 1, type: 'warning' },
  { label: '重点合作', value: 2, type: 'danger' },
] as const

export const CHANNEL_PRIORITY_MAP: Record<number, { label: string; type: string }> = {
  0: { label: '普通渠道', type: 'info' },
  1: { label: '重要渠道', type: 'warning' },
  2: { label: '重点合作', type: 'danger' },
}

export const CHANNEL_LOCK_DAYS_OPTIONS = [
  { label: '1天', value: 1 },
  { label: '3天', value: 3 },
  { label: '7天', value: 7 },
  { label: '15天', value: 15 },
  { label: '30天', value: 30 },
]

export const CHANNEL_AUDIT_ACTION_LABELS: Record<string, string> = {
  submit: '提交申请',
  data_pass: '资料初审通过',
  data_reject: '资料初审驳回',
  qualification_pass: '资质核验通过',
  qualification_reject: '资质核验驳回',
  permission_pass: '权限开通',
  permission_reject: '权限开通驳回',
  blacklist_block: '黑名单拦截',
}

export const CHANNEL_AUDIT_STAGES = [
  { key: 1, label: '资料初审', description: '审核渠道基本资料完整性' },
  { key: 2, label: '资质核验', description: '核验渠道资质文件有效性' },
  { key: 3, label: '权限开通', description: '开通渠道合作权限' },
] as const

export const CHANNEL_LEVEL_OPTIONS = [
  { label: '星级渠道', value: 'STAR', type: 'info' },
  { label: '铜牌渠道', value: 'BRONZE', type: '' },
  { label: '银牌渠道', value: 'SILVER', type: 'primary' },
  { label: '金牌渠道', value: 'GOLD', type: 'warning' },
  { label: '铂金渠道', value: 'PLATINUM', type: 'success' },
  { label: '钻石渠道', value: 'DIAMOND', type: 'danger' },
] as const

export const CHANNEL_LEVEL_MAP: Record<string, { label: string; type: string }> = {
  STAR: { label: '星级渠道', type: 'info' },
  BRONZE: { label: '铜牌渠道', type: '' },
  SILVER: { label: '银牌渠道', type: 'primary' },
  GOLD: { label: '金牌渠道', type: 'warning' },
  PLATINUM: { label: '铂金渠道', type: 'success' },
  DIAMOND: { label: '钻石渠道', type: 'danger' },
}

export const CHANNEL_LEVEL_ORDER: string[] = ['STAR', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND']

export const CHANNEL_GRADE_TAB_OPTIONS = [
  { value: 'rules', label: '分级规则', icon: 'Setting' },
  { value: 'adjust', label: '等级调整', icon: 'Promotion' },
  { value: 'batch', label: '批量操作', icon: 'Operation' },
  { value: 'trace', label: '变更溯源', icon: 'Connection' },
] as const

export const CHANNEL_GRADE_CHANGE_SOURCE_OPTIONS = [
  { value: 'auto_evaluate', label: '系统自动评级', type: 'primary' },
  { value: 'manual_adjust', label: '人工手动调整', type: 'warning' },
  { value: 'batch_adjust', label: '批量调整', type: 'info' },
  { value: 'rule_change', label: '规则变更触发', type: '' },
]

export const CHANNEL_GRADE_CHANGE_SOURCE_MAP: Record<string, { label: string; type: string }> = {
  auto_evaluate: { label: '系统自动评级', type: 'primary' },
  manual_adjust: { label: '人工手动调整', type: 'warning' },
  batch_adjust: { label: '批量调整', type: 'info' },
  rule_change: { label: '规则变更触发', type: '' },
}

export const CHANNEL_GRADE_ADJUST_STATUS_OPTIONS = [
  { value: 0, label: '待审批', type: 'warning' },
  { value: 1, label: '已通过', type: 'success' },
  { value: -1, label: '已拒绝', type: 'danger' },
] as const

export const CHANNEL_GRADE_ADJUST_STATUS_MAP: Record<number, { label: string; type: string }> = {
  0: { label: '待审批', type: 'warning' },
  1: { label: '已通过', type: 'success' },
  '-1': { label: '已拒绝', type: 'danger' },
}

export const CHANNEL_GRADE_THRESHOLD_LABELS: Record<string, string> = {
  minMonthlyAmount: '渠道体量',
  minMonthlyOrders: '订单量',
  minCooperationMonths: '合作时长',
  minFulfillmentRate: '履约质量',
  minPromotionScore: '推广能力',
}

export const RESOURCE_SUPPORT_LEVEL_OPTIONS = [
  { label: '无', value: 0 },
  { label: '基础扶持', value: 1 },
  { label: '标准扶持', value: 2 },
  { label: '增强扶持', value: 3 },
  { label: '优质扶持', value: 4 },
  { label: 'VIP专属', value: 5 },
  { label: '定制化扶持', value: 6 },
]

export const DISTRIBUTION_ORDER_EXPORT_FIELD_OPTIONS = [
  { label: '订单号', value: 'orderNo' },
  { label: '商品名称', value: 'productName' },
  { label: '商品SKU', value: 'productSku' },
  { label: '数量', value: 'quantity' },
  { label: '单价', value: 'unitPrice' },
  { label: '商品总价', value: 'totalAmount' },
  { label: '实付金额', value: 'payAmount' },
  { label: '佣金比例', value: 'commissionRate' },
  { label: '佣金金额', value: 'commissionAmount' },
  { label: '订单状态', value: 'status' },
  { label: '支付时间', value: 'payTime' },
  { label: '发货时间', value: 'shipTime' },
  { label: '完成时间', value: 'completeTime' },
  { label: '取消时间', value: 'cancelTime' },
  { label: '订单备注', value: 'remark' },
  { label: '收货人', value: 'receiverName' },
  { label: '收货电话', value: 'receiverPhone' },
  { label: '收货地址', value: 'receiverAddress' },
  { label: '下单时间', value: 'createdAt' },
] as const

export const DISTRIBUTION_ORDER_SORT_FIELD_OPTIONS = [
  { label: '下单时间', value: 'createdAt' },
  { label: '支付时间', value: 'payTime' },
  { label: '完成时间', value: 'completeTime' },
  { label: '实付金额', value: 'payAmount' },
  { label: '佣金金额', value: 'commissionAmount' },
  { label: '订单号', value: 'orderNo' },
] as const

export const DISTRIBUTION_ORDER_ORDER_TYPE_OPTIONS = [
  { label: '全部订单', value: 'all' },
  { label: '异常订单', value: 'abnormal' },
  { label: '待复核订单', value: 'pendingReview' },
  { label: '未结算订单', value: 'unsettled' },
] as const

export const DISTRIBUTION_ORDER_TAB_OPTIONS = [
  { label: '全部', value: 'all', type: '' },
  { label: '待支付', value: 0, type: 'info' },
  { label: '已支付', value: 1, type: 'primary' },
  { label: '已发货', value: 2, type: 'warning' },
  { label: '已完成', value: 3, type: 'success' },
  { label: '异常订单', value: 'abnormal', type: 'danger' },
  { label: '待复核', value: 'pendingReview', type: 'warning' },
  { label: '未结算', value: 'unsettled', type: 'primary' },
] as const

export const DISTRIBUTION_ORDER_ABNORMAL_STATUSES = [4, 5, 6]
export const DISTRIBUTION_ORDER_PENDING_REVIEW_STATUSES = [1, 2]

export const DISTRIBUTION_ORDER_ROW_COLOR_MAP: Record<string, string> = {
  abnormal: '#fef0f0',
  pendingReview: '#fdf6ec',
  unsettled: '#ecf5ff',
}

export const DISTRIBUTION_ORDER_COLUMN_DEFAULT_WIDTHS: Record<string, number> = {
  selection: 50,
  index: 60,
  orderNo: 180,
  productInfo: 240,
  quantity: 80,
  unitPrice: 100,
  totalAmount: 110,
  payAmount: 110,
  commission: 110,
  channel: 100,
  promoter: 120,
  status: 100,
  tags: 160,
  remark: 180,
  createdAt: 180,
  action: 150,
}

export const ORDER_STATUS_TRANSITIONS: Record<number, { label: string; value: number }[]> = {
  0: [{ label: '已支付', value: 1 }, { label: '已取消', value: 4 }],
  1: [{ label: '已发货', value: 2 }, { label: '已取消', value: 4 }, { label: '退款中', value: 5 }],
  2: [{ label: '已完成', value: 3 }, { label: '退款中', value: 5 }],
  3: [{ label: '退款中', value: 5 }],
  4: [],
  5: [{ label: '已退款', value: 6 }, { label: '已完成', value: 3 }],
  6: [],
}

export const ORDER_STATUS_CHANGE_REASON_REQUIRED = [4, 5, 6]

export const ORDER_STATUS_CHANGE_REASON_OPTIONS = [
  { label: '买家申请退款', value: 'buyer_refund' },
  { label: '商品质量问题', value: 'quality_issue' },
  { label: '物流异常', value: 'logistics_issue' },
  { label: '超时未支付', value: 'payment_timeout' },
  { label: '库存不足', value: 'out_of_stock' },
  { label: '买家取消', value: 'buyer_cancel' },
  { label: '卖家取消', value: 'seller_cancel' },
  { label: '协商退款', value: 'negotiated_refund' },
  { label: '系统自动取消', value: 'system_auto_cancel' },
  { label: '其他原因', value: 'other' },
] as const

type ElTagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

export const ORDER_ABNORMAL_TYPE_OPTIONS = [
  { label: '虚假订单', value: 'fake_order', type: 'danger' as ElTagType },
  { label: '刷单订单', value: 'brush_order', type: 'danger' as ElTagType },
  { label: '超时未付款', value: 'timeout_unpaid', type: 'warning' as ElTagType },
  { label: '退款异常', value: 'refund_abnormal', type: 'danger' as ElTagType },
  { label: '数据不匹配', value: 'data_mismatch', type: 'warning' as ElTagType },
  { label: '设备异常', value: 'abnormal_device', type: 'warning' as ElTagType },
  { label: 'IP异常', value: 'abnormal_ip', type: 'warning' as ElTagType },
  { label: '重复购买', value: 'repeat_purchase', type: 'info' as ElTagType },
  { label: '其他异常', value: 'other', type: 'primary' as ElTagType },
] as const

export const ORDER_ABNORMAL_TYPE_MAP: Record<string, { label: string; type: ElTagType }> = {
  fake_order: { label: '虚假订单', type: 'danger' },
  brush_order: { label: '刷单订单', type: 'danger' },
  timeout_unpaid: { label: '超时未付款', type: 'warning' },
  refund_abnormal: { label: '退款异常', type: 'danger' },
  data_mismatch: { label: '数据不匹配', type: 'warning' },
  abnormal_device: { label: '设备异常', type: 'warning' },
  abnormal_ip: { label: 'IP异常', type: 'warning' },
  repeat_purchase: { label: '重复购买', type: 'info' },
  other: { label: '其他异常', type: 'primary' },
}

export const ORDER_ABNORMAL_SEVERITY_OPTIONS = [
  { label: '低风险', value: 'low', color: '#909399' },
  { label: '中风险', value: 'medium', color: '#e6a23c' },
  { label: '高风险', value: 'high', color: '#f56c6c' },
  { label: '严重风险', value: 'critical', color: '#c0392b' },
] as const

export const ORDER_ABNORMAL_SEVERITY_MAP: Record<string, { label: string; color: string }> = {
  low: { label: '低风险', color: '#909399' },
  medium: { label: '中风险', color: '#e6a23c' },
  high: { label: '高风险', color: '#f56c6c' },
  critical: { label: '严重风险', color: '#c0392b' },
}

export const ORDER_ABNORMAL_STATUS_OPTIONS = [
  { label: '待复核', value: 0, type: 'warning' as ElTagType },
  { label: '复核中', value: 1, type: 'primary' as ElTagType },
  { label: '已处理', value: 2, type: 'success' as ElTagType },
  { label: '已驳回', value: 3, type: 'info' as ElTagType },
] as const

export const ORDER_ABNORMAL_STATUS_MAP: Record<number, { label: string; type: ElTagType }> = {
  0: { label: '待复核', type: 'warning' },
  1: { label: '复核中', type: 'primary' },
  2: { label: '已处理', type: 'success' },
  3: { label: '已驳回', type: 'info' },
}

export const ORDER_ABNORMAL_SOURCE_OPTIONS = [
  { label: '系统自动识别', value: 'system_auto' },
  { label: '规则引擎触发', value: 'rule_engine' },
  { label: '人工手动标记', value: 'manual_mark' },
  { label: '批量导入', value: 'batch_import' },
  { label: '第三方数据源', value: 'third_party' },
] as const

export const ORDER_ABNORMAL_SOURCE_MAP: Record<string, { label: string; type: ElTagType }> = {
  system_auto: { label: '系统自动识别', type: 'info' },
  rule_engine: { label: '规则引擎触发', type: 'primary' },
  manual_mark: { label: '人工手动标记', type: 'warning' },
  batch_import: { label: '批量导入', type: 'success' },
  third_party: { label: '第三方数据源', type: 'danger' },
}

export const ORDER_ABNORMAL_REVIEW_ACTION_OPTIONS = [
  { label: '放行结算', value: 'release', type: 'success' as ElTagType },
  { label: '驳回作废', value: 'reject', type: 'danger' as ElTagType },
  { label: '暂停观测', value: 'observe', type: 'warning' as ElTagType },
] as const

export const ORDER_ABNORMAL_REVIEW_ACTION_MAP: Record<string, { label: string; type: ElTagType }> = {
  release: { label: '放行结算', type: 'success' },
  reject: { label: '驳回作废', type: 'danger' },
  observe: { label: '暂停观测', type: 'warning' },
}

export const ORDER_ABNORMAL_REVIEW_REASON_OPTIONS = [
  { label: '误报，数据正常', value: 'false_alarm' },
  { label: '已核实合规', value: 'verified_compliant' },
  { label: '用户真实交易', value: 'real_transaction' },
  { label: '数据同步延迟', value: 'data_sync_delay' },
  { label: '违规刷单', value: 'violation_brush' },
  { label: '虚假交易', value: 'fake_transaction' },
  { label: '信息不完整', value: 'incomplete_info' },
  { label: '需进一步观察', value: 'need_observe' },
  { label: '其他原因', value: 'other' },
] as const

export const ROOT_CAUSE_CATEGORY_MAP: Record<string, { label: string; type: ElTagType }> = {
  promoter: { label: '推客操作', type: 'warning' },
  channel: { label: '渠道推广', type: 'primary' },
  system: { label: '系统数据', type: 'info' },
  user: { label: '用户行为', type: 'danger' },
  product: { label: '商品问题', type: 'warning' },
  other: { label: '其他因素', type: 'info' },
}

export const ABNORMAL_DIFFERENTIAL_RULES: Record<string, any[]> = {
  timeout_unpaid: ['release', 'reject'],
  data_mismatch: ['release', 'reject'],
  fake_order: ['reject', 'observe'],
  brush_order: ['reject', 'observe'],
  refund_abnormal: ['reject', 'observe'],
  abnormal_device: ['release', 'reject', 'observe'],
  abnormal_ip: ['release', 'reject', 'observe'],
  repeat_purchase: ['release', 'reject', 'observe'],
  other: ['release', 'reject', 'observe'],
}


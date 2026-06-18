export enum ResourceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  OFFLINE = 'offline',
  VIOLATION = 'violation',
  BLOCKED = 'blocked',
  RECYCLE = 'recycle'
}

export const ResourceStatusLabel: Record<string, string> = {
  [ResourceStatus.DRAFT]: '草稿',
  [ResourceStatus.PENDING]: '待审核',
  [ResourceStatus.APPROVED]: '审核通过',
  [ResourceStatus.REJECTED]: '审核拒绝',
  [ResourceStatus.PUBLISHED]: '已发布',
  [ResourceStatus.OFFLINE]: '已下架',
  [ResourceStatus.VIOLATION]: '违规下架',
  [ResourceStatus.BLOCKED]: '风控拦截',
  [ResourceStatus.RECYCLE]: '已废弃'
}

export const ResourceStatusFlow: Record<string, string[]> = {
  draft: ['pending'],
  pending: ['approved', 'rejected'],
  approved: ['published', 'offline'],
  rejected: ['draft', 'pending'],
  published: ['offline', 'violation'],
  offline: ['draft', 'published'],
  violation: ['appealed'],
  blocked: ['pending', 'rejected'],
  recycle: []
}

export enum RecycleReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export const RecycleReviewStatusLabel: Record<string, string> = {
  [RecycleReviewStatus.PENDING]: '待审核',
  [RecycleReviewStatus.APPROVED]: '审核通过',
  [RecycleReviewStatus.REJECTED]: '审核驳回'
}

export enum AuditLevel {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3
}

export const AuditLevelLabel: Record<string, string> = {
  [AuditLevel.LEVEL_1]: '一级审核',
  [AuditLevel.LEVEL_2]: '二级审核',
  [AuditLevel.LEVEL_3]: '三级审核'
}

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  TEMPLATE = 'template'
}

export const FileTypeLabel: Record<string, string> = {
  [FileType.IMAGE]: '图片',
  [FileType.VIDEO]: '视频',
  [FileType.AUDIO]: '音频',
  [FileType.TEMPLATE]: '模板'
}

export enum UserStatus {
  ACTIVE = 'active',
  FROZEN = 'frozen',
  TEMP_BANNED = 'temp_banned',
  PERMANENT_BANNED = 'permanent_banned'
}

export const UserStatusLabel: Record<string, string> = {
  [UserStatus.ACTIVE]: '正常',
  [UserStatus.FROZEN]: '冻结',
  [UserStatus.TEMP_BANNED]: '临时封禁',
  [UserStatus.PERMANENT_BANNED]: '永久封禁'
}

export const UserStatusTagType: Record<string, string> = {
  [UserStatus.ACTIVE]: 'success',
  [UserStatus.FROZEN]: 'warning',
  [UserStatus.TEMP_BANNED]: 'warning',
  [UserStatus.PERMANENT_BANNED]: 'danger'
}

export const UserStatusFlow: Record<string, string[]> = {
  active: ['frozen', 'temp_banned', 'permanent_banned'],
  frozen: ['active', 'temp_banned', 'permanent_banned'],
  temp_banned: ['active', 'frozen', 'permanent_banned'],
  permanent_banned: ['active']
}

export const UserStatusGlowColor: Record<string, string> = {
  active: 'rgba(103, 194, 58, 0.4)',
  frozen: 'rgba(230, 162, 60, 0.4)',
  temp_banned: 'rgba(230, 162, 60, 0.5)',
  permanent_banned: 'rgba(245, 108, 108, 0.5)'
}

export enum RoleRiskControl {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  AUDITOR = 'auditor',
  OPERATOR = 'operator'
}

export const RoleStatusPermission: Record<string, string[]> = {
  [RoleRiskControl.SUPER_ADMIN]: ['active', 'frozen', 'temp_banned', 'permanent_banned'],
  [RoleRiskControl.ADMIN]: ['active', 'frozen', 'temp_banned'],
  [RoleRiskControl.AUDITOR]: ['active', 'frozen', 'temp_banned'],
  [RoleRiskControl.OPERATOR]: ['active', 'frozen']
}

export const RoleRiskControlLabel: Record<string, string> = {
  [RoleRiskControl.SUPER_ADMIN]: '超级管理员',
  [RoleRiskControl.ADMIN]: '管理员',
  [RoleRiskControl.AUDITOR]: '审核员',
  [RoleRiskControl.OPERATOR]: '运营员'
}

export const HighRiskActions = ['permanent_banned', 'active-from-permanent']

export const StatusFunctionPermissions: Record<string, Record<string, boolean>> = {
  active: { view: true, edit: true, create: true, audit: true, market: true },
  frozen: { view: true, edit: false, create: false, audit: false, market: false },
  temp_banned: { view: false, edit: false, create: false, audit: false, market: false },
  permanent_banned: { view: false, edit: false, create: false, audit: false, market: false }
}

export const FunctionPermissionLabels: Record<string, string> = {
  view: '查看功能',
  edit: '编辑功能',
  create: '创作功能',
  audit: '审核功能',
  market: '营销活动参与'
}

export const ChangeTypeLabel: Record<string, string> = {
  manual: '手动变更',
  auto_expire: '自动到期',
  auto_appeal: '申诉通过',
  batch: '批量变更'
}

export enum PermissionGroup {
  DEFAULT = 'default',
  BASIC = 'basic',
  ADVANCED = 'advanced',
  PREMIUM = 'premium'
}

export const PermissionGroupLabel: Record<string, string> = {
  [PermissionGroup.DEFAULT]: '默认权限',
  [PermissionGroup.BASIC]: '基础权限',
  [PermissionGroup.ADVANCED]: '高级权限',
  [PermissionGroup.PREMIUM]: '尊享权限'
}

export enum CheckResult {
  PASS = 'pass',
  FAIL = 'fail',
  WARNING = 'warning'
}

export const CheckResultLabel: Record<string, string> = {
  [CheckResult.PASS]: '通过',
  [CheckResult.FAIL]: '不通过',
  [CheckResult.WARNING]: '警告'
}

export const CheckResultTagType: Record<string, string> = {
  [CheckResult.PASS]: 'success',
  [CheckResult.FAIL]: 'danger',
  [CheckResult.WARNING]: 'warning'
}

export enum CheckType {
  CREATE = 'create',
  EDIT = 'edit',
  TRACE = 'trace',
  BATCH = 'batch',
  MANUAL = 'manual'
}

export const CheckTypeLabel: Record<string, string> = {
  [CheckType.CREATE]: '创建校验',
  [CheckType.EDIT]: '编辑校验',
  [CheckType.TRACE]: '溯源校验',
  [CheckType.BATCH]: '批量校验',
  [CheckType.MANUAL]: '手动校验'
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  AUDITOR = 'auditor',
  OPERATOR = 'operator',
  MEMBER = 'member'
}

export const UserRoleLabel: Record<string, string> = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.ADMIN]: '管理员',
  [UserRole.AUDITOR]: '审核员',
  [UserRole.OPERATOR]: '运营员',
  [UserRole.MEMBER]: '会员'
}

export enum MemberLevel {
  NORMAL = 'normal',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export const MemberLevelLabel: Record<string, string> = {
  [MemberLevel.NORMAL]: '普通会员',
  [MemberLevel.BRONZE]: '青铜会员',
  [MemberLevel.SILVER]: '白银会员',
  [MemberLevel.GOLD]: '黄金会员',
  [MemberLevel.PLATINUM]: '铂金会员'
}

export enum ViolationType {
  PORN = 'porn',
  VIOLENCE = 'violence',
  POLITICS = 'politics',
  AD = 'ad',
  COPYRIGHT = 'copyright',
  OTHER = 'other'
}

export const ViolationTypeLabel: Record<string, string> = {
  [ViolationType.PORN]: '色情低俗',
  [ViolationType.VIOLENCE]: '暴力血腥',
  [ViolationType.POLITICS]: '政治敏感',
  [ViolationType.AD]: '广告引流',
  [ViolationType.COPYRIGHT]: '侵权盗版',
  [ViolationType.OTHER]: '其他违规'
}

export enum ViolationLevel {
  MINOR = 'minor',
  MODERATE = 'moderate',
  SEVERE = 'severe'
}

export const ViolationLevelLabel: Record<string, string> = {
  [ViolationLevel.MINOR]: '轻微违规',
  [ViolationLevel.MODERATE]: '中度违规',
  [ViolationLevel.SEVERE]: '严重违规'
}

export enum ViolationAction {
  WARNING = 'warning',
  REMOVED = 'removed',
  BANNED = 'banned',
  APPEAL_ALLOWED = 'appeal_allowed'
}

export const ViolationActionLabel: Record<string, string> = {
  [ViolationAction.WARNING]: '警告',
  [ViolationAction.REMOVED]: '下架处置',
  [ViolationAction.BANNED]: '封禁账号',
  [ViolationAction.APPEAL_ALLOWED]: '申诉通过'
}

export enum AppealStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

export const AppealStatusLabel: Record<string, string> = {
  [AppealStatus.PENDING]: '待复核',
  [AppealStatus.REVIEWING]: '复核中',
  [AppealStatus.APPROVED]: '申诉通过',
  [AppealStatus.REJECTED]: '申诉驳回'
}

export enum NotificationType {
  SYSTEM = 'system',
  AUDIT = 'audit',
  VIOLATION = 'violation',
  APPEAL = 'appeal',
  MEMBER = 'member',
  RESOURCE = 'resource'
}

export const NotificationTypeLabel: Record<string, string> = {
  [NotificationType.SYSTEM]: '系统通知',
  [NotificationType.AUDIT]: '审核通知',
  [NotificationType.VIOLATION]: '违规通知',
  [NotificationType.APPEAL]: '申诉通知',
  [NotificationType.MEMBER]: '会员通知',
  [NotificationType.RESOURCE]: '资源通知'
}

export const DATE_FORMAT = 'YYYY-MM-DD'
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
export const TIME_FORMAT = 'HH:mm:ss'

export const IMAGE_MAX_SIZE = 10 * 1024 * 1024
export const VIDEO_MAX_SIZE = 500 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/mov']

export const LAZY_LOAD_THRESHOLD = 0.1
export const VIRTUAL_LIST_ITEM_HEIGHT = 80
export const VIRTUAL_LIST_BUFFER = 5

// ================ 用户层级标签管理 ================

export enum DisplayMemberLevel {
  NORMAL = 'normal',
  VIP = 'vip',
  PREMIUM_VIP = 'premium_vip'
}

export const DisplayMemberLevelLabel: Record<string, string> = {
  [DisplayMemberLevel.NORMAL]: '普通用户',
  [DisplayMemberLevel.VIP]: 'VIP用户',
  [DisplayMemberLevel.PREMIUM_VIP]: '高级VIP用户'
}

export const DisplayMemberLevelTagType: Record<string, string> = {
  [DisplayMemberLevel.NORMAL]: 'info',
  [DisplayMemberLevel.VIP]: 'warning',
  [DisplayMemberLevel.PREMIUM_VIP]: 'danger'
}

export const INTERNAL_TO_DISPLAY_LEVEL: Record<string, string> = {
  normal: 'normal',
  bronze: 'vip',
  silver: 'vip',
  gold: 'vip',
  platinum: 'premium_vip'
}

export const DISPLAY_TO_MIN_INTERNAL: Record<string, string> = {
  normal: 'normal',
  vip: 'bronze',
  premium_vip: 'platinum'
}

export const DISPLAY_LEVEL_ORDER: Record<string, number> = {
  normal: 1,
  vip: 2,
  premium_vip: 3
}

export const LEVEL_UPGRADE_CRITERIA: Record<string, { minConsume: number; minActiveHours: number; minCreateCount: number }> = {
  vip: { minConsume: 100, minActiveHours: 10, minCreateCount: 3 },
  premium_vip: { minConsume: 1000, minActiveHours: 100, minCreateCount: 20 }
}

export const LEVEL_BENEFITS: Record<string, { key: string; label: string; value: boolean | string | number }[]> = {
  normal: [
    { key: 'basic_download', label: '基础下载(5次/天)', value: true },
    { key: 'watermark', label: '下载带水印', value: true }
  ],
  vip: [
    { key: 'basic_download', label: '基础下载(50次/天)', value: true },
    { key: 'hd_download', label: '高清下载', value: true },
    { key: 'no_watermark', label: '无水印下载', value: true },
    { key: 'vip_template', label: 'VIP模板专区', value: true }
  ],
  premium_vip: [
    { key: 'basic_download', label: '无限次下载', value: true },
    { key: 'hd_download', label: '高清/4K下载', value: true },
    { key: 'no_watermark', label: '无水印下载', value: true },
    { key: 'vip_template', label: '全模板专区', value: true },
    { key: 'priority_audit', label: '优先审核通道', value: true },
    { key: 'exclusive_service', label: '专属客服', value: true },
    { key: 'marketing_priority', label: '营销活动优先权', value: true }
  ]
}

export const LEVEL_AUTO_TAGS: Record<string, string[]> = {
  vip: ['VIP用户'],
  premium_vip: ['高级VIP', '尊享用户']
}

export enum TagDimension {
  CONSUME = 'consume',
  CREATE = 'create',
  ACTIVE = 'active',
  COMPOSITE = 'composite'
}

export const TagDimensionLabel: Record<string, string> = {
  [TagDimension.CONSUME]: '消费维度',
  [TagDimension.CREATE]: '创作维度',
  [TagDimension.ACTIVE]: '活跃维度',
  [TagDimension.COMPOSITE]: '综合维度'
}

export const TagDimensionTagType: Record<string, string> = {
  [TagDimension.CONSUME]: 'danger',
  [TagDimension.CREATE]: 'success',
  [TagDimension.ACTIVE]: 'primary',
  [TagDimension.COMPOSITE]: 'warning'
}

export const USER_LEVEL_OPTIONS = [
  { value: 'normal', label: '普通用户' },
  { value: 'vip', label: 'VIP用户' },
  { value: 'premium_vip', label: '高级VIP用户' }
]

export const TAG_DIMENSION_OPTIONS = [
  { value: 'consume', label: '消费维度' },
  { value: 'create', label: '创作维度' },
  { value: 'active', label: '活跃维度' },
  { value: 'composite', label: '综合维度' }
]

export const CONSUME_LEVEL_OPTIONS = [
  { value: 'low', label: '低消费(<100元)' },
  { value: 'mid', label: '中消费(100-999元)' },
  { value: 'high', label: '高消费(≥1000元)' }
]

export const FILTER_OPTIONS = [
  { value: '', label: '全部用户' },
  { value: 'vip_only', label: '仅VIP及以上' },
  { value: 'premium_only', label: '仅高级VIP' }
]

// ================ 登录行为管控 ================

export enum LoginStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  FAILED = 'failed',
  BLOCKED = 'blocked',
  VERIFIED = 'verified',
  RISK = 'risk'
}

export const LoginStatusLabel: Record<string, string> = {
  [LoginStatus.PENDING]: '待验证',
  [LoginStatus.SUCCESS]: '登录成功',
  [LoginStatus.FAILED]: '登录失败',
  [LoginStatus.BLOCKED]: '风控拦截',
  [LoginStatus.VERIFIED]: '验证通过',
  [LoginStatus.RISK]: '标记风险'
}

export const LoginStatusTagType: Record<string, string> = {
  [LoginStatus.PENDING]: 'warning',
  [LoginStatus.SUCCESS]: 'success',
  [LoginStatus.FAILED]: 'info',
  [LoginStatus.BLOCKED]: 'danger',
  [LoginStatus.VERIFIED]: 'primary',
  [LoginStatus.RISK]: 'danger'
}

export enum RiskLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export const RiskLevelLabel: Record<string, string> = {
  [RiskLevel.NONE]: '无风险',
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.HIGH]: '高风险',
  [RiskLevel.CRITICAL]: '严重风险'
}

export const RiskLevelTagType: Record<string, string> = {
  [RiskLevel.NONE]: 'info',
  [RiskLevel.LOW]: 'warning',
  [RiskLevel.MEDIUM]: 'warning',
  [RiskLevel.HIGH]: 'danger',
  [RiskLevel.CRITICAL]: 'danger'
}

export const RiskLevelColor: Record<string, string> = {
  [RiskLevel.NONE]: '#909399',
  [RiskLevel.LOW]: '#E6A23C',
  [RiskLevel.MEDIUM]: '#F59E0B',
  [RiskLevel.HIGH]: '#F56C6C',
  [RiskLevel.CRITICAL]: '#D9363E'
}

export enum DeviceStatus {
  TRUSTED = 'trusted',
  NORMAL = 'normal',
  RESTRICTED = 'restricted',
  BLOCKED = 'blocked',
  LOCKED = 'locked'
}

export const DeviceStatusLabel: Record<string, string> = {
  [DeviceStatus.TRUSTED]: '可信白名单',
  [DeviceStatus.NORMAL]: '正常',
  [DeviceStatus.RESTRICTED]: '受限登录',
  [DeviceStatus.BLOCKED]: '已拦截',
  [DeviceStatus.LOCKED]: '永久锁定'
}

export const DeviceStatusTagType: Record<string, string> = {
  [DeviceStatus.TRUSTED]: 'success',
  [DeviceStatus.NORMAL]: 'primary',
  [DeviceStatus.RESTRICTED]: 'warning',
  [DeviceStatus.BLOCKED]: 'danger',
  [DeviceStatus.LOCKED]: 'danger'
}

export enum FrequencyFlag {
  NORMAL = 'normal',
  HIGH_HOUR = 'high_hour',
  HIGH_DAY = 'high_day',
  BURST = 'burst'
}

export const FrequencyFlagLabel: Record<string, string> = {
  [FrequencyFlag.NORMAL]: '正常频次',
  [FrequencyFlag.HIGH_HOUR]: '小时级高频',
  [FrequencyFlag.HIGH_DAY]: '日级高频',
  [FrequencyFlag.BURST]: '突发登录'
}

export enum FinalDecision {
  PASS = 'pass',
  VERIFY = 'verify',
  BLOCK = 'block'
}

export const FinalDecisionLabel: Record<string, string> = {
  [FinalDecision.PASS]: '通过',
  [FinalDecision.VERIFY]: '需二次验证',
  [FinalDecision.BLOCK]: '拦截'
}

export const RISK_SCORE_RULES_DESC: Record<string, string> = {
  newDevice: '新设备首次登录',
  newIp: '新IP地址登录',
  offsite: '异地登录',
  abroad: '境外登录',
  proxy: '代理IP登录',
  vpn: 'VPN登录',
  tor: 'Tor网络登录',
  datacenter: '机房IP登录',
  highFreqHour: '1小时内高频登录',
  highFreqDay: '24小时内高频登录',
  burst: '突发登录(30s内多次)',
  multiDevice: '多设备同时在线',
  selenium: 'Selenium自动化检测',
  headless: '无头浏览器检测',
  script: '脚本登录检测',
  forged: '伪造登录检测'
}

export const LOGIN_STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'success', label: '登录成功' },
  { value: 'verified', label: '验证通过' },
  { value: 'pending', label: '待验证' },
  { value: 'failed', label: '登录失败' },
  { value: 'blocked', label: '风控拦截' },
  { value: 'risk', label: '标记风险' }
]

export const RISK_LEVEL_OPTIONS = [
  { value: '', label: '全部等级' },
  { value: 'none', label: '无风险' },
  { value: 'low', label: '低风险' },
  { value: 'medium', label: '中风险' },
  { value: 'high', label: '高风险' },
  { value: 'critical', label: '严重风险' }
]

export const DEVICE_STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'trusted', label: '可信白名单' },
  { value: 'normal', label: '正常' },
  { value: 'restricted', label: '受限登录' },
  { value: 'blocked', label: '已拦截' },
  { value: 'locked', label: '永久锁定' }
]

export const OS_OPTIONS = [
  { value: '', label: '全部系统' },
  { value: 'Windows', label: 'Windows' },
  { value: 'Mac', label: 'Mac' },
  { value: 'iOS', label: 'iOS' },
  { value: 'Android', label: 'Android' },
  { value: 'Linux', label: 'Linux' }
]

export const BROWSER_OPTIONS = [
  { value: '', label: '全部浏览器' },
  { value: 'Chrome', label: 'Chrome' },
  { value: 'Safari', label: 'Safari' },
  { value: 'Firefox', label: 'Firefox' },
  { value: 'Edge', label: 'Edge' },
  { value: 'WeChat', label: '微信内置' }
]

export const SCROLL_BACK_TO_TOP_THRESHOLD = 500

export enum BatchLoginAction {
  MARK_RISK = 'mark',
  CLEAR_RISK = 'clear',
  DELETE = 'delete'
}

// ================ 角色权限管理 ================

export enum PermMenuLevel {
  MODULE = 'module',
  PAGE = 'page',
  ACTION = 'action'
}

export const PermMenuLevelLabel: Record<string, string> = {
  [PermMenuLevel.MODULE]: '模块级',
  [PermMenuLevel.PAGE]: '页面级',
  [PermMenuLevel.ACTION]: '操作级'
}

export const PermMenuLevelTagType: Record<string, string> = {
  [PermMenuLevel.MODULE]: 'danger',
  [PermMenuLevel.PAGE]: 'warning',
  [PermMenuLevel.ACTION]: 'info'
}

export const RoleTypeLabel: Record<string, string> = {
  super_admin: '超级管理员',
  admin: '管理员',
  auditor: '审核员',
  operator: '运营员',
  member: '普通用户'
}

export const RoleTypeTagType: Record<string, string> = {
  super_admin: 'danger',
  admin: 'warning',
  auditor: 'primary',
  operator: 'success',
  member: 'info'
}

export const RoleStatusOption = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '启用' },
  { value: 'inactive', label: '停用' }
]

export const RoleTypeOption = [
  { value: '', label: '全部类型' },
  { value: 'super_admin', label: '超级管理员' },
  { value: 'admin', label: '管理员' },
  { value: 'auditor', label: '审核员' },
  { value: 'operator', label: '运营员' },
  { value: 'member', label: '普通用户' }
]

export const PermChangeTypeLabel: Record<string, string> = {
  create: '创建角色',
  edit: '编辑权限',
  delete: '删除角色',
  batch_copy: '批量复制模板',
  batch_modify: '批量修改权限',
  sync: '权限同步'
}

export const PermChangeTypeTagType: Record<string, string> = {
  create: 'success',
  edit: 'primary',
  delete: 'danger',
  batch_copy: 'warning',
  batch_modify: 'warning',
  sync: 'info'
}

export const ComplianceIssueTypeLabel: Record<string, string> = {
  conflict: '权限冲突',
  missing: '权限缺失',
  redundant: '权限冗余'
}

export const ComplianceIssueSeverityTagType: Record<string, string> = {
  high: 'danger',
  medium: 'warning',
  low: 'info'
}

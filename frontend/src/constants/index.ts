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

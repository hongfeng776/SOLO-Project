export enum NoteStatus {
  DRAFT = 0,
  PENDING_REVIEW = 1,
  PUBLISHED = 2,
  REJECTED = 3,
  OFF_SHELF = 4,
  SCHEDULED = 5,
  FLOW_LIMITED = 7
}

export enum FlowLevel {
  NORMAL = 1,
  PREMIUM = 2,
  HOT = 3
}

export enum OperatorRole {
  NORMAL_OPS = 'normal_ops',
  SUPER_OPS = 'super_ops',
  ADMIN = 'admin'
}

export enum NoteOpsAction {
  PUBLISH = 'publish',
  OFF_SHELF = 'off_shelf',
  FLOW_LIMIT = 'flow_limit',
  RESTORE = 'restore',
  PROMOTE_FLOW = 'promote_flow',
  DEMOTE_FLOW = 'demote_flow',
  PIN = 'pin',
  UNPIN = 'unpin',
  SET_HOT = 'set_hot',
  REMOVE_HOT = 'remove_hot'
}

export const NOTE_OPS_ACTION_NAMES: Record<string, string> = {
  publish: '发布',
  off_shelf: '下架',
  flow_limit: '限流',
  restore: '恢复',
  promote_flow: '升级流量池',
  demote_flow: '降级流量池',
  pin: '置顶',
  unpin: '取消置顶',
  set_hot: '设为热门',
  remove_hot: '取消热门'
}

export const FLOW_LEVEL_NAMES: Record<number, string> = {
  1: '普通',
  2: '优质',
  3: '热门'
}

export const OPERATOR_ROLE_NAMES: Record<string, string> = {
  normal_ops: '普通运营',
  super_ops: '超级运营',
  admin: '管理员'
}

export enum NoteType {
  IMAGE_TEXT = 1,
  VIDEO = 2
}

export enum ComplianceCheckResult {
  PASSED = 1,
  BLOCKED = 2,
  WARNING = 3
}

export enum AbnormalType {
  CONTENT_VIOLATION = 'content_violation',
  DUPLICATE_PUBLISH = 'duplicate_publish',
  SCHEDULE_CONFLICT = 'schedule_conflict',
  AUTH_FAILED = 'auth_failed'
}

export enum BatchStatus {
  PROCESSING = 1,
  COMPLETED = 2,
  FAILED = 3
}

export enum RealNameStatus {
  UNVERIFIED = 0,
  VERIFYING = 1,
  VERIFIED = 2,
  REJECTED = 3
}

export enum ReviewLevel {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3
}

export enum TagType {
  CONTENT = 'content',
  PRODUCT = 'product',
  ACTIVITY = 'activity'
}

export enum MerchantQualificationStatus {
  PENDING_SUBMIT = 0,
  UNDER_REVIEW = 1,
  APPROVED = 2,
  REJECTED = 3
}

export enum OrderType {
  PROMOTION = 'promotion',
  DELIVERY = 'delivery',
  CUSTOM = 'custom'
}

export enum OrderStatus {
  PENDING_PAYMENT = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3,
  REFUNDED = 4
}

export enum ViolationTargetType {
  NOTE = 'note',
  COMMENT = 'comment',
  USER = 'user',
  CREATOR = 'creator',
  ACTIVITY = 'activity',
  ORDER = 'order'
}

export enum ViolationType {
  SEXUAL = 'sexual',
  FALSE_ADVERTISING = 'false_advertising',
  INFRINGEMENT = 'infringement',
  ILLEGAL = 'illegal',
  OTHER = 'other'
}

export enum ViolationLevel {
  MILD = 1,
  MODERATE = 2,
  SEVERE = 3,
  EXTREME = 4
}

export enum HandleResult {
  WARNING = 1,
  REMOVE = 2,
  LIMIT_FLOW = 3,
  BAN_7D = 4,
  BAN_30D = 5,
  BAN_PERMANENT = 6
}

export enum CommentStatus {
  NORMAL = 1,
  VIOLATION = 2,
  DELETED = 3
}

export enum LogModule {
  CONTENT = 'content',
  CREATOR = 'creator',
  ACTIVITY = 'activity',
  ORDER = 'order',
  SYSTEM = 'system',
  RISK = 'risk'
}

export enum LogAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  AUDIT = 'audit',
  PUBLISH = 'publish',
  EXPORT = 'export',
  IMPORT = 'import'
}

export enum NotificationType {
  SYSTEM = 'system',
  AUDIT = 'audit',
  ORDER = 'order',
  ACTIVITY = 'activity',
  RISK = 'risk'
}

export enum NotificationStatus {
  UNREAD = 1,
  READ = 2,
  DELETED = 3
}

export enum FeedbackType {
  BUG = 'bug',
  SUGGESTION = 'suggestion',
  COMPLAINT = 'complaint',
  OTHER = 'other'
}

export enum FeedbackStatus {
  PENDING = 1,
  PROCESSING = 2,
  RESOLVED = 3,
  CLOSED = 4
}

export enum FeedbackPriority {
  URGENT = 1,
  NORMAL = 2,
  LOW = 3
}

export enum SettlementType {
  ORDER = 'order',
  ACTIVITY = 'activity',
  BONUS = 'bonus'
}

export enum SettlementStatus {
  PENDING = 1,
  SETTLING = 2,
  SETTLED = 3,
  REJECTED = 4
}

export enum ResourceSlotType {
  BANNER = 'banner',
  TOPIC = 'topic',
  RECOMMEND = 'recommend',
  FLOAT = 'float'
}

export enum ResourceSlotPosition {
  HOME = 'home',
  DISCOVER = 'discover',
  SEARCH = 'search',
  TOPIC = 'topic'
}

export enum ResourceSlotStatus {
  ENABLED = 1,
  DISABLED = 2
}

export enum ReviewAction {
  APPROVE = 1,
  REJECT = 2,
  POSTPONE = 3
}

export enum ReviewPermission {
  NORMAL = 1,
  SENIOR = 2
}

export enum AbnormalReviewType {
  NO_REASON_REJECT = 'no_reason_reject',
  TAG_MISMATCH = 'tag_mismatch',
  EXCESSIVE_REJECTION = 'excessive_rejection',
  UNUSUAL_PATTERN = 'unusual_pattern'
}

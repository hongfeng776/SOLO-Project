import type { NoteStatus, TagType, MerchantQualificationStatus, OrderType, OrderStatus } from '@enums/business'

export interface Note {
  id: number
  title: string
  content: string
  coverImage: string
  status: NoteStatus
  authorId: number
  authorName: string
  tags: Tag[]
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  rejectReason?: string
  reviewLevel?: number
  publishTime?: string
  createTime: string
  updateTime: string
  reviewWeight?: number
  flowUnlocked?: number
  postponeReason?: string
  lastReviewerId?: number
  lastReviewerName?: string
  lastReviewTime?: string
  isAbnormal?: number
  noteType?: number
  flowLevel?: number
  isPinned?: number
  isHot?: number
  lastOpsTime?: string
  lastOpsUserName?: string
  hiddenReason?: string
}

export interface NoteOpsData {
  noteId: number
  newStatus: number
  newFlowLevel?: number
  newFlowUnlocked?: number
  newIsHot?: number
  reason?: string
}

export interface BatchNoteOpsData {
  ids: number[]
  newStatus: number
  newFlowLevel?: number
  newFlowUnlocked?: number
  reason?: string
}

export interface NoteOpsResult {
  success: boolean
  noteId: number
  previousStatus: number
  newStatus: number
  message?: string
}

export interface BatchNoteOpsResult {
  total: number
  success: number
  fail: number
  results: NoteOpsResult[]
}

export interface NoteOpsComplianceResult {
  allowed: boolean
  blockedReason?: string
  warnings?: string[]
  isAbnormal?: boolean
  abnormalReason?: string
}

export interface NoteOpsLog {
  id: number
  noteId: number
  noteTitle: string
  operatorId: number
  operatorName: string
  operatorRole: string
  previousStatus: number
  newStatus: number
  previousFlowLevel?: number
  newFlowLevel?: number
  previousFlowUnlocked?: number
  newFlowUnlocked?: number
  previousIsHot?: number
  newIsHot?: number
  reason: string
  isAbnormal: number
  abnormalReason: string
  createTime: string
}

export interface ReviewActionData {
  noteId: number
  action: number
  violationType?: string
  reason?: string
  reviewLevel?: number
}

export interface ReviewResult {
  success: boolean
  noteId: number
  previousStatus: number
  newStatus: number
  flowUnlocked?: boolean
  notificationSent?: boolean
}

export interface BatchReviewResult {
  total: number
  success: number
  fail: number
  results: ReviewResult[]
}

export interface ReviewLog {
  id: number
  noteId: number
  noteTitle: string
  reviewerId: number
  reviewerName: string
  reviewLevel: number
  action: number
  previousStatus: number
  newStatus: number
  violationType: string
  reason: string
  isAbnormal: number
  abnormalReason: string
  createTime: string
}

export interface ReviewComplianceResult {
  valid: boolean
  violations: Array<{ type: string; message: string }>
  isAbnormal: boolean
  abnormalType?: string
  abnormalReason?: string
}

export interface ReviewAbnormalLog {
  id: number
  reviewLogId: number
  noteId: number
  reviewerId: number
  reviewerName: string
  abnormalType: string
  abnormalDetail: string
  severity: number
  handled: number
  createTime: string
}

export interface ReviewerStats {
  totalReviewed: number
  approved: number
  rejected: number
  postponed: number
  rejectionRate: number
  abnormalCount: number
}

export interface Tag {
  id: number
  name: string
  type: string
  categoryId?: number
  categoryName?: string
  parentId?: number
  description: string
  coverImage: string
  sort: number
  status: number
  useCount: number
  hotLevel: number
  weight: number
  isCore: number
  complianceTags: string[]
  scenes: string[]
  color: string
  icon: string
  lastUsedTime?: string
  createTime: string
  updateTime: string
}

export interface Category {
  id: number
  name: string
  code: string
  parentId?: number
  level: number
  description: string
  coverImage: string
  icon: string
  color: string
  sort: number
  status: number
  tagCount: number
  noteCount: number
  isCore: number
  weight: number
  scenes: string[]
  children?: Category[]
  createTime: string
  updateTime: string
}

export interface TagUsageLog {
  id: number
  tagId: number
  tagName: string
  noteId: number
  noteTitle: string
  categoryId?: number
  userId: number
  userName: string
  action: string
  reason: string
  createTime: string
}

export interface TagCategoryComplianceResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface BatchTagOpsResult {
  total: number
  success: number
  fail: number
  results: Array<{ id: number; success: boolean; error?: string }>
}

export interface Creator {
  id: number
  name: string
  avatar: string
  platform: string
  followers: number
  likes: number
  category: string
  level: number
  qualificationStatus: MerchantQualificationStatus
  contactName: string
  contactPhone: string
  createTime: string
}

export interface Activity {
  id: number
  name: string
  description: string
  coverImage: string
  type: string
  startTime: string
  endTime: string
  status: number
  participantCount: number
  maxParticipants: number
  createTime: string
}

export interface Order {
  id: number
  orderNo: string
  type: OrderType
  status: OrderStatus
  activityId: number
  activityName: string
  creatorId: number
  creatorName: string
  amount: number
  paymentTime?: string
  completeTime?: string
  cancelTime?: string
  refundTime?: string
  remark?: string
  createTime: string
}

export interface SystemUser {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  status: number
  roleIds: number[]
  roles: Role[]
  createTime: string
}

export interface Role {
  id: number
  name: string
  code: string
  description: string
  status: number
  permissions: string[]
  createTime: string
}

export interface Comment {
  id: number
  noteId: number
  noteTitle: string
  userId: number
  userName: string
  userAvatar: string
  content: string
  parentId: number
  replyTo?: number
  likeCount: number
  status: number
  violationType: string
  createTime: string
  updateTime: string
}

export interface ViolationRecord {
  id: number
  targetType: string
  targetId: number
  targetTitle: string
  violationType: string
  violationLevel: number
  description: string
  evidence: string
  handlerId: number
  handlerName: string
  handleResult: number
  handleNote: string
  status: number
  appealContent: string
  createTime: string
  updateTime: string
}

export interface ResourceSlot {
  id: number
  name: string
  code: string
  position: string
  type: string
  width?: number
  height?: number
  sortOrder: number
  status: number
  description: string
  createTime: string
  updateTime: string
}

export interface OperationLog {
  id: number
  userId: number
  userName: string
  module: string
  action: string
  targetType: string
  targetId?: number
  targetName: string
  ip: string
  userAgent: string
  params?: string
  result?: string
  status: number
  errorMsg: string
  duration: number
  createTime: string
}

export interface Notification {
  id: number
  type: string
  title: string
  content: string
  targetType: string
  targetId?: number
  receiverType: string
  receiverIds?: string
  senderId?: number
  senderName: string
  status: number
  readTime?: string
  createTime: string
}

export interface Feedback {
  id: number
  userId: number
  userName: string
  type: string
  title: string
  content: string
  images: string
  contact: string
  status: number
  priority: number
  handlerId?: number
  handlerName: string
  handleResult?: string
  handleTime?: string
  createTime: string
  updateTime: string
}

export interface Settlement {
  id: number
  orderId: number
  orderNo: string
  creatorId: number
  creatorName: string
  merchantId?: number
  merchantName: string
  amount: number
  platformFee: number
  creatorIncome: number
  settlementType: string
  settlementPeriod: string
  status: number
  remark: string
  settleTime?: string
  createTime: string
  updateTime: string
}

export interface OverviewStats {
  totalNotes: number
  totalCreators: number
  totalOrders: number
  totalUsers: number
  totalComments: number
  totalRevenue: number
  todayNewNotes: number
  todayNewCreators: number
  todayNewOrders: number
  todayNewUsers: number
  todayRevenue: number
  pendingReviews: number
  pendingSettlements: number
}

export interface TrendDataItem {
  date: string
  noteCount?: number
  userCount?: number
  orderCount?: number
  revenue?: number
}

export interface ComplianceViolation {
  type: string
  field: string
  message: string
  level: number
}

export interface ComplianceCheckResult {
  passed: boolean
  violations: ComplianceViolation[]
  wordCount: number
  tagCount: number
  hasExternalLinks: boolean
}

export interface SimilarNote {
  id: number
  title: string
  similarity: number
  diff: string
}

export interface SimilarityCheckResult {
  isDuplicate: boolean
  similarNotes: SimilarNote[]
  fingerprint: string
}

export interface ScheduleConflictResult {
  hasConflict: boolean
  conflictingNotes: Array<{
    id: number
    title: string
    scheduleTime: string
  }>
}

export interface PublishEligibilityResult {
  eligible: boolean
  reasons: string[]
  accountStatus: {
    status: number
    realNameVerified: number
    isBanned: boolean
    isFlowLimited: boolean
    recentViolations: number
  }
}

export interface NoteDraftData {
  id?: number
  title: string
  content: string
  coverImage?: string
  videoUrl?: string
  noteType?: number
  externalLinks?: string[]
  tagIds?: number[]
}

export interface NotePublishData extends NoteDraftData {
  contentFingerprint?: string
}

export interface NoteScheduleData extends NotePublishData {
  scheduleTime: string
}

export interface BatchPublishResult {
  batchNo: string
  total: number
  success: number
  fail: number
  results: Array<{
    index: number
    success: boolean
    id?: number
    error?: string
  }>
}

export interface NoteBatchRecord {
  id: number
  batchNo: string
  userId: number
  userName: string
  totalCount: number
  successCount: number
  failCount: number
  pendingCount: number
  status: number
  failDetails: string
  createTime: string
}

export interface PublishAbnormalLog {
  id: number
  userId: number
  userName: string
  abnormalType: string
  abnormalDetail: string
  targetNoteId?: number
  ip: string
  handled: number
  createTime: string
}

export interface AccountStatus {
  status: number
  realNameVerified: number
  isBanned: boolean
  isFlowLimited: boolean
  banExpireTime?: string
  flowLimitExpireTime?: string
  realName?: string
}

export interface UserAccount {
  id: number
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  status: number
  realNameVerified: number
  realName?: string
  idCard?: string
  registerSource: string
  phoneVerified: number
  isAbnormal: number
  abnormalType: string
  abnormalReason: string
  infoCompleteness: number
  lastActiveTime?: string
  lastLoginTime?: string
  loginCount: number
  roles: Role[]
  createTime: string
  updateTime: string
}

export interface UserAccountPermission {
  canViewPrivate: boolean
  canEdit: boolean
}

export interface UserPreCheckResult {
  valid: boolean
  issues: string[]
  data?: UserAccount
}

export interface UserDerivedData {
  recentViolations: ViolationRecord[]
  recentAccountLogs: UserAccountLog[]
  recentAbnormalLogs: UserAbnormalLog[]
  infoCompleteness: number
  missingFields: string[]
}

export interface UserAccountDetail {
  user: UserAccount
  preCheck: UserPreCheckResult
  permission: UserAccountPermission
  derivedData: UserDerivedData
}

export interface ValidateResult {
  valid: boolean
  message?: string
}

export interface UserUpdateResult {
  success: boolean
  message: string
  updatedFields?: string[]
  user?: Partial<UserAccount>
}

export interface BatchOperationParams {
  userIds?: number[]
  filterType?: string
  scope: string
  updates: {
    nickname?: string
    avatar?: string
    phone?: string
    email?: string
    realName?: string
  }
  reason?: string
}

export interface BatchOperationResult {
  total: number
  success: number
  fail: number
  results: Array<{
    userId: number
    success: boolean
    error?: string
  }>
}

export interface UserTraceItem {
  type: string
  title: string
  time: string
  data: Record<string, any>
}

export interface UserAnomaly {
  type: string
  severity: number
  title: string
  detail: string
  relatedUsers?: Array<{ id: number; username: string }>
  missingFields?: string[]
}

export interface UserIntegrityCheck {
  name: string
  passed: boolean
  message?: string
}

export interface UserIntegrityResult {
  valid: boolean
  checks: UserIntegrityCheck[]
  completeness: number
  issues: string[]
}

export interface UserTraceResult {
  user: UserAccount
  traces: UserTraceItem[]
  anomalies: UserAnomaly[]
  integrityCheck: UserIntegrityResult
  permission: UserAccountPermission
}

export interface UserAccountLog {
  id: number
  userId: number
  userName: string
  operatorId: number
  operatorName: string
  logType: string
  fieldName: string
  oldValue: string
  newValue: string
  reason: string
  ip: string
  userAgent: string
  status: number
  errorMsg: string
  createTime: string
}

export interface UserAbnormalLog {
  id: number
  userId: number
  userName: string
  abnormalType: string
  abnormalDetail: string
  severity: number
  traceData: string
  detectedTime: string
  handled: number
  handlerId?: number
  handlerName?: string
  handleTime?: string
  handleResult?: string
  user?: Partial<UserAccount>
  createTime: string
}

export interface UserAbnormalStats {
  abnormalType: string
  count: number
}

export interface UserLevel {
  id: number
  userId: number
  userLevel: number
  levelScore: number
  levelScoreDetail: LevelScoreDetail
  isPermanentBanned: number
  privileges: string[]
  levelLastUpdateTime?: string
  createTime: string
  updateTime: string
}

export interface LevelScoreDetail {
  activity: number
  contentQuality: number
  compliance: number
  accountAge: number
  realName: number
  phoneVerified: number
}

export interface LevelScoreDetailWithNames {
  key: string
  name: string
  score: number
  weight: number
  description: string
}

export interface UserLevelDetail {
  user: UserAccount & {
    userLevel: number
    levelScore: number
    levelScoreDetail: LevelScoreDetail
    isPermanentBanned: number
    privileges: string[]
    levelLastUpdateTime?: string
  }
  levelInfo: {
    levelName: string
    levelColor: string
    nextLevel?: string
    nextLevelScore?: number
    scoreToNextLevel?: number
  }
  benefits: UserBenefit[]
  permission: UserLevelPermission
  recentLevelLogs: UserLevelLog[]
  preCheck: UserPreCheckResult
}

export interface UserLevelPermission {
  canView: boolean
  canEdit: boolean
  canUpgrade: boolean
  canDowngrade: boolean
  canBatchUpgrade: boolean
  canBatchDowngrade: boolean
  maxAdjustLevel: number
}

export interface UserBenefit {
  key: string
  name: string
  enabled: boolean
  description: string
  icon?: string
}

export interface LevelAdjustValidationResult {
  allowed: boolean
  reason?: string
  isCrossLevel: boolean
  crossLevelWarning?: string
  scoreThresholdMet: boolean
  currentScore: number
  requiredScore: number
  operatorHasPermission: boolean
  risks: string[]
}

export interface LevelAdjustResult {
  success: boolean
  message: string
  oldLevel: number
  newLevel: number
  oldScore: number
  newScore: number
  benefitsAdded: UserBenefit[]
  benefitsRemoved: UserBenefit[]
  logId: number
}

export interface UserLevelLog {
  id: number
  userId: number
  userName: string
  oldLevel: number
  newLevel: number
  oldScore: number
  newScore: number
  operationType: string
  reason: string
  reasonDetail?: string
  scoreDetail?: string
  benefitsChanged?: {
    added: string[]
    removed: string[]
  }
  operatorId?: number
  operatorName?: string
  isCrossLevel: number
  isAutoAdjust: number
  analysisResult?: LevelAnalysisResult
  createTime: string
}

export interface LevelAnalysisResult {
  changeReason: string
  complianceStats: {
    totalViolations: number
    recentViolations: number
    violationLevel: string
  }
  activityStats: {
    avgLoginDays: number
    avgPublishCount: number
    avgInteractionCount: number
  }
  riskAssessment: string
  suggestions: string[]
  isSuspicious: boolean
}

export interface BatchLevelAdjustParams {
  userIds: number[]
  targetLevel: number
  reason: string
  reasonDetail?: string
}

export interface BatchLevelAdjustResult {
  total: number
  success: number
  fail: number
  results: Array<{
    userId: number
    userName: string
    success: boolean
    error?: string
    oldLevel?: number
    newLevel?: number
  }>
}

export interface UserLevelConfig {
  id: number
  level: number
  levelName: string
  minScore: number
  maxScore: number
  weightActivity: number
  weightContentQuality: number
  weightCompliance: number
  weightAccountAge: number
  benefits: string[]
  restrictions?: string[]
  description?: string
  isEnabled: number
  createTime: string
  updateTime: string
}

export interface LevelListUser extends UserAccount {
  userLevel: number
  levelScore: number
  levelScoreDetail: LevelScoreDetail
  isPermanentBanned: number
  privileges: string[]
  levelLastUpdateTime?: string
}

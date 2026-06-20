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
  ip: string
  riskLevel: number
  createTime: string
  updateTime: string
}

export interface ComplianceViolation {
  type: string
  typeName: string
  matched: string[]
  level: number
  message: string
}

export interface ComplianceCheckResult {
  passed: boolean
  violations: ComplianceViolation[]
  sensitiveMatches: string[]
  riskLevel: number
  intercepted: boolean
}

export interface CommentTraceResult {
  comment: {
    id: number
    content: string
    status: number
    violationType: string
    riskLevel: number
    createTime: string
    ip: string
  }
  source: {
    userId: number
    userName: string
    ip: string
    publishTime: string
    content: string
  }
  note: {
    id: number
    title: string
    authorName: string
  } | null
  riskAnalysis: {
    isAbnormal: boolean
    sameUserRecentCount: number
    sameContentCount: number
    sameIpCount: number
    riskLevel: number
    reasons: string[]
  }
  auditLogs: CommentAuditLogItem[]
}

export interface CommentAuditLogItem {
  id: number
  commentId: number
  action: number
  violationType: string
  violationDetail: string
  sensitiveWords: string
  handlerName: string
  handleNote: string
  createTime: string
}

export interface HighlightPart {
  text: string
  isSensitive: boolean
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

export interface BehaviorLog {
  id: number
  userId: number
  userName: string
  behaviorType: string
  targetId?: number
  targetType?: string
  content?: string
  ip?: string
  userAgent?: string
  isAbnormal: number
  abnormalType?: string
  riskLevel: number
  frequency: number
  timePeriod?: string
  intercepted: number
  createTime: string
}

export interface RiskControlLog {
  id: number
  userId: number
  userName: string
  violationType: string
  riskLevel: number
  behaviorDetail?: string
  frequencyData?: string
  timeRange?: string
  contentCompliance?: string
  intercepted: number
  operatorId?: number
  operatorName?: string
  autoHandled: number
  handleResult?: string
  createTime: string
}

export interface PunishmentRecord {
  id: number
  userId: number
  userName: string
  punishmentType: string
  riskLevel: number
  violationType: string
  reason: string
  reasonDetail?: string
  status: number
  startTime?: string
  endTime?: string
  duration?: number
  operatorId?: number
  operatorName?: string
  revokeOperatorId?: number
  revokeOperatorName?: string
  revokeTime?: string
  revokeReason?: string
  rectificationResult?: string
  riskControlLogId?: number
  isDuplicate: number
  isExcessive: number
  reviewReport?: string
  createTime: string
  updateTime: string
}

export interface UserRiskStatus {
  user: UserAccount & {
    riskLevel: number
    riskScore: number
    punishmentStatus: number
    punishmentExpireTime?: string
    lastViolationTime?: string
    violationCount: number
    riskControlRemark?: string
  }
  activePunishments: PunishmentRecord[]
  recentRiskLogs: RiskControlLog[]
}

export interface AnomalyDetectResult {
  hasAnomaly: boolean
  riskLevel: number
  violationTypes: string[]
  frequencyData: Record<string, { count: number; limit: number; ratio: number }>
}

export interface PunishmentValidation {
  valid: boolean
  issues: string[]
  isDuplicate: boolean
  isExcessive: boolean
  riskMatch: boolean
  warnings: string[]
}

export interface ViolationTrace {
  user: UserAccount
  behaviorLogs: BehaviorLog[]
  riskControlLogs: RiskControlLog[]
  punishmentRecords: PunishmentRecord[]
  rectificationRecords: PunishmentRecord[]
}

export interface ReviewReport {
  period: { start: string; end: string }
  violationStats: {
    total: number
    byType: Record<string, number>
    byLevel: Record<number, number>
    byTimeSlot: Record<string, number>
  }
  punishmentStats: {
    total: number
    byType: Record<string, number>
    avgDuration: number
  }
  riskTrend: Array<{ date: string; count: number }>
  suggestions: string[]
}

export interface RiskControlPermission {
  canView: boolean
  canHandle: boolean
  canBatchHandle: boolean
  canIntercept: boolean
  canRevoke: boolean
}

export interface ActivityScoreDetail {
  dailyLogin: number
  weeklyLogin: number
  monthlyLogin: number
  publish: number
  comment: number
  like: number
  interact: number
  share: number
}

export interface ActivityListUser extends UserAccount {
  activityLevel: number
  activityScore: number
  activityScoreDetail: ActivityScoreDetail
  lastActivityUpdateTime?: string
  isFocusMaintenance: number
  activityStrategies: string[]
  dailyLoginCount: number
  weeklyLoginCount: number
  monthlyLoginCount: number
  weeklyPublishCount: number
  weeklyCommentCount: number
  weeklyLikeCount: number
  weeklyInteractionCount: number
}

export interface FilterValidationResult {
  valid: boolean
  conflicts: string[]
}

export interface ActivityUserDetail {
  user: ActivityListUser
  levelInfo: {
    levelName: string
    levelColor: string
    nextLevel?: string
    nextLevelScore?: number
    scoreToNextLevel?: number
  }
  currentStrategies: Array<{
    key: string
    name: string
    enabled: boolean
    description: string
  }>
  availableStrategies: Array<{
    key: string
    name: string
    description: string
  }>
  recentScoreLogs: ActivityScoreLogItem[]
  refreshResult?: ActivityRefreshResult
}

export interface ActivityScoreLogItem {
  id: number
  userId: number
  userName: string
  oldLevel: number
  newLevel: number
  oldScore: number
  newScore: number
  scoreDetail?: string
  changeType: string
  logType: string
  abnormalType?: string
  isAbnormal: number
  fluctuationAmount?: number
  operatorId?: number
  operatorName?: string
  remark?: string
  createTime: string
}

export interface ActivityStrategy {
  id: number
  strategyName: string
  strategyType: string
  targetActivityLevel: string
  targetCondition?: string
  content?: string
  benefits?: string
  triggerMode: string
  triggerTime?: string
  status: number
  priority: number
  autoApply: number
  applyCount: number
  successCount: number
  failCount: number
  operatorId?: number
  operatorName?: string
  remark?: string
  createTime: string
  updateTime: string
}

export interface ActivityOperationRecordItem {
  id: number
  operationName: string
  operationType: string
  batchType?: string
  strategyId?: number
  targetActivityLevel?: string
  userScope?: string
  userCount: number
  successCount: number
  failCount: number
  executeType: string
  executeTime?: string
  executeEndTime?: string
  status: number
  operatorId?: number
  operatorName?: string
  operationResult?: string
  detail?: string
  createTime: string
  updateTime: string
}

export interface BatchActivityOperationResult {
  total: number
  success: number
  fail: number
  recordId?: number
  results: Array<{
    userId: number
    userName: string
    success: boolean
    error?: string
  }>
}

export interface ActivityAbnormalDetectResult {
  hasAbnormal: boolean
  abnormalTypes: string[]
  abnormalDetails: Array<{
    type: string
    name: string
    severity: 'high' | 'medium' | 'low'
    description: string
    evidence: Record<string, any>
  }>
  overallScore: number
  suggestions: string[]
}

export interface ActivityAbnormalWarningItem {
  id: number
  userId: number
  userName: string
  abnormalType: string
  abnormalName: string
  severity: number
  description: string
  evidence: string
  score: number
  handled: number
  createTime: string
}

export interface ActivityDataValidation {
  valid: boolean
  checks: Array<{
    name: string
    passed: boolean
    message?: string
  }>
  continuity: {
    passed: boolean
    missingDays?: string[]
  }
  consistency: {
    passed: boolean
    totalScore?: number
    detailSum?: number
  }
  rationality: {
    passed: boolean
    actualBehaviorScore?: number
    recordedScore?: number
  }
}

export interface ActivityRefreshResult {
  success: boolean
  message: string
  oldScore: number
  newScore: number
  oldLevel: number
  newLevel: number
  strategiesAdded: string[]
  strategiesRemoved: string[]
  markedAbnormal: boolean
  abnormalType?: string
}

export interface ActivityPermission {
  canView: boolean
  canCalculate: boolean
  canRefresh: boolean
  canBatch: boolean
  canAbnormal: boolean
  canStrategy: boolean
}

export interface DirectMessage {
  id: number
  conversationId: number
  senderId: number
  senderName: string
  senderAvatar: string
  receiverId: number
  receiverName: string
  receiverAvatar: string
  content: string
  contentType: number
  status: number
  readStatus: number
  readTime?: string
  riskLevel: number
  violationType: string
  violationDetail: string
  sensitiveWords: string
  intercepted: number
  ip: string
  deviceInfo: string
  userAgent: string
  isReported: number
  reportCount: number
  createTime: string
  updateTime: string
}

export interface DmConversation {
  id: number
  participantAId: number
  participantAName: string
  participantAAvatar: string
  participantBId: number
  participantBName: string
  participantBAvatar: string
  lastMessageId: number
  lastMessageContent: string
  lastMessageTime?: string
  messageCount: number
  unreadCountA: number
  unreadCountB: number
  violationCount: number
  riskLevel: number
  isBlockedByA: number
  isBlockedByB: number
  status: number
  createTime: string
  updateTime: string
}

export interface DmComplianceViolation {
  type: string
  typeName: string
  matched: string[]
  level: number
  message: string
}

export interface DmComplianceCheckResult {
  passed: boolean
  canSend: boolean
  violations: DmComplianceViolation[]
  sensitiveMatches: string[]
  riskLevel: number
  intercepted: boolean
  senderStatus: {
    isBanned: boolean
    isFlowLimited: boolean
    isDmRestricted: boolean
    dailyCount: number
    dailyLimit: number
  }
  recommendedPunishment?: {
    type: string
    typeName: string
    duration: number
    reason: string
  }
}

export interface DmPunishment {
  type: string
  typeName: string
  duration: number
  reason: string
}

export interface DmMessageTraceResult {
  message: DirectMessage
  conversation: DmConversation | null
  sender: {
    id: number
    nickname: string
    username: string
    avatar: string
    status: number
    riskLevel: number
    violationCount: number
    isPermanentBanned: number
  } | null
  receiver: {
    id: number
    nickname: string
    username: string
    avatar: string
  } | null
  riskAnalysis: {
    isAbnormal: boolean
    user24hMessageCount: number
    sameContentCount: number
    sameIpCount: number
    sameSenderToReceiver1h: number
    reportedByReceiver: number
    senderTotalReported: number
    finalRiskLevel: number
    reasons: string[]
  }
  auditLogs: DmAuditLogItem[]
  device: {
    ip: string
    deviceInfo: string
    userAgent: string
    sendTime: string
  }
}

export interface DmConversationTraceResult {
  conversation: DmConversation
  participants: {
    userA: {
      id: number
      nickname: string
      avatar: string
      riskLevel: number
      violationCount: number
    } | null
    userB: {
      id: number
      nickname: string
      avatar: string
      riskLevel: number
      violationCount: number
    } | null
  }
  messages: DirectMessage[]
  stats: {
    totalMessages: number
    interceptionCount: number
    riskMsgCount: number
    uniqueIps: number
    maxHourly: number
    avgPerHour: number
  }
  riskFlags: string[]
  timeline: Array<{
    id: number
    time: string
    senderId: number
    status: number
    riskLevel: number
    preview: string
  }>
}

export interface DmAuditLogItem {
  id: number
  messageId?: number
  conversationId?: number
  senderId: number
  senderName: string
  receiverId: number
  receiverName: string
  content?: string
  action: number
  violationType: string
  violationDetail: string
  sensitiveWords: string
  punishmentType?: string
  punishmentDuration?: number
  handlerId?: number
  handlerName: string
  handleNote: string
  ip: string
  deviceInfo: string
  createTime: string
}

export interface DmStats {
  total: number
  todayNew: number
  intercepted: number
  pending: number
  riskHigh: number
  reported: number
  conversations: number
  riskConversations: number
  interceptionRate: number
  riskRate: number
}

export interface InteractionData {
  id: number
  noteId: number
  dataType: string
  totalCount: number
  realCount: number
  fakeCount: number
  anomalyCount: number
  isAnomaly: number
  anomalyType: string
  anomalyDetail: string
  hotScore: number
  originalHotScore: number
  weightScore: number
  flowLevel: number
  originalFlowLevel: number
  status: number
  lastCalibrationTime: string
  lastCalibrationUserId: number
  lastCalibrationUserName: string
  isQuality: number
  qualityScore: number
  createTime: string
  updateTime: string
}

export interface InteractionAnomalyLog {
  id: number
  interactionDataId: number
  noteId: number
  dataType: string
  action: number
  anomalyType: string
  anomalyDetail: string
  beforeTotalCount: number
  afterTotalCount: number
  beforeRealCount: number
  afterRealCount: number
  beforeHotScore: number
  afterHotScore: number
  beforeFlowLevel: number
  afterFlowLevel: number
  beforeWeightScore: number
  afterWeightScore: number
  userId: number
  userName: string
  userRiskLevel: number
  userViolationCount: number
  sourceIp: string
  sourceDevice: string
  handlerId: number
  handlerName: string
  handleNote: string
  createTime: string
}

export interface InteractionOpsStats {
  total: number
  anomalyCount: number
  highAnomalyCount: number
  qualityCount: number
  calibratedCount: number
  zeroedCount: number
  todayAnomalyLogs: number
  anomalyRate: number
  avgHotScore: string
  flowDistribution: Array<{ flowLevel: number; count: number }>
}

export interface InteractionTraceResult {
  note: {
    id: number
    title: string
    authorId: number
    authorName: string
    flowLevel: number
    isHot: number
    viewCount: number
    likeCount: number
    commentCount: number
    shareCount: number
    createTime: string
  }
  summary: {
    totalReal: number
    totalFake: number
    totalAnomaly: number
    avgQuality: string
    uniqueIps: number
    uniqueUsers: number
    maxHourly: number
    authenticityRatio: string
  }
  interactions: Array<{
    dataType: string
    totalCount: number
    realCount: number
    fakeCount: number
    anomalyCount: number
    isAnomaly: number
    anomalyType: string
    hotScore: number
    weightScore: number
    flowLevel: number
    isQuality: number
    qualityScore: number
    status: number
  }>
  logs: Array<{
    id: number
    action: number
    anomalyType: string
    beforeTotalCount: number
    afterTotalCount: number
    beforeRealCount: number
    afterRealCount: number
    beforeHotScore: number
    afterHotScore: number
    beforeFlowLevel: number
    afterFlowLevel: number
    beforeWeightScore: number
    afterWeightScore: number
    handlerName: string
    handleNote: string
    createTime: string
  }>
  behaviors: Array<{
    id: number
    userId: number
    userName: string
    behaviorType: string
    ip: string
    isAbnormal: number
    abnormalType: string
    riskLevel: number
    createTime: string
  }>
}

export interface HotCommentItem {
  id: number
  commentId: number
  noteId: number
  userId: number
  nickname: string
  avatar: string
  content: string
  likeCount: number
  replyCount: number
  contentLength: number
  keywordDensity: number
  qualityScore: number
  hotScore: number
  weightLike: number
  weightReply: number
  weightTime: number
  weightQuality: number
  isTop: number
  topSource: string
  topOrder: number
  topTime: string
  topHandlerId: number
  topHandlerName: string
  status: number
  sourceType: string
  rank: number
  conflictReason: string
  lastRefreshTime: string
  expireTime: string
  createTime: string
  updateTime: string
}

export interface HotCommentLogItem {
  id: number
  hotCommentId: number
  commentId: number
  noteId: number
  action: number
  actionName: string
  beforeStatus: number
  afterStatus: number
  beforeIsTop: number
  afterIsTop: number
  beforeTopOrder: number
  afterTopOrder: number
  beforeHotScore: number
  afterHotScore: number
  beforeRank: number
  afterRank: number
  qualityScore: number
  conflictReason: string
  anomalyReason: string
  riskLevel: number
  violationType: string
  handlerId: number
  handlerName: string
  handleNote: string
  sourceType: string
  ip: string
  deviceInfo: string
  createTime: string
}

export interface HotCommentStats {
  total: number
  active: number
  top: number
  manualTop: number
  autoTop: number
  conflicted: number
  offShelf: number
  todayLogs: number
  avgHot: string
  notesCount: number
}

export interface HotCommentTraceResult {
  comment: {
    id: number
    noteId: number
    userId: number
    nickname: string
    content: string
    likeCount: number
    status: number
    riskLevel: number
    violationType: string
    ip: string
    createTime: string
  }
  note: { id: number; title: string; author: string } | null
  user: {
    id: number
    username: string
    nickname: string
    status: number
    riskLevel: number
    violationCount: number
  } | null
  hot: {
    id: number
    hotScore: number
    qualityScore: number
    weightLike: number
    weightReply: number
    weightTime: number
    weightQuality: number
    isTop: number
    topOrder: number
    topHandler: string
    topTime: string
    rank: number
    status: number
    conflictReason: string
    lastRefresh: string
  } | null
  operations: {
    totalOps: number
    topOps: number
    cancelOps: number
    offOps: number
    refreshOps: number
    conflictOps: number
  }
  logs: Array<{
    id: number
    action: number
    actionName: string
    beforeStatus: number
    afterStatus: number
    beforeIsTop: number
    afterIsTop: number
    beforeTopOrder: number
    afterTopOrder: number
    beforeHotScore: number
    afterHotScore: number
    beforeRank: number
    afterRank: number
    conflictReason: string
    anomalyReason: string
    qualityScore: number
    riskLevel: number
    violationType: string
    handler: string
    note: string
    createTime: string
  }>
  risks: string[]
}

export interface HotCommentAnomalyResult {
  suspicious: Array<{ handlerId: number; handlerName: string; count: number }>
  noteSuspicious: Array<{ noteId: number; manualTopCount: number }>
  rankHops: Array<{ commentId: number; hop: string; diff: number }>
}

export interface TrafficPool {
  id: number
  poolName: string
  poolCode: string
  poolLevel: number
  contentAdaptType: string
  dailyQuota: number
  usedQuota: number
  remainingQuota: number
  weightMultiplier: number
  minContentScore: number
  maxViolationCount: number
  admissionRules?: Record<string, any>
  description: string
  status: number
  contentCount: number
  avgExposure: number
  clickRate: number
  sortOrder: number
  createTime: string
  updateTime: string
}

export interface TrafficPoolPermission {
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canBatch: boolean
  canBatchStartStop: boolean
  canViewLogs: boolean
}

export interface AdmissionValidationResult {
  valid: boolean
  levelValid: boolean
  scoreValid: boolean
  violationValid: boolean
  adaptTypeValid: boolean
  errors: string[]
  warnings: string[]
}

export interface LevelRatioInfo {
  current: number
  proposed: number
  min: number
  max: number
  valid: boolean
}

export interface QuotaValidationResult {
  valid: boolean
  currentTotal: number
  proposedTotal: number
  platformMax: number
  overAllocated: boolean
  levelRatios: Record<number, LevelRatioInfo>
  warnings: string[]
  errors: string[]
}

export interface CreateValidationResult {
  admission: AdmissionValidationResult
  quota: QuotaValidationResult
  valid: boolean
}

export interface ConfigChangeImpact {
  affectedContentCount: number
  oldWeightMultiplier: number
  newWeightMultiplier: number
  oldDailyQuota: number
  newDailyQuota: number
  weightChangePercent: number
  quotaChangePercent: number
  estimatedExposureChange: number
}

export interface TrafficPoolUpdateResult {
  id: number
  impact: ConfigChangeImpact
}

export interface BatchOperationResult {
  total: number
  success: number
  fail: number
  results: Array<{
    id: number
    poolName: string
    success: boolean
    error?: string
  }>
}

export interface QuotaStats {
  platformMax: number
  totalQuota: number
  totalUsed: number
  totalRemaining: number
  usageRate: number
  byLevel: Record<number, {
    quota: number
    used: number
    remaining: number
    count: number
  }>
  levelRatios: Record<number, {
    quotaRatio: number
    usageRate: number
  }>
}

export interface TrafficPoolLog {
  id: number
  poolId: number
  poolName: string
  logType: string
  operatorId?: number
  operatorName: string
  operatorRole: string
  oldConfig?: Record<string, any>
  newConfig?: Record<string, any>
  changedFields: string
  reason: string
  status: number
  blockReason: string
  validationResult?: Record<string, any>
  affectedContentCount: number
  oldWeightMultiplier?: number
  newWeightMultiplier?: number
  oldDailyQuota?: number
  newDailyQuota?: number
  ip: string
  userAgent: string
  createTime: string
}

export interface TrafficPoolLogAnalyzeResult {
  log: TrafficPoolLog
  pool: TrafficPool | null
  oldConfig: Record<string, any> | null
  newConfig: Record<string, any> | null
  validationResult: Record<string, any> | null
  diff: {
    changedFields: string[]
    oldWeightMultiplier?: number
    newWeightMultiplier?: number
    oldDailyQuota?: number
    newDailyQuota?: number
  }
}

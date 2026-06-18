export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
  errors?: Record<string, string>
}

export interface PaginationParams {
  page?: number
  pageSize?: number
  keyword?: string
  sortBy?: string
  sortOrder?: 'ASC' | 'DESC'
  [key: string]: any
}

export interface PaginationResult<T> {
  list: T[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface EnumOption {
  label: string
  value: number | string
  color?: string
}

export interface UserInfo {
  id: number
  username: string
  realName?: string
  email?: string
  phone?: string
  avatar?: string
  department?: string
  role: {
    id: number
    code: string
    name: string
    description?: string
  }
  permissions: string[]
}

export interface LoginParams {
  username: string
  password: string
}

export interface LoginResult {
  accessToken: string
  refreshToken: string
  userInfo: UserInfo
}

export interface ChangePasswordParams {
  oldPassword: string
  newPassword: string
}

export interface RoleItem {
  id: number
  code: string
  name: string
  description?: string
  permissions: string[]
  sortOrder: number
  status: number
  createdAt?: string
}

export interface UserItem {
  id: number
  username: string
  realName?: string
  email?: string
  phone?: string
  avatar?: string
  department?: string
  roleId: number
  status: number
  lastLoginAt?: string
  lastLoginIp?: string
  loginCount: number
  remark?: string
  role?: {
    id: number
    code: string
    name: string
  }
  createdAt?: string
}

export interface ContentItem {
  id: number
  title: string
  subtitle?: string
  category: number
  coverImage?: string
  posterImage?: string
  videoUrl?: string
  description?: string
  director?: string
  actors?: string
  releaseYear?: number
  releaseDate?: string
  duration?: number
  area?: string
  language?: string
  tags: string[]
  totalEpisodes: number
  updatedEpisodes: number
  copyrightId?: number
  copyrightType?: number
  resolution?: string
  bitrate?: number
  clarityLevel?: number
  qualificationFiles?: string[]
  rating: number
  playCount: number
  likeCount: number
  collectCount: number
  commentCount: number
  auditStatus: number
  auditRemark?: string
  isHot: number
  isRecommend: number
  isVip: number
  sortOrder: number
  status: number
  copyright?: {
    id: number
    name: string
    type: number
    status?: number
    endDate?: string
  }
  createdAt?: string
}

export interface CopyrightItem {
  id: number
  code: string
  name: string
  type: number
  supplierName: string
  supplierContact?: string
  supplierPhone?: string
  contractNo?: string
  contractFile?: string
  authorizationFile?: string
  startDate: string
  endDate: string
  territories?: string
  licenseFee: number
  currency?: string
  paymentStatus: number
  contentCount: number
  description?: string
  attachments: any[]
  status: number
  remark?: string
  relatedContents?: any[]
  createdAt?: string
}

export interface AdvertisementItem {
  id: number
  name: string
  code: string
  type: number
  position?: string
  title?: string
  subtitle?: string
  image?: string
  video?: string
  redirectUrl?: string
  redirectType: number
  targetId?: number
  advertiserName?: string
  startTime: string
  endTime: string
  budgetAmount: number
  spentAmount: number
  impressionCount: number
  clickCount: number
  ctr: number
  status: number
  auditStatus: number
  auditRemark?: string
  sortOrder: number
  createdAt?: string
}

export interface ActivityItem {
  id: number
  name: string
  code: string
  type: number
  theme?: string
  image?: string
  banner?: string
  description?: string
  rules?: string
  startTime: string
  endTime: string
  signupStart?: string
  signupEnd?: string
  config: Record<string, any>
  prizePool: any[]
  totalBudget: number
  usedBudget: number
  participantLimit: number
  participantCount: number
  pageView: number
  uniqueVisitor: number
  shareCount: number
  status: number
  isHot: number
  isTop: number
  sortOrder: number
  redirectUrl?: string
  remark?: string
  createdAt?: string
}

export interface CommentItem {
  id: number
  contentId: number
  userId: number
  parentId?: number
  replyToUserId?: number
  commentContent: string
  commentImages: string[]
  likeCount: number
  replyCount: number
  isTop: number
  isHot: number
  commentStatus: number
  violationLevel: number
  violationType?: string
  filterResult?: Record<string, any>
  auditStatus: number
  auditRemark?: string
  auditorId?: number
  auditTime?: string
  ipAddress?: string
  source: string
  content?: { id: number; title: string }
  commentUser?: { id: number; username: string; avatar?: string }
  replies?: CommentItem[]
  createdAt?: string
}

export interface MemberItem {
  id: number
  userId: number
  memberNo: string
  memberLevel: number
  memberStatus: number
  startDate?: string
  expireDate?: string
  autoRenew: number
  balance: number
  totalSpent: number
  points: number
  totalPoints: number
  couponCount: number
  currentPlan?: string
  planPrice: number
  planDuration: number
  privileges: string[]
  lastActiveAt?: string
  remark?: string
  user?: { id: number; username: string; realName?: string; avatar?: string; phone?: string }
  createdAt?: string
}

export interface MessageItem {
  id: number
  messageType: number
  title: string
  content?: string
  senderId?: number
  receiverId?: number
  isBroadcast: number
  isRead: number
  readTime?: string
  linkType?: string
  linkId?: number
  linkUrl?: string
  priority: number
  extraData?: Record<string, any>
  pushChannel?: string
  pushStatus: number
  scheduledTime?: string
  createdAt?: string
}

export interface OperationLogItem {
  id: number
  operatorId?: number
  operatorName?: string
  operationType: string
  operationModule: string
  operationDesc?: string
  targetType?: string
  targetId?: string
  targetName?: string
  beforeData?: Record<string, any>
  afterData?: Record<string, any>
  requestMethod?: string
  requestUrl?: string
  requestParams?: Record<string, any>
  responseCode?: number
  ipAddress?: string
  userAgent?: string
  duration?: number
  isSuccess: number
  errorMessage?: string
  createdAt?: string
}

export interface DashboardStats {
  contentStats: {
    total: number
    todayNew: number
    byCategory: Array<{ category: number; count: number }>
    byAuditStatus: Array<{ auditStatus: number; count: number }>
  }
  userStats: {
    total: number
    activeCount: number
    todayNew: number
  }
  adStats: {
    totalBudget: number
    totalSpent: number
    totalImpression: number
    totalClick: number
    avgCtr: number
  }
  activityStats: {
    totalBudget: number
    totalSpent: number
    totalParticipant: number
  }
  copyrightStats: {
    activeCount: number
    expiringCount: number
    expiredCount: number
  }
  memberStats: Array<{ level: number; count: number }>
}

export interface PlayTrendItem {
  date: string
  playCount: number
}

export interface AuditEfficiencyItem {
  date: string
  totalAudited: number
  approvedCount: number
  approvalRate: number
  avgDuration: number
}

export interface RevenueOverviewItem {
  date: string
  adRevenue: number
  memberRevenue: number
  totalRevenue: number
}

export interface UnreadCountResult {
  total: number
  byType: Array<{ messageType: number; count: number }>
}

export interface MemberStatsResult {
  byLevel: Array<{ level: number; count: number }>
  totalSpent: number
  totalPoints: number
}

export interface CommentStatsResult {
  total: number
  byStatus: Array<{ status: number; count: number }>
  violationCount: number
}

export interface ShortVideoItem {
  id: number
  title: string
  category: number
  coverImage: string
  videoUrl: string
  description: string
  tags: string[]
  videoFingerprint?: string
  creatorId?: number
  creatorUid?: string
  creatorLevel: number
  hotScore: number
  hotRanking: number
  publishBatch?: string
  contentRating: number
  videoDuration: number
  videoFormat?: string
  videoQuality: number
  fileSize: number
  bitrateKbps: number
  frameRate: number
  violationCount: number
  lastViolationType?: string
  lastViolationAt?: string
  isArchived: number
  archivedAt?: string
  playCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  danmakuCount: number
  collectCount: number
  auditStatus: number
  auditRemark?: string
  status: number
  statusLogs: StatusLogItem[]
  trafficStats?: Record<string, any>
  isVip: number
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface StatusLogItem {
  id: number
  contentId: number
  fromStatus: number
  toStatus: number
  operatorId?: number
  operatorName?: string
  changeReason?: string
  remark?: string
  operationType: string
  extraData?: Record<string, any>
  ipAddress?: string
  createdAt: string
}

export interface VideoFingerprintCheckResult {
  isUnique: boolean
  duplicateContent?: { id: number; title: string }
}

export interface BatchOperationResult {
  successCount: number
  skippedCount: number
  successIds: number[]
  skippedIds: number[]
}

export interface ArticleItem {
  id: number
  title: string
  category: number
  coverImage: string
  description: string
  tags: string[]
  articleType: number
  articleCode: string
  domainCategory: string
  publishChannel: number
  publishPermission: number
  layoutTemplate: string
  wordCount: number
  summary: string
  coverImages: string[]
  contentImages: string[]
  imageResolution?: string
  topicId?: number
  topicTitle?: string
  resourcePosition?: string
  isTop: number
  topExpireAt?: string
  weightScore: number
  viewCount: number
  likeCountArticle: number
  favoriteCount: number
  commentCountArticle: number
  shareCountArticle: number
  versionNo: number
  latestPublishedVersion: number
  publishAccount?: string
  publishAccountId?: number
  sensitiveWordCheck: number
  sensitiveWords: string[]
  contentHash?: string
  articleQuality: number
  isExpired: number
  expireAt?: string
  linksValid: number
  invalidLinks: string[]
  checkReport?: CheckReport
  auditStatus: number
  auditRemark?: string
  status: number
  statusLogs: StatusLogItem[]
  isVip: number
  sortOrder: number
  createdAt?: string
  updatedAt?: string
}

export interface ArticleVersionItem {
  id: number
  contentId: number
  versionNo: number
  title: string
  description: string
  coverImages: string[]
  summary: string
  wordCount: number
  layoutTemplate: string
  editMode: number
  publishStatus: number
  operatorId?: number
  operatorName?: string
  changeLog: string[]
  auditStatus: number
  auditRemark?: string
  auditTime?: string
  auditorId?: number
  auditorName?: string
  createdAt: string
}

export interface CheckReport {
  overallScore: number
  checks: CheckItem[]
  issues: string[]
  suggestions: string[]
}

export interface CheckItem {
  item: string
  status: 'pass' | 'warning' | 'fail'
  score: number
  message: string
}

export interface TitleCheckResult {
  isUnique: boolean
  duplicateTitle?: string
}

export interface ContentCheckResult {
  isUnique: boolean
  duplicateContent?: { id: number; title: string }
}

export interface TopicItem {
  id: number
  topicCode: string
  title: string
  description: string
  topicType: number
  coverTemplate: string
  sortRule: number
  coverImage?: string
  bannerImage?: string
  iconImage?: string
  operationStartTime?: string
  operationEndTime?: string
  coverCategories: string[]
  contentCount: number
  viewCount: number
  hotScore: number
  weightScore: number
  isCore: number
  resourcePosition?: string
  resourceLink?: string
  operationBatch?: string
  creatorId?: number
  creatorName?: string
  operatorId?: number
  operatorName?: string
  status: number
  auditStatus: number
  auditRemark?: string
  sortOrder: number
  tags: string[]
  extraConfig?: Record<string, any>
  statusLogs: StatusLogItem[]
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface TopicContentItem {
  id: number
  topicId: number
  contentId: number
  contentCategory: number
  contentTitle: string
  contentCover?: string
  sortOrder: number
  weightScore: number
  isRecommended: number
  mountTime?: string
  mountOperatorId?: number
  mountOperatorName?: string
  remark?: string
  createdAt?: string
  updatedAt?: string
}

export interface TopicTitleCheckResult {
  isUnique: boolean
  duplicateTopic?: { id: number; title: string }
}

export interface TopicTimeOverlapResult {
  hasOverlap: boolean
  overlappingTopics: Array<{
    id: number
    title: string
    operationStartTime: string
    operationEndTime: string
  }>
}

export interface ContentMountCheckResult {
  mounted: Array<{ contentId: number; topicContentId: number }>
  notMounted: number[]
}

export interface TopicBatchMountItem {
  contentId: number
  sortOrder?: number
  weightScore?: number
  isRecommended?: number
}

export interface AuditTaskAssignRule {
  id: number
  name: string
  category?: number
  minDuration?: number
  maxDuration?: number
  riskLevel?: number
  reviewerIds: number[]
  reviewerNames: string[]
  reviewLevel: number
  priority: number
  status: number
  createdAt?: string
}

export interface AuditHistoryRecord {
  id: number
  auditNo: string
  contentId: number
  reviewLevel: number
  auditStatus: number
  auditRemark?: string
  rejectReasonCategory?: string
  rejectReasonDetail?: string
  auditorId?: number
  auditorName?: string
  auditorRole?: string
  auditTime?: string
  fromStatus: number
  toStatus: number
  ipAddress?: string
  extraData?: Record<string, any>
}

export interface AuditDetailInfo {
  basicInfo: {
    id: number
    title: string
    category: number
    coverImage?: string
    videoUrl?: string
    duration?: number
    description?: string
    director?: string
    actors?: string
    releaseYear?: number
    area?: string
    language?: string
    tags: string[]
    totalEpisodes: number
    updatedEpisodes: number
    resolution?: string
    clarityLevel?: number
    fileSize?: number
    bitrate?: number
    frameRate?: number
    videoFormat?: string
  }
  copyrightInfo: {
    exists: boolean
    id?: number
    code?: string
    name?: string
    type?: number
    supplierName?: string
    startDate?: string
    endDate?: string
    status?: number
    missingFields?: string[]
  }
  riskInfo: {
    riskLevel: number
    riskScore: number
    riskTags: string[]
    autoDetectedIssues: string[]
    requiresMultiLevelReview: boolean
    reviewLevel: number
  }
  assignInfo: {
    taskId: string
    priority: number
    assignedAt?: string
    deadline?: string
    currentReviewer?: {
      id: number
      name: string
      department?: string
    }
    reviewHistory: AuditHistoryRecord[]
  }
  completeness: {
    isComplete: boolean
    missingFields: string[]
    canStartAudit: boolean
  }
}

export interface AuditSubmitData {
  contentId: number
  auditStatus: number
  auditRemark?: string
  rejectReasonCategory?: string
  rejectReasonDetail?: string
  reviewLevel?: number
  nextReviewerId?: number
}

export interface BatchAuditParams {
  ids: number[]
  action: string
  auditStatus?: number
  auditRemark?: string
  rejectReasonCategory?: string
  rejectReasonDetail?: string
  priority?: number
}

export interface AuditTaskPoolItem {
  taskId: string
  contentId: number
  contentTitle: string
  category: number
  coverImage?: string
  riskLevel: number
  priority: number
  auditStatus: number
  reviewLevel: number
  assignedTo?: number
  assignedName?: string
  deadline?: string
  submittedAt?: string
  createdAt?: string
  isArchived?: boolean
  archivedAt?: string
  videoDuration?: number
  creatorName?: string
  creatorLevel?: number
}

export interface AuditTraceRecord {
  auditNo: string
  contentId: number
  contentTitle: string
  status: string
  currentReviewer: string
  totalSteps: number
  currentStep: number
  steps: Array<{
    level: number
    name: string
    reviewer?: string
    status: string
    result?: string
    remark?: string
    time?: string
  }>
  timeline: Array<{
    time: string
    action: string
    operator: string
    detail: string
    status: string
  }>
  creatorInfo?: {
    id: number
    name: string
    level?: number
    historyViolationCount: number
  }
}

export interface QualityCheckReport {
  id: number
  reportNo: string
  reportDate: string
  period: string
  totalAudited: number
  exceptionCount: number
  exceptionRate: number
  passRate: number
  auditorStats: Array<{
    auditorId: number
    auditorName: string
    totalCount: number
    exceptionCount: number
    avgDuration: number
    approvalRate: number
    efficiencyScore: number
  }>
  exceptionList: Array<{
    id: number
    type: string
    typeLabel: string
    severity: string
    contentId: number
    contentTitle: string
    auditNo: string
    auditorId?: number
    auditorName?: string
    description: string
    suggestedAction?: string
    status: number
    createdAt: string
  }>
  summary: {
    strengths: string[]
    weaknesses: string[]
    suggestions: string[]
  }
}

export interface AssignPreviewResult {
  reviewerId: number
  reviewerName: string
  reviewerRole: string
  department: string
  matchScore: number
  matchReasons: string[]
  currentWorkload: number
  avgHandleTime: number
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  duplicateTaskIds?: string[]
  recentAuditRecords?: Array<{
    auditNo: string
    auditorId: number
    auditorName: string
    auditTime: string
    result: string
  }>
}

export interface RejectReasonTemplate {
  value: string
  label: string
  examples: string[]
}

export interface AiRiskItem {
  type: string
  label: string
  severity: 'low' | 'medium' | 'high'
  score: number
  description: string
  positions?: Array<{ paragraph?: number; offset?: number; length?: number; imageIndex?: number; text?: string }>
  suggestions: string[]
  handled: boolean
}

export interface AiPreScreenResult {
  screenId: string
  articleId: number
  screenTime: string
  overallResult: 'passed' | 'warning' | 'failed' | 'pending'
  overallScore: number
  riskItems: AiRiskItem[]
  handledRiskCount: number
  totalRiskCount: number
  contentHash: string
  imageHashes?: string[]
  suspiciousTags: string[]
  requiresManualAudit: boolean
}

export interface ArticleAuditDetail {
  articleId: number
  articleCode: string
  title: string
  summary: string
  coverImages: string[]
  bodyImages: string[]
  domainCategory: string
  articleType: number
  articleQuality: number
  wordCount: number
  layoutTemplate: string
  author: { id: number; name: string; level: number; violationCount: number }
  publishAccount: string
  aiPreScreen: AiPreScreenResult
  auditStatus: number
  assignedAuditor?: { id: number; name: string }
  versionNo: number
  riskLevel: number
  riskTags: string[]
  deadline?: string
  submittedAt: string
  publishPermission: number
  distributionQualification: boolean
  previousAuditLogs: Array<{
    auditNo: string
    auditorName: string
    auditStatus: number
    reviewLevel: number
    rejectReason?: string
    auditTime: string
    modifiedAfterAudit?: boolean
  }>
}

export interface ArticleAuditSubmitData {
  articleId: number
  articleCode: string
  auditStatus: number
  reviewLevel?: number
  rejectReasonCategory?: string
  rejectReasonDetail?: string
  auditRemark?: string
  handledRiskItems?: string[]
  contentConsistentHash?: string
  suspectedReviewRequested?: boolean
}

export interface ArticleAuditPoolItem {
  articleId: number
  articleCode: string
  title: string
  summary: string
  coverImage?: string
  domainCategory: string
  domainCategoryLabel: string
  articleType: number
  articleTypeLabel: string
  articleQuality: number
  wordCount: number
  authorName: string
  publishAccount: string
  auditStatus: number
  auditStatusLabel: string
  aiScreenResult: string
  aiScreenResultLabel: string
  riskLevel: number
  riskLevelLabel: string
  riskTags: string[]
  assignedAuditorName?: string
  versionNo: number
  deadline?: string
  isOverdue: boolean
  submittedAt: string
  publishPermission: number
  distributionQualification: boolean
  aiRiskCount: number
  aiUnresolvedRiskCount: number
}

export interface BatchArticleAuditParams {
  action: 'approve_low_risk' | 'mark_overdue' | 'review_suspected' | 'reject' | 'export_ledger'
  articleIds: number[]
  domainCategory?: string
  riskLevel?: number
  rejectReasonCategory?: string
  rejectReasonDetail?: string
  remark?: string
}

export interface ArticleAuditTraceRecord {
  traceId: string
  articleCode: string
  auditBatch: string
  riskTags: string[]
  articleTitle: string
  auditStatus: number
  auditStatusLabel: string
  creatorName: string
  timeline: Array<{
    action: string
    operator: string
    operatorRole: string
    time: string
    status: string
    detail: string
    riskChecks: string[]
  }>
  contentVersionDiff: Array<{
    versionNo: number
    titleHashMatch: boolean
    contentHashMatch: boolean
    bodyImageCountDiff: number
    wordCountDiff: number
    modifiedBy: string
    modifiedAt: string
  }>
  riskMatchAnalysis: {
    expectedResult: string
    actualResult: string
    matchRate: number
    mismatchedRisks: string[]
  }
  exceptions: Array<{
    type: string
    typeLabel: string
    description: string
    suggestedAction: string
    severity: string
  }>
}

export interface AuditLedgerItem {
  ledgerNo: string
  articleCode: string
  articleTitle: string
  domainCategory: string
  auditAction: string
  auditorName: string
  auditTime: string
  auditRemark: string
  aiRiskCountBefore: number
  aiRiskCountAfter: number
  publishPermission: string
  distributionQualification: string
}

export interface ArticleAuditLedgerExportResult {
  exportId: string
  fileName: string
  generatedAt: string
  totalCount: number
  url?: string
  ledgerItems: AuditLedgerItem[]
}

export interface ArticleAuditDuplicateCheckResult {
  isDuplicate: boolean
  duplicateWithinMinutes: number
  lastAuditRecord?: {
    auditNo: string
    auditorName: string
    auditStatus: number
    auditTime: string
  }
  contentModifiedAfter: boolean
  currentHash: string
  previousHash: string
}

export interface ArticleAuditConsistencyCheck {
  contentUnchanged: boolean
  titleUnchanged: boolean
  bodyUnchanged: boolean
  imagesUnchanged: boolean
  wordCountDelta: number
  auditResultRiskMatch: boolean
  unresolvedRisks: string[]
  canSubmit: boolean
  blockReasons: string[]
}

export interface ArticleAuditQCResult {
  qcId: string
  period: string
  totalAudited: number
  exceptionCount: number
  misjudgmentRate: string
  avgConsistency: number
  auditors: Array<{
    auditorId: number
    auditorName: string
    auditCount: number
    misjudgmentCount: number
    missedRiskCount: number
    accuracy: number
  }>
  riskTagDistribution: Array<{ tag: string; count: number }>
}

export interface CommentAuditContextComment {
  id: number
  userId: number
  userAvatar?: string
  username: string
  userLevel: number
  content: string
  status: number
  violationLevel: number
  createdAt: string
  isTarget?: boolean
}

export interface CommentAuditDetail {
  commentId: number
  commentUid: string
  contentId: number
  contentTitle: string
  contentCoverImage?: string
  contentCategory: number
  userId: number
  username: string
  userAvatar?: string
  userUid: string
  userLevel: number
  userViolationCount: number
  userIsMuted: boolean
  userMuteExpireAt?: string
  commentContent: string
  commentImages: string[]
  commentSource: string
  commentIp: string
  violationLevel: number
  violationType?: string
  auditStatus: number
  auditSource: string
  reportedCount: number
  likeCount: number
  replyCount: number
  createdAt: string
  publishedAt: string
  context: {
    beforeComments: CommentAuditContextComment[]
    afterComments: CommentAuditContextComment[]
    hasContext: boolean
  }
  riskDetails: {
    riskScore: number
    riskTags: string[]
    autoDetected: Array<{ type: string; label: string; severity: string; matchText?: string }>
  }
  reportInfo?: {
    reportCount: number
    reportReasons: string[]
    reportUsers: Array<{ userId: number; username: string; reason: string; time: string }[]>
  }
  previousAudit?: Array<{
    auditorId: number
    auditorName: string
    action: string
    reason?: string
    time: string
    remark?: string
  }>
}

export interface CommentAuditPoolItem {
  commentId: number
  commentUid: string
  contentId: number
  contentTitle: string
  userId: number
  userUid: string
  username: string
  userAvatar?: string
  commentContentPreview: string
  commentContentShort: string
  hasImage: boolean
  violationLevel: number
  violationType?: string
  auditStatus: number
  auditSource: string
  auditSourceLabel: string
  riskScore: number
  reportedCount: number
  likeCount: number
  replyCount: number
  auditorName?: string
  commentSource: string
  createdAt: string
  isOverdue: boolean
  hasContext: boolean
  batchId?: string
}

export interface CommentAuditSubmitData {
  commentId: number
  action: 'approve' | 'hide' | 'delete' | 'mute'
  violationType?: string
  violationRemark?: string
  muteLevel?: number
  muteDays?: number
  remark?: string
  userLimitFlowTriggered?: boolean
}

export interface BatchCommentAuditParams {
  action: 'clean_history' | 'approve_compliant' | 'mark_suspected'
  commentIds: number[]
  violationType?: string
  startTime?: string
  endTime?: string
  contentId?: number
  remark?: string
}

export interface UserMuteResult {
  userId: number
  muted: boolean
  muteLevel: number
  muteDays: number
  mutedAt: string
  expireAt?: string
  violationCount: number
  flowLimited: boolean
  flowLimitLevel?: string
}

export interface CommentAuditActionResult {
  success: boolean
  commentStatus: number
  userViolationCount: number
  limitFlowTriggered: boolean
  punishInfo?: UserMuteResult
  message?: string
}

export interface BatchCommentProgress {
  batchId: string
  total: number
  processed: number
  successCount: number
  failedCount: number
  skippedCount: number
  progress: number
  status: 'running' | 'completed' | 'failed'
  startedAt: string
  errorMessage?: string
}

export interface CommentAuditTraceRecord {
  traceId: string
  commentUid: string
  commentId: number
  userUid: string
  contentId: number
  currentStatus: number
  currentStatusLabel: string
  timeline: Array<{
    time: string
    operator: string
    operatorRole: string
    action: string
    detail: string
    ip?: string
    source?: string
  }>
  userPunishmentChain: Array<{
    time: string
    reason: string
    action: string
    duration: string
  }>
  auditConsistency: {
    sameTypeRate: number
    deviationReasons: string[]
    abnormalJudgements: string[]
  }
  exceptions: Array<{
    type: string
    description: string
    severity: string
  }>
}

export interface CommentAuditQCResult {
  qcId: string
  period: string
  totalAudited: number
  totalMuted: number
  totalLimitFlow: number
  exceptionRate: string
  auditors: Array<{
    auditorId: number
    auditorName: string
    auditCount: number
    approveCount: number
    muteCount: number
    deleteCount: number
    avgHandleTime: number
    exceptionCount: number
    consistency: number
  }>
  violationTypeDistribution: Array<{ type: string; count: number; ratio: number }>
}

export interface CommentContentRelatedContent {
  id: number
  title: string
  type: number
  status: number
  auditor?: string
}

export interface AuditRuleTriggerCondition {
  conditionKey: string
  conditionLabel: string
  fieldType: 'select' | 'number' | 'number_range' | 'time_range'
  value?: any
  valueStart?: number | string
  valueEnd?: number | string
  options?: Array<{ label: string; value: any }>
  unit?: string
  required: boolean
}

export interface AuditRuleActionConfig {
  actionKey: string
  actionLabel: string
  actionParams: Record<string, any>
  enabled: boolean
}

export interface AuditRule {
  id: number
  ruleCode: string
  ruleName: string
  ruleType: string
  ruleCategory: string
  ruleDescription: string
  applicableCategory: string[]
  applicableRiskLevels: number[]
  effectiveStartTime?: string
  effectiveEndTime?: string
  effectivePeriod?: string
  priority: number
  ruleStatus: number
  isCoreDefault: boolean
  isSystemDefault: boolean
  version: number
  effectBatch: string
  triggerConditions: AuditRuleTriggerCondition[]
  actions: AuditRuleActionConfig[]
  ruleParams: Record<string, any>
  sortOrder: number
  remark?: string
  createdBy: number
  createdByName: string
  updatedBy: number
  updatedByName: string
  createdAt: string
  updatedAt: string
  publishedAt?: string
  lastEnabledAt?: string
}

export interface AuditRuleListItem extends AuditRule {
  effectStatus: 'active' | 'upcoming' | 'expired' | 'disabled' | 'draft'
  conflictCount: number
  affectedTasksCount: number
}

export interface AuditRuleCreateForm {
  ruleName: string
  ruleType: string
  ruleCategory: string
  ruleDescription: string
  applicableCategory: string[]
  applicableRiskLevels: number[]
  effectiveStartTime?: string
  effectiveEndTime?: string
  priority: number
  triggerConditions: AuditRuleTriggerCondition[]
  actions: AuditRuleActionConfig[]
  ruleParams: Record<string, any>
  sortOrder: number
  remark?: string
}

export interface AuditRuleEditForm extends AuditRuleCreateForm {
  id: number
  version?: number
  resetEffectiveTime?: boolean
}

export interface RuleConflictCheckResult {
  hasConflict: boolean
  conflicts: Array<{
    type: 'time_overlap' | 'condition_duplicate' | 'logic_contradict' | 'param_duplicate'
    conflictRuleId: number
    conflictRuleName: string
    conflictRuleCode: string
    description: string
    severity: 'high' | 'medium' | 'low'
    field?: string
    suggestion: string
  }>
  hasParamsMissing: boolean
  missingFields: string[]
  canSubmit: boolean
  totalIssues: number
}

export interface RuleConsistencyCheckResult {
  consistent: boolean
  totalRules: number
  conflictCount: number
  contradictionCount: number
  gapCount: number
  issues: Array<{
    type: 'conflict' | 'contradiction' | 'gap' | 'duplicate'
    level: 'high' | 'medium' | 'low'
    ruleIds: number[]
    ruleNames: string[]
    description: string
    suggestion: string
  }>
  coverage: {
    totalCategories: number
    coveredCategories: number
    coverageRate: number
    missingCategories: string[]
  }
  score: number
}

export interface AuditRuleModifyRecord {
  id: number
  ruleId: number
  ruleCode: string
  version: number
  effectBatch: string
  modifyType: string
  modifyTypeLabel: string
  modifierId: number
  modifierName: string
  modifyTime: string
  changeSummary: string
  beforeSnapshot?: Partial<AuditRule>
  afterSnapshot?: Partial<AuditRule>
  changedFields: string[]
  remark?: string
}

export interface AuditRuleTraceResult {
  traceId: string
  ruleCode: string
  ruleName: string
  currentVersion: number
  currentEffectBatch: string
  versionHistory: Array<{
    version: number
    effectBatch: string
    publishTime: string
    publisher: string
    changeSummary: string
    affectedTasksCount: number
  }>
  modifyRecords: AuditRuleModifyRecord[]
  conflictHistory: Array<{
    time: string
    type: string
    description: string
    resolved: boolean
    resolution?: string
  }>
}

export interface BatchRuleActionParams {
  action: 'batch_enable' | 'batch_disable' | 'batch_sync' | 'batch_delete' | 'batch_export'
  ruleIds: number[]
  targetCategory?: string
  syncMode?: 'copy' | 'move' | 'merge'
}

export interface BatchRuleActionResult {
  batchId: string
  action: string
  total: number
  successCount: number
  failedCount: number
  skippedCount: number
  skippedReasons: Array<{ ruleId: number; ruleName: string; reason: string }>
  generatedBatch?: string
  newRuleCodes?: string[]
}

export interface CopyrightQualificationFile {
  id?: string
  type: string
  typeLabel?: string
  name: string
  url: string
  size?: number
  uploadProgress?: number
  validityStatus?: string
  validityMessage?: string
  isVerified?: boolean
  uploadTime?: string
  ocrResult?: Record<string, any>
}

export interface CopyrightFormData {
  id?: number
  code: string
  name: string
  type: number
  contentType: number
  supplierName: string
  supplierContact?: string
  supplierPhone?: string
  contractNo?: string
  startDate: string
  endDate: string
  territories?: string
  licenseScope?: string[]
  licenseFee: number
  currency?: string
  paymentStatus: number
  ownershipStatus?: number
  complianceStatus?: number
  bindStatus?: number
  description?: string
  remark?: string
  status?: number
  qualificationFiles?: CopyrightQualificationFile[]
  contentIds?: number[]
  copyrightCertificate?: string
  authorizationAgreement?: string
  ownershipProof?: string
}

export interface CopyrightDetail extends CopyrightItem {
  contentType?: number
  licenseScope?: string[]
  ownershipStatus?: number
  complianceStatus?: number
  bindStatus?: number
  qualificationFiles?: CopyrightQualificationFile[]
  relatedContents?: Array<{
    id: number
    title: string
    category: number
    status: number
    auditStatus?: number
  }>
  auditTrail?: Array<{
    time: string
    operator: string
    action: string
    detail: string
  }>
}

export interface CopyrightConflictCheckResult {
  hasConflict: boolean
  conflicts: Array<{
    type: 'duplicate_code' | 'content_conflict' | 'scope_overlap' | 'validity_mismatch'
    level: 'high' | 'medium' | 'low'
    message: string
    relatedCopyrightId?: number
    relatedCopyrightCode?: string
    relatedContentId?: number
    relatedContentTitle?: string
  }>
  canSubmit: boolean
  duplicateCode?: boolean
  duplicateCodeInfo?: {
    existingCopyrightIds?: number[]
    existingCopyrightCodes?: string[]
  }
  contentConflicts?: Array<{
    contentId: number
    existingCopyrightId: number
    existingCopyrightCode: string
  }>
  details?: {
    inconsistency?: Array<'scope' | 'period' | 'ownership'>
  }
}

export interface CopyrightTraceItem {
  id: number
  code: string
  name: string
  type: number
  contentType: number
  supplierName: string
  startDate: string
  endDate: string
  ownershipStatus: number
  complianceStatus: number
  bindStatus: number
  status: number
  contentCount: number
  relatedContents?: Array<{ id: number; title: string }>
  qualificationFiles?: CopyrightQualificationFile[]
  traceEvents: Array<{
    id: number
    time: string
    operatorId?: number
    operatorName?: string
    eventType: string
    eventLabel: string
    detail: string
    ipAddress?: string
  }>
}

export interface CopyrightTraceQuery {
  code?: string
  contentId?: number
  supplierName?: string
  contentType?: number
  startDate?: string
  endDate?: string
}

export interface BatchCopyrightImportRow {
  rowIndex: number
  data: Partial<CopyrightFormData>
  status: 'pending' | 'success' | 'skipped' | 'error'
  errorMessages?: string[]
  warnings?: string[]
  copyrightId?: number
}

export interface BatchCopyrightImportResult {
  batchId: string
  total: number
  totalCount: number
  successCount: number
  skippedCount: number
  skipCount: number
  errorCount: number
  rows: BatchCopyrightImportRow[]
  generatedAt: string
  importedIds?: number[]
  errors?: BatchImportErrorItem[]
  exceptionReport?: {
    formatErrors: BatchCopyrightImportRow[]
    missingFields: BatchCopyrightImportRow[]
    duplicateCodes: BatchCopyrightImportRow[]
  }
}

export interface BatchImportErrorItem {
  rowNumber: number
  code?: string
  name?: string
  errorType: string
  errorMessage: string
}

export interface BatchCopyrightRenewParams {
  ids: number[]
  extendMonths?: number
  extendEndDate?: string
  renewalReason?: string
  remark?: string
}

export interface BatchCopyrightInvalidParams {
  ids: number[]
  invalidReason: string
  remark?: string
}

export interface BatchCopyrightProgress {
  batchId: string
  action: string
  actionLabel: string
  total: number
  totalCount: number
  processed: number
  successCount: number
  failedCount: number
  errorCount: number
  skippedCount: number
  progress: number
  percentage: number
  status: 'pending' | 'running' | 'completed' | 'failed' | 'idle' | 'processing' | 'success' | 'partial' | 'error' | 'exception'
  startedAt?: string
  completedAt?: string
  errorMessage?: string
  currentItem?: string
  message?: string
}

export interface BatchOperationLogItem {
  id: string
  batchId: string
  copyrightId?: number
  copyrightCode?: string
  action: string
  status: 'success' | 'failed' | 'skipped'
  message?: string
  operatorId?: number
  operatorName?: string
  createdAt: string
}

export interface CopyrightVerifyResult {
  isValid: boolean
  issues: Array<{
    field: string
    level: 'error' | 'warning' | 'info'
    message: string
  }>
  fileChecks: Array<{
    fileType: string
    fileName: string
    isValid: boolean
    ocrResult?: Record<string, any>
    issues?: string[]
  }>
}

export interface CopyrightAuditSyncData {
  copyrightId: number
  copyrightCode: string
  action: 'create' | 'update' | 'expire' | 'renew' | 'invalid'
  syncTime: string
  syncStatus: 'success' | 'pending' | 'failed'
  syncTargets: Array<'content_audit' | 'risk_control'>
  data?: Partial<CopyrightItem>
}



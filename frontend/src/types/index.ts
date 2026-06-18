export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export interface PageParams {
  page: number
  pageSize: number
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface UserInfo {
  id: number
  uid: string
  username: string
  nickname: string
  avatar: string
  role: string
  email: string
  phone: string
  status: 'active' | 'frozen' | 'temp_banned' | 'permanent_banned'
  tags: string[]
  permissionGroup: string
  statusExpireAt?: string
  statusReason?: string
  lastLoginTime: string
  lastLoginIp: string
  member?: Member
  createdAt: string
  updatedAt: string
}

export interface FieldValidation {
  valid: boolean
  errors: string[]
}

export interface AccountValidationResult {
  valid: boolean
  phone: FieldValidation
  nickname: FieldValidation
  uid: FieldValidation
}

export interface UserEditLog {
  id: number
  userId: number
  editorId: number
  editorName: string
  field: string
  oldValue: string
  newValue: string
  editStep: number
  verified: boolean
  ip: string
  remark: string
  createdAt: string
}

export interface InconsistencyItem {
  field: string
  type: string
  description: string
  severity: 'low' | 'warning' | 'high'
}

export interface TraceResultItem {
  user: UserInfo
  member: Member | null
  editLogs: UserEditLog[]
  consistencyCheck: {
    consistent: boolean
    inconsistencies: InconsistencyItem[]
  }
}

export interface AccountComplianceLog {
  id: number
  userId: number
  uid: string
  checkType: 'create' | 'edit' | 'trace' | 'batch' | 'manual'
  checkResult: 'pass' | 'fail' | 'warning'
  checkItems: Record<string, any>
  inconsistencies: InconsistencyItem[]
  operatorId: number
  operatorName: string
  remark: string
  createdAt: string
}

export interface BatchUpdateResult {
  successIds: number[]
  failedItems: { id: number; username: string; reasons: string[] }[]
  updated: number
}

export interface ImageResource {
  id: number
  title: string
  description: string
  coverUrl: string
  fileUrl: string
  fileType: string
  fileSize: number
  width: number
  height: number
  duration?: number
  status: string
  categoryId: number
  categoryName: string
  tags: string[]
  authorId: number
  authorName: string
  viewCount: number
  downloadCount: number
  likeCount: number
  violationCount: number
  isBlocked: boolean
  blockReason: string
  publishedAt: string
  offlineAt: string
  offlineReason: string
  createdAt: string
  updatedAt: string
  materialCode: string
  sortWeight: number
  source: string
  remark: string
  resolution: string
}

export interface Category {
  id: number
  name: string
  icon: string
  type: string
  parentId: number
  sort: number
  status: string
  resourceCount: number
  maxCapacity: number
  tags: string
  bindTime: string
  bindOperator: string
  children?: Category[]
}

export interface CategoryBindLog {
  id: number
  resourceId: number
  resourceTitle: string
  categoryId: number
  categoryName: string
  operatorName: string
  createdAt: string
}

export interface CategoryConflict {
  field: string
  expected: number | string
  actual: number | string
  description: string
}

export interface CategoryTraceResult {
  category: Category
  resources: ImageResource[]
  bindLogs: OperationLog[]
  compliance: {
    score: number
    consistent: boolean
    conflicts: CategoryConflict[]
    duplicateBind: number[]
    wrongCategory: { resourceId: number; resourceTitle: string }[]
  }
  statistics: {
    totalResources: number
    totalPublished: number
    totalPending: number
    totalViolation: number
    typeDistribution: Record<string, number>
  }
}

export interface MigrationResult {
  success: number[]
  failed: { id: number; reason: string }[]
  total: number
}

export interface Template {
  id: number
  name: string
  description: string
  coverUrl: string
  previewUrl: string
  fileUrl: string
  categoryId: number
  categoryName: string
  tags: string[]
  price: number
  status: string
  useCount: number
  authorId: number
  authorName: string
  createdAt: string
  updatedAt: string
}

export interface AuditRecord {
  id: number
  resourceId: number
  resourceType: string
  resourceTitle: string
  auditorId: number
  auditorName: string
  auditLevel: number
  auditResult: string
  auditOpinion: string
  auditTime: string
}

export interface Member {
  id: number
  userId: number
  username: string
  level: 'normal' | 'bronze' | 'silver' | 'gold' | 'platinum'
  points: number
  balance: number
  expireTime: string
  totalDownload: number
  totalConsume: number
  totalActiveHours: number
  totalCreateCount: number
  levelUpdatedAt?: string
  createdAt: string
  updatedAt: string
}

export interface Violation {
  id: number
  resourceId: number
  resourceType: string
  resourceTitle: string
  violationType: string
  violationLevel: string
  description: string
  evidence: string
  source: string
  handlerId: number
  handlerName: string
  action: string
  actionTime: string
  status: string
  authorId: number
  createdAt: string
}

export interface Appeal {
  id: number
  violationId: number
  resourceId: number
  resourceTitle: string
  appellantId: number
  appellantName: string
  reason: string
  evidence: string
  reviewerId: number
  reviewerName: string
  reviewResult: string
  reviewOpinion: string
  reviewTime: string
  status: string
  createdAt: string
}

export interface Notification {
  id: number
  userId: number
  title: string
  content: string
  type: string
  relatedId: number
  relatedType: string
  isRead: boolean
  readTime: string
  priority: string
  createdAt: string
}

export interface OperationLog {
  id: number
  traceId: string
  userId: number
  username: string
  userRole: string
  module: string
  action: string
  target: string
  targetId: number
  targetType: string
  detail: any
  beforeData: any
  afterData: any
  changedFields: string[]
  ip: string
  ipLocation: string
  userAgent: string
  deviceInfo: any
  os: string
  browser: string
  requestId: string
  parentLogId: number
  step: number
  duration: number
  result: 'success' | 'fail'
  failReason: string
  isMalicious: boolean
  isTampered: boolean
  tamperCheck: string
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  verifyStatus: 'pending' | 'verified' | 'warning' | 'violation'
  evidenceHash: string
  integrityVerified?: boolean
  chainLogs?: OperationLog[]
  parentLog?: OperationLog
  createdAt: string
}

export interface LogValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface LogOperator {
  userId: number
  username: string
  userRole: string
  operationCount: number
}

export interface LogModuleOption {
  value: string
  label: string
}

export interface LogActionOption {
  value: string
  label: string
}

export interface LogListParams extends PageParams {
  keyword?: string
  module?: string
  action?: string
  username?: string
  userId?: number
  result?: string
  riskLevel?: string
  isMalicious?: boolean
  targetId?: number
  targetType?: string
  startDate?: string
  endDate?: string
}

export interface LogStatsData {
  totalCount: number
  todayCount: number
  maliciousCount: number
  byModule: { module: string; count: number }[]
  byAction: { action: string; count: number }[]
  byResult: { result: string; count: number }[]
  byRiskLevel: { level: string; count: number }[]
  last7Days: { date: string; count: number }[]
}

export interface LogTraceConsistencyIssue {
  logId: number
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

export interface LogTraceResult {
  traceId: string
  totalSteps: number
  startTime: string
  endTime: string
  totalDuration: number
  operator: {
    userId: number
    username: string
    userRole: string
    ip: string
    ipLocation: string
  }
  target: {
    targetId: number
    targetType: string
    target: string
    module: string
  }
  logs: OperationLog[]
  consistency: {
    isConsistent: boolean
    issues: LogTraceConsistencyIssue[]
    allVerified: boolean
  }
  evidence: {
    evidenceHashes: { logId: number; hash: string }[]
    chainHash: string
  }
}

export interface LogExportParams {
  startDate: string
  endDate: string
  username?: string
  module?: string
  action?: string
  result?: string
  userId?: number
  exportFields?: string[]
}

export interface LogExportResult {
  total: number
  exportedCount: number
  filteredEmpty: number
  fields: string[]
  data: Record<string, any>[]
  exportTime: string
}

export interface LogQueryRecord {
  id: string
  params: LogListParams
  count: number
  viewedAt: string
  viewedLogIds: number[]
}

export interface DashboardStatistics {
  resourceCount: number
  templateCount: number
  userCount: number
  memberCount: number
  pendingAuditCount: number
  todayResourceCount: number
  todayUserCount: number
  violationCount: number
  pendingAppealCount: number
  todayActiveUserCount: number
  hotResourceCount: number
}

export interface ResourceStatsItem {
  date: string
  count: number
}

export interface AuditStats {
  totalAudits: number
  approvedCount: number
  rejectedCount: number
  avgAuditTime: number
  todayAudits: number
  violationCount: number
  pendingViolationCount: number
  pendingAppealCount: number
}

export interface ViolationStats {
  totalCount: number
  byType: Record<string, number>
  byLevel: Record<string, number>
  pendingCount: number
  processedCount: number
}

export interface HotRankItem {
  id: number
  title: string
  fileType: string
  viewCount: number
  downloadCount: number
}

export interface UserActivityStats {
  date: string
  newUsers: number
  newResources: number
  newAudits: number
}

export interface MemberLevelDistribution {
  level: string
  count: number
}

export interface MemberStatsData {
  totalMembers: number
  todayNewMembers: number
  todayConsume: number
  levelDistribution: MemberLevelDistribution[]
}

export interface CategoryStatsItem {
  categoryId: number
  categoryName: string
  count: number
}

export interface ViolationOverviewData {
  totalCount: number
  pendingCount: number
  byType: Record<string, number>
  byLevel: Record<string, number>
}

export interface OperationLogStatsData {
  totalOperations: number
  todayOperations: number
  byModule: Record<string, number>
  dailyStats: ResourceStatsItem[]
}

export interface ConversionStatsData {
  publishRate: number
  auditPassRate: number
  registerRate: number
  todayPublished: number
  todayTotalSubmitted: number
  todayAuditPassed: number
  todayTotalAudited: number
  todayRegistered: number
  todayTotalVisitors: number
}

export interface ValidateResult {
  valid: boolean
  errors: string[]
  duplicate?: boolean
  existingResource?: ImageResource
}

export interface BatchResult {
  successIds: number[]
  failedItems: { id: number; reason: string }[]
  updated: number
}

export interface ConflictNode {
  field: string
  expected: string
  actual: string
  description: string
}

export interface TraceResult {
  resource: ImageResource
  editLogs: OperationLog[]
  auditRecords: AuditRecord[]
  violations: Violation[]
  consistencyCheck: {
    consistent: boolean
    conflicts: ConflictNode[]
  }
}

export interface RecycleItem {
  id: number
  resourceId: number
  resourceTitle: string
  resourceType: string
  materialCode: string
  originalStatus: string
  originalCategoryId: number
  originalCategoryName: string
  authorId: number
  authorName: string
  discardReason: string
  applicantId: number
  applicantName: string
  applyTime: string
  reviewStatus: 'pending' | 'approved' | 'rejected'
  reviewerId: number
  reviewerName: string
  reviewOpinion: string
  reviewTime: string
  offlineDays: number
  relatedWorks: number
  snapshot: string
  expireAt: string
  isDestroyed: boolean
}

export interface DiscardValidateResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  offlineDays: number
  relatedWorks: number
  resource: ImageResource
}

export interface RestoreValidateResult {
  valid: boolean
  errors: string[]
  categoryExists: boolean
  resource: ImageResource
}

export interface BatchDiscardResult {
  valid: number[]
  invalid: { id: number; title?: string; reason: string }[]
  submitted: { id: number; recycleId: number }[]
  total: number
}

export interface BatchRestoreResult {
  success: number[]
  failed: { id: number; reason: string }[]
  total: number
}

export interface UserStatusLog {
  id: number
  userId: number
  uid: string
  oldStatus: 'active' | 'frozen' | 'temp_banned' | 'permanent_banned' | null
  newStatus: 'active' | 'frozen' | 'temp_banned' | 'permanent_banned'
  statusExpireAt?: string
  reason?: string
  linkedViolationId?: number
  linkedAppealId?: number
  operatorId?: number
  operatorName?: string
  operatorRole?: string
  syncPermissions?: Record<string, boolean>
  changeType: 'manual' | 'auto_expire' | 'auto_appeal' | 'batch'
  ip?: string
  batchId?: string
  createdAt: string
}

export interface FunctionPermissions {
  view: boolean
  edit: boolean
  create: boolean
  audit: boolean
  market: boolean
}

export interface FrequencyViolation {
  type: 'same_status_frequency' | 'total_frequency'
  message: string
  limit: { count: number; hours?: number; days?: number }
}

export interface RiskPreview {
  mutex: { valid: boolean; reason?: string }
  appeal: { valid: boolean; reason?: string; pendingAppealIds?: number[] }
  role: { valid: boolean; reason?: string; allowed?: string; requiredRole?: string }
  frequency: {
    blocked: boolean
    violations: FrequencyViolation[]
    stats: { sameStatusCount: number; totalCount: number }
  }
  match: { valid: boolean; warning?: boolean; reason?: string }
  functionPermissions: FunctionPermissions
  pendingAppeals: { id: number; status: string }[]
  unresolvedViolations: { id: number; level: string; type: string }[]
}

export interface ChangeStatusResult {
  user: UserInfo
  statusLog: UserStatusLog
  functionPermissions: FunctionPermissions
  warnings: string[]
  matchCheck: { valid: boolean; warning?: boolean; reason?: string }
}

export interface BatchChangeStatusResult {
  batchId: string
  success: { id: number; username: string; oldStatus: string; newStatus: string }[]
  failed: { id: number; username: string; reason: string }[]
  warnings: { id: number; username: string; warnings: string[] }[]
  functionPermissions: FunctionPermissions
}

export interface ChangeStats {
  last7days: UserStatusLog[]
  statusCounts: Record<string, number>
  total: number
}

// ================ 层级标签管理 ================

export interface TagDefinition {
  id: number
  name: string
  color: string
  icon?: string
  dimension: 'consume' | 'create' | 'active' | 'composite'
  applicableLevels: string[]
  minConsumeAmount: number
  minActiveHours: number
  minCreateCount: number
  description?: string
  createdById?: number
  createdByName?: string
  status: 'active' | 'inactive'
  createdAt: string
  updatedAt: string
}

export interface MemberLevelLog {
  id: number
  userId: number
  uid: string
  username: string
  oldLevel: string
  newLevel: string
  oldDisplayLevel: 'normal' | 'vip' | 'premium_vip'
  newDisplayLevel: 'normal' | 'vip' | 'premium_vip'
  changeType: 'upgrade' | 'downgrade' | 'manual'
  criteriaSnapshot?: { totalConsume: number; totalActiveHours: number; totalCreateCount: number }
  criteriaResult?: {
    allPass: boolean
    consumePass: boolean
    activePass: boolean
    createPass: boolean
    missing: string[]
  }
  unlockedBenefits: BenefitItem[]
  recoveredBenefits: BenefitItem[]
  autoSyncedTags: string[]
  operatorId?: number
  operatorName?: string
  operatorRole?: string
  reason?: string
  ip?: string
  createdAt: string
}

export interface MemberTagLog {
  id: number
  userId: number
  uid: string
  username: string
  changeType: 'add' | 'remove' | 'replace' | 'batch_add' | 'batch_remove' | 'auto_clean' | 'auto_sync'
  oldTags: string[]
  newTags: string[]
  addedTags: string[]
  removedTags: string[]
  matchValidation?: Record<string, TagMatchResult>
  duplicates: string[]
  mismatches: { name: string; reason: string }[]
  operatorId?: number
  operatorName?: string
  operatorRole?: string
  batchId?: string
  reason?: string
  ip?: string
  createdAt: string
}

export interface BenefitItem {
  key: string
  label: string
  value: boolean | string | number
}

export interface TagMatchResult {
  matched: boolean
  custom?: boolean
  reason?: string
  dimension?: string
  tagId?: number
  userSnapshot?: { displayLevel: string; consume: number; hours: number; count: number }
}

export interface LevelCriteriaItem {
  minConsume: number
  minActiveHours: number
  minCreateCount: number
}

export interface LevelPreviewResult {
  userId: number
  username: string
  oldLevel: string
  newLevel: string
  oldDisplayLevel: string
  newDisplayLevel: string
  changeType: 'upgrade' | 'downgrade' | 'same'
  criteria: {
    allPass: boolean
    consumePass: boolean
    activePass: boolean
    createPass: boolean
    missing: string[]
    snapshot?: { totalConsume: number; totalActiveHours: number; totalCreateCount: number }
    criteria?: LevelCriteriaItem | null
  }
  canChange: boolean
  unlockedBenefits: BenefitItem[]
  recoveredBenefits: BenefitItem[]
  autoSyncedTags: string[]
  currentTags: string[]
}

export interface ChangeLevelResult {
  member: Member
  user: { id: number; tags: string[] }
  levelLog: MemberLevelLog
  unlockedBenefits: BenefitItem[]
  recoveredBenefits: BenefitItem[]
  autoSyncedTags: string[]
}

export interface AddTagsResult {
  user: { id: number; tags: string[] }
  log: MemberTagLog
  added: string[]
  duplicates: string[]
  mismatches: { name: string; reason: string }[]
}

export interface BatchApplyTagsResult {
  batchId: string
  total: number
  successCount: number
  failedCount: number
  skippedCount: number
  success: { userId: number; username: string; added: string[] }[]
  failed: { userId: number; reason: string }[]
  skipped: { userId: number; username?: string; duplicates: string[]; mismatches: any[] }[]
}

export interface TagTraceResult {
  user: {
    id: number
    uid: string
    username: string
    displayLevel: string
    currentTags: string[]
  }
  member: {
    totalConsume: number
    totalActiveHours: number
    totalCreateCount: number
  }
  tagLogs: MemberTagLog[]
  levelLogs: MemberLevelLog[]
  validation: {
    duplicates: string[]
    mismatches: { name: string; reason: string; dimension: string }[]
    cleanedSuggestions: string[]
  }
  tagDefinitions: TagDefinition[]
}

export interface CleanTagsResult {
  cleaned: string[]
  removed: string[]
  user: { id: number; tags: string[] }
  log?: MemberTagLog
}

export interface LevelCriteriaMeta {
  displayLevels: string[]
  levelOrder: Record<string, number>
  upgradeCriteria: Record<string, LevelCriteriaItem>
  levelBenefits: Record<string, BenefitItem[]>
  autoTags: Record<string, string[]>
  internalToDisplay: Record<string, string>
}

export interface TagMeta {
  dimensions: string[]
  userLevels: string[]
  consumeLevels: { value: string; label: string }[]
  filterOptions: { value: string | null; label: string }[]
}

// ================ 登录行为管控 ================

export type LoginStatus = 'pending' | 'success' | 'failed' | 'blocked' | 'verified' | 'risk'
export type RiskLevel = 'none' | 'low' | 'medium' | 'high' | 'critical'
export type DeviceStatus = 'trusted' | 'normal' | 'restricted' | 'blocked' | 'locked'
export type FrequencyFlag = 'normal' | 'high_hour' | 'high_day' | 'burst'
export type FinalDecision = 'pass' | 'verify' | 'block'

export interface LoginLog {
  id: number
  userId?: number
  uid?: string
  username: string
  status: LoginStatus
  riskLevel: RiskLevel
  failReason?: string

  deviceId?: string
  deviceName?: string
  deviceBrand?: string
  deviceModel?: string
  os?: string
  osVersion?: string
  browser?: string
  browserVersion?: string
  screenSize?: string
  deviceLanguage?: string
  timezone?: string
  userAgent?: string
  fingerprint?: string

  ip: string
  ipv6?: string
  ipLocation?: string
  country?: string
  region?: string
  city?: string
  isp?: string
  lat?: number
  lng?: number
  isProxy: boolean
  isVpn: boolean
  isTor: boolean
  isDatacenter: boolean

  isNewDevice: boolean
  isNewIp: boolean
  isAbroad: boolean
  isOffsite: boolean
  isMultiDevice: boolean
  multiDeviceIds: string[]
  frequencyFlag: FrequencyFlag
  scriptDetected: boolean
  forgedDetected: boolean
  seleniumDetected: boolean
  headlessDetected: boolean
  captchaPassed: boolean
  twoFaPassed: boolean
  twoFaMethod?: string
  twoFaCodeId?: string

  onlineDuration: number
  logoutAt?: string
  logoutType?: 'manual' | 'expired' | 'kicked' | 'forced'
  sessionId?: string
  tokenId?: string
  isMarkedRisk: boolean
  riskMarkedById?: number
  riskMarkedByName?: string
  riskMarkedAt?: string
  riskMarkedReason?: string
  isCleared: boolean
  clearedById?: number
  clearedByName?: string
  clearedAt?: string
  riskReportId?: number
  referer?: string
  loginEndpoint?: string

  createdAt: string
  updatedAt: string
}

export interface LoginDevice {
  id: number
  userId: number
  uid: string
  deviceId: string
  deviceName?: string
  deviceBrand?: string
  deviceModel?: string
  os?: string
  osVersion?: string
  browser?: string
  browserVersion?: string
  fingerprint?: string
  screenSize?: string

  status: DeviceStatus
  statusUpdatedAt?: string

  firstLoginAt: string
  lastLoginAt: string
  lastLoginIp?: string
  lastLoginLocation?: string
  totalLoginCount: number
  totalSuccessCount: number
  totalFailCount: number

  isTrusted: boolean
  trustedById?: number
  trustedByName?: string
  trustedAt?: string

  isLocked: boolean
  lockedById?: number
  lockedByName?: string
  lockedAt?: string
  lockReason?: string
  lockExpireAt?: string

  isOnline: boolean
  lastOnlineAt?: string
  activeIpList: string[]
  commonLocation?: string
  riskCount: number
  remark?: string
  createdAt: string
  updatedAt: string
}

export interface LoginRiskReport {
  id: number
  loginLogId?: number
  userId?: number
  uid?: string
  username: string
  ip: string
  deviceId?: string

  overallScore: number
  riskLevel: RiskLevel
  finalDecision: FinalDecision

  deviceChecks?: Record<string, any>
  ipChecks?: Record<string, any>
  frequencyChecks?: Record<string, any>
  behaviorChecks?: Record<string, any>
  geoChecks?: Record<string, any>

  riskRulesTriggered: RiskRuleItem[]
  riskScoreDetails: RiskScoreDetail[]

  deviceRiskScore: number
  ipRiskScore: number
  frequencyRiskScore: number
  behaviorRiskScore: number
  geoRiskScore: number

  historicalContext?: Record<string, any>
  userBaseline?: Record<string, any>

  suggestion?: string
  processedBy?: number
  processedByName?: string
  processedAt?: string
  processingResult?: string
  remark?: string
  createdAt: string
}

export interface RiskRuleItem {
  rule: string
  description: string
  score: number
}

export interface RiskScoreDetail {
  key: string
  description: string
  score: number
  applied: boolean
}

export interface RiskChecks {
  isNewDevice: boolean
  isNewIp: boolean
  isOffsite: boolean
  isAbroad: boolean
  isProxy: boolean
  isVpn: boolean
  isTor: boolean
  isDatacenter: boolean
  seleniumDetected: boolean
  headlessDetected: boolean
  scriptDetected: boolean
  detected: string[]
  frequencyFlag: FrequencyFlag
  frequencyStats: { lastHour: number; lastDay: number; last5Min: number; last30s: number }
  isMultiDevice: boolean
  otherDeviceIds: string[]
  country: string
  region: string
  city: string
  isp: string
  lat: number
  lng: number
}

export interface VerifyLoginResult {
  log: LoginLog
  report: LoginRiskReport
  success: boolean
  status: LoginStatus
  needTwoFa: boolean
  blocked: boolean
  failReason?: string
  riskLevel: RiskLevel
  riskScore: number
  needTwoFaMethod: string
  checks: RiskChecks
}

export interface LoginDetailResult {
  log: LoginLog
  report: LoginRiskReport | null
  device: LoginDevice | null
}

export interface BatchProcessLoginResult {
  success: { id: number; type: string; deviceLocked?: boolean }[]
  failed: { id: number; reason: string }[]
  total: number
  successCount: number
  failedCount: number
}

export interface LoginRiskSummary {
  totalCount: number
  successCount: number
  failCount: number
  blockOrRiskCount: number
  byLevel: Partial<Record<RiskLevel, number>>
  frequencyTrend: Record<string, number>
  recentRiskLogs: LoginLog[]
  devices: LoginDevice[]
  riskCount: number
}

export interface LoginThresholdsMeta {
  riskThresholds: {
    highFrequency: { perHour: number; perDay: number; per5Min: number }
    burstLogin: { count: number; windowSeconds: number }
    offsiteLogin: { kmDistance: number }
    multiDevice: { maxOnlineDevices: number }
  }
  riskScoreRules: Record<string, number>
  scoreLevelMapping: { min: number; max: number; level: string }[]
  logStatuses: string[]
  riskLevels: string[]
  deviceStatuses: string[]
  decisions: string[]
}

export interface LoginQueryParams extends PageParams {
  userId?: number
  username?: string
  status?: LoginStatus
  riskLevel?: RiskLevel
  ip?: string
  deviceId?: string
  os?: string
  browser?: string
  country?: string
  city?: string
  isMarkedRisk?: boolean
  isCleared?: boolean
  startTime?: string
  endTime?: string
  orderBy?: string
  orderDir?: string
}

// ================ 角色权限管理 ================

export interface RoleItem {
  id: number
  name: string
  code: string
  description: string
  type: string
  isSystem: boolean
  status: 'active' | 'inactive'
  level: number
  sort: number
  permCount?: number
  boundUserCount?: number
  createdAt: string
  updatedAt: string
}

export interface PermissionMenu {
  id: number
  name: string
  code: string
  parentId: number | null
  level: 'module' | 'page' | 'action'
  module: string
  isCore: boolean
  mutexGroup: string | null
  requiredLevel: number
  description: string
  sort: number
  status: 'active' | 'inactive'
  children?: PermissionMenu[]
  rolePermissionId?: number
}

export interface RoleDetail extends RoleItem {
  permissions: PermissionMenu[]
  boundUsers: { id: number; uid: string; username: string; nickname: string; status: string }[]
}

export interface PermissionConflict {
  mutexGroup: string
  description: string
  permissions: { id: number; name: string; code: string }[]
}

export interface PermissionAdaptIssue {
  permissionId: number
  permissionName: string
  permissionCode: string
  reason: string
}

export interface ValidateConfigResult {
  valid: boolean
  errors: string[]
  conflicts: PermissionConflict[]
  adaptIssues: PermissionAdaptIssue[]
}

export interface RolePermissionLog {
  id: number
  roleId: number
  roleName: string
  changeType: 'create' | 'edit' | 'delete' | 'batch_copy' | 'batch_modify' | 'sync'
  addedPermissions: number[]
  removedPermissions: number[]
  permissionSnapshot: { permissionId: number; isCore: boolean; name: string; code: string }[]
  conflictResolution: Record<string, any> | null
  affectedUserIds: number[]
  batchId: string | null
  operatorId: number | null
  operatorName: string | null
  operatorRole: string | null
  reason: string | null
  ip: string | null
  createdAt: string
}

export interface ComplianceIssue {
  type: 'conflict' | 'missing' | 'redundant'
  severity: 'high' | 'medium' | 'low'
  description: string
  fields: string[]
}

export interface ComplianceResult {
  score: number
  consistent: boolean
  issues: ComplianceIssue[]
}

export interface TraceRoleResult {
  role: RoleItem
  permissions: PermissionMenu[]
  boundUsers: { id: number; uid: string; username: string; nickname: string; status: string; createdAt: string }[]
  logs: RolePermissionLog[]
  compliance: ComplianceResult
}

export interface BatchCopyResult {
  success: { id: number; name: string }[]
  failed: { id: number; reason: string }[]
}

export interface BatchModifyResult {
  success: { id: number; name: string }[]
  failed: { id: number; reason: string }[]
}

// ================ 账号权限分配管理 ================

export interface AccountPermissionItem {
  id: number
  uid: string
  username: string
  nickname: string
  avatar: string
  email: string
  phone: string
  role: string
  status: 'active' | 'frozen' | 'temp_banned' | 'permanent_banned'
  tags: string[]
  permissionGroup: string
  coreRoleName: string | null
  coreRoleId: number | null
  auxPermCount: number
  allPermCount: number
  lastLoginTime: string
  createdAt: string
}

export interface AccountPermissionDetail {
  id: number
  uid: string
  username: string
  nickname: string
  role: string
  status: string
  coreRole: { id: number; name: string; code: string; type: string; level: number } | null
  coreRoleId: number | null
  auxPermissions: { id: number; userId: number; permissionId: number; bindingType: string; source: string; permission: PermissionMenu }[]
  effectivePermCount: number
}

export interface AccountPermConflict {
  mutexGroup: string
  description: string
  permissions: { id: number; name: string; code: string }[]
}

export interface AccountRoleMatchResult {
  matched: boolean
  matchScore: number
  roleName: string
  roleLevel: number
  totalPerms: number
  mismatchCount: number
}

export interface AccountPermValidation {
  score: number
  valid: boolean
  issues: {
    type: 'conflict' | 'overprivileged' | 'redundant'
    severity: 'high' | 'medium' | 'low'
    description: string
    permissions: { id: number; name: string; code: string; requiredLevel?: number }[]
  }[]
}

export interface AccountTraceResult {
  user: { id: number; uid: string; username: string; nickname: string; role: string; status: string }
  detail: AccountPermissionDetail
  logs: AccountPermLog[]
  validation: AccountPermValidation
}

export interface AccountPermLog {
  id: number
  userId: number
  userUid: string
  username: string
  changeType: 'assign_role' | 'revoke_role' | 'add_permission' | 'remove_permission' | 'batch_assign_role' | 'batch_add_permission' | 'sync_role_perms' | 'cleanup_redundant' | 'conflict_resolve'
  beforeSnapshot: any
  afterSnapshot: any
  roleId: number | null
  roleName: string | null
  addedPermissions: number[]
  removedPermissions: number[]
  conflictInfo: any
  batchId: string | null
  operatorId: number | null
  operatorName: string | null
  operatorRole: string | null
  reason: string | null
  ip: string | null
  createdAt: string
}

export interface BatchAssignResult {
  success: { id: number; username: string }[]
  failed: { id: number; username: string; reason: string }[]
  filteredCount: number
}

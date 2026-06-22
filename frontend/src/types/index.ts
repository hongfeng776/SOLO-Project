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

// ================ 系统运行日志管理 ================

export type SystemLogType = 'system' | 'api' | 'error' | 'performance' | 'security' | 'cron'
export type SystemLogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical'

export interface SystemLog {
  id: number
  traceId: string
  logType: SystemLogType
  logTypeLabel: string
  logLevel: SystemLogLevel
  logLevelLabel: string
  module: string
  moduleLabel: string
  title: string
  content: string
  stackTrace: string
  requestMethod: string
  requestUrl: string
  requestParams: any
  requestBody: any
  responseStatus: number
  responseData: any
  duration: number
  userId: number
  username: string
  ip: string
  userAgent: string
  serverName: string
  processId: number
  threadId: string
  errorCode: string
  errorName: string
  isHighRisk: boolean
  isRetained: boolean
  retentionDays: number
  expireAt: string
  backupFile: string
  backupAt: string
  extraInfo: any
  createdAt: string
}

export interface SystemLogPermission {
  canViewError: boolean
  canViewApi: boolean
  canViewSystem: boolean
  canBackup: boolean
  canCleanup: boolean
  canViewTraceability: boolean
}

export interface SystemLogListParams extends PageParams {
  logType?: SystemLogType
  logLevel?: SystemLogLevel
  module?: string
  responseStatus?: number
  durationMin?: number
  isHighRisk?: boolean
  startDate?: string
  endDate?: string
  keyword?: string
}

export interface SystemLogStatsData {
  totalCount: number
  todayCount: number
  highRiskCount: number
  slowApiCount: number
  byType: { type: string; label: string; count: number }[]
  byLevel: { level: string; label: string; count: number }[]
  levelCounts: { info: number; warning: number; error: number; critical: number }
  levelPercentages: { info: number; warning: number; error: number; critical: number }
  last7Days: { date: string; count: number; errorCount: number }[]
  topErrorModules: { module: string; moduleLabel: string; count: number }[]
  peakHours: { hour: number; count: number }[]
}

export interface SystemLogBackupParams {
  startDate: string
  endDate: string
  logType?: SystemLogType
  logLevel?: SystemLogLevel
  module?: string
}

export interface SystemLogBackupResult {
  total: number
  backedUp: number
  backupFile: string
  backupPath: string
  message: string
}

export interface SystemLogCleanupParams {
  days?: number
  startDate?: string
  endDate?: string
  logType?: SystemLogType
  module?: string
}

export interface SystemLogCleanupResult {
  total: number
  cleaned: number
  protectedCount: number
  message: string
}

export interface SystemLogTraceErrorType {
  name: string
  errorCode: string
  module: string
  count: number
  firstOccur: string
  lastOccur: string
  samples: { id: number; stackTrace: string; createdAt: string }[]
}

export interface SystemLogTraceSlowApi {
  url: string
  method: string
  duration: number
  count: number
  lastOccur: string
}

export interface SystemLogStabilityScore {
  score: number
  level: 'excellent' | 'good' | 'fair' | 'poor'
  levelLabel: string
  totalLogs: number
  errorLogs: number
  warningLogs: number
  slowApiLogs: number
  highRiskLogs: number
}

export interface SystemLogOptimizationIssue {
  severity: 'high' | 'medium' | 'low'
  type: string
  description: string
  details: string[]
}

export interface SystemLogOptimizationSuggestion {
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  affected: string
}

export interface SystemLogOptimizationReport {
  generatedAt: string
  period: string
  totalIssues: number
  issues: SystemLogOptimizationIssue[]
  suggestions: SystemLogOptimizationSuggestion[]
  summary: string
}

export interface SystemLogTraceabilityResult {
  abnormalLogs: SystemLog[]
  statistics: {
    totalAbnormal: number
    byType: { type: string; label: string; count: number }[]
    byModule: { module: string; label: string; count: number }[]
    byHour: { hour: number; count: number }[]
    byDay: { day: string; count: number }[]
    slowApis: SystemLogTraceSlowApi[]
    errorTypes: SystemLogTraceErrorType[]
  }
  stabilityScore: SystemLogStabilityScore
  optimizationReport: SystemLogOptimizationReport
}

export interface SystemLogOption {
  value: string
  label: string
}

export interface SystemLogViewRecord {
  id: string
  logId: number
  logTitle: string
  logType: SystemLogType
  logLevel: SystemLogLevel
  viewedAt: string
}

export type CronTaskType = 'data_sync' | 'backup' | 'cleanup' | 'report' | 'notification' | 'statistics' | 'health_check' | 'other'
export type CronStatus = 'pending' | 'running' | 'success' | 'failed' | 'timeout' | 'skipped' | 'killed'
export type CronTriggerType = 'scheduled' | 'manual' | 'retry' | 'api'
export type CronAnomalyType = 'none' | 'duplicate' | 'timeout' | 'missed' | 'resource_exceeded' | 'config_error'
export type CronRetryStrategy = 'exponential' | 'fixed' | 'linear' | 'none'
export type StatsPeriod = 'daily' | 'weekly' | 'monthly'

export interface CronLog {
  id: number
  taskId: string
  taskName: string
  taskType: CronTaskType
  taskGroup?: string
  triggerType: CronTriggerType
  status: CronStatus
  scheduledAt: string
  startedAt?: string
  finishedAt?: string
  duration: number
  timeoutThreshold: number
  retryCount: number
  maxRetries: number
  retryStrategy: CronRetryStrategy
  retryInterval: number
  retryHistory?: any[]
  parentLogId?: number
  resultData?: any
  output?: string
  errorMessage?: string
  errorStack?: string
  errorCode?: string
  configParams?: any
  serverName?: string
  processId?: number
  cpuUsage?: number
  memoryUsage?: number
  memoryUsagePercent?: number
  memoryUsageMB?: number
  affectedRecords: number
  processedRecords: number
  failedRecords: number
  isTimeout: boolean
  isDuplicate: boolean
  isMissed: boolean
  anomalyType: CronAnomalyType
  anomalyDetected: boolean
  anomalyMessage?: string
  optimizationSuggestion?: string
  cronExpression?: string
  nextRunAt?: string
  createdBy?: number
  createdByName?: string
  traceId?: string
  extraInfo?: any
  defaultRetryStrategy?: {
    strategy: CronRetryStrategy
    maxRetries: number
    interval: number
    description: string
  }
  nextRetryTime?: string
  retryLogs?: CronLog[]
  parentLog?: CronLog
  createdAt: string
}

export interface CronLogValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  validTaskConfig: boolean
}

export interface CronLogTaskValidation {
  valid: boolean
  message?: string
  warning?: string
}

export interface CronLogListParams {
  pageNum?: number
  pageSize?: number
  taskId?: string
  taskName?: string
  taskType?: CronTaskType
  status?: CronStatus
  triggerType?: CronTriggerType
  anomalyType?: CronAnomalyType
  startDate?: string
  endDate?: string
  keyword?: string
}

export interface CronLogStatsData {
  summary: {
    total: number
    successCount: number
    failedCount: number
    timeoutCount: number
    anomalyCount: number
    successRate: number
    failureRate: number
    avgDuration: number
  }
  byTaskType: Record<string, {
    label: string
    total: number
    success: number
    failed: number
    successRate: number
  }>
  trend: {
    period: string
    total: number
    success: number
    failed: number
    timeout: number
    anomaly: number
  }[]
  anomalyStats: {
    duplicate: number
    timeout: number
    missed: number
    resourceExceeded: number
    configError: number
  }
  retryStats: {
    withRetry: number
    maxRetryReached: number
    avgRetryCount: number
  }
  period: StatsPeriod
}

export interface CronLogRetryRecord {
  attempt: number
  startedAt: string
  finishedAt?: string
  duration: number
  status: CronStatus
  errorMessage?: string
}

export interface CronLogAnomaly {
  type: string
  severity: 'error' | 'warning' | 'info'
  logId: number
  scheduledAt: string
  message: string
}

export interface CronLogConfigIssue {
  severity: 'error' | 'warning' | 'info'
  message: string
}

export interface CronLogResourceUsage {
  cpu: {
    avg: number
    max: number
    min: number
  }
  memory: {
    avg: number
    max: number
    min: number
  }
}

export interface CronLogExecutionAnalysis {
  total: number
  successCount: number
  failedCount: number
  timeoutCount: number
  successRate: number
  failureRate: number
  avgDuration: number
  maxDuration: number
  minDuration: number
  peakHours: {
    hour: number
    count: number
    failed: number
  }[]
  stabilityScore: number
}

export interface CronLogOptimizationSuggestion {
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  action: string
}

export interface CronLogOptimizationReport {
  overallStatus: 'good' | 'warning' | 'poor'
  suggestions: CronLogOptimizationSuggestion[]
  summary: string
}

export interface CronLogTraceabilityResult {
  taskOverview: {
    taskId: string
    taskName: string
    taskType: CronTaskType
    taskGroup?: string
    cronExpression?: string
    totalExecutions: number
    recentExecutions: number
    configParams?: any
  }
  executionFlow: CronLog[]
  resourceUsage: CronLogResourceUsage
  anomalies: CronLogAnomaly[]
  configIssues: CronLogConfigIssue[]
  analysis: CronLogExecutionAnalysis
  optimization: CronLogOptimizationReport
}

export interface CronLogOption {
  value: string
  label: string
  type?: string
}

export interface CronLogTaskInfo {
  taskId: string
  taskName: string
  taskType: CronTaskType
  taskGroup?: string
}

export interface CronLogViewRecord {
  id: string
  logId: number
  taskId: string
  taskName: string
  taskType: CronTaskType
  status: CronStatus
  viewedAt: string
}

export type ServerEnvironment = 'production' | 'staging' | 'testing' | 'development'
export type MonitorType = 'snapshot' | 'interval' | 'alert' | 'peak'
export type AlertType = 'none' | 'cpu' | 'memory' | 'disk' | 'network' | 'api' | 'system'
export type AlertLevel = 'none' | 'info' | 'warning' | 'critical'
export type ApiLoadLevel = 'low' | 'normal' | 'medium' | 'high' | 'overload'
export type PeakType = 'none' | 'cpu' | 'memory' | 'disk' | 'network' | 'api'

export interface ServerMonitor {
  id: number
  serverId: string
  serverName: string
  serverIp: string
  region?: string
  environment: ServerEnvironment
  monitorType: MonitorType
  cpuUsage: number
  cpuCores: number
  cpuLoad1: number
  cpuLoad5: number
  cpuLoad15: number
  memoryTotal: number
  memoryUsed: number
  memoryUsage: number
  memoryBuffers: number
  memoryCached: number
  memorySwapTotal: number
  memorySwapUsed: number
  diskTotal: number
  diskUsed: number
  diskUsage: number
  diskReadIO: number
  diskWriteIO: number
  diskReadBytes: number
  diskWriteBytes: number
  networkIn: number
  networkOut: number
  networkConnections: number
  apiTotalRequests: number
  apiSuccessRequests: number
  apiFailedRequests: number
  apiAvgResponseTime: number
  apiP95ResponseTime: number
  apiP99ResponseTime: number
  apiQps: number
  apiLoadLevel: ApiLoadLevel
  processCount: number
  threadCount: number
  uptime: number
  hasAlert: boolean
  alertType: AlertType
  alertLevel: AlertLevel
  alertMessage?: string
  alertThreshold?: any
  alertValue?: string
  alertResolved: boolean
  alertResolvedAt?: string
  businessVolume: number
  loadMatchScore: number
  riskLevel: RiskLevel
  traceId?: string
  isPeak: boolean
  peakType: PeakType
  extraInfo?: any
  memoryTotalMB: number
  memoryUsedMB: number
  diskTotalGB: number
  diskUsedGB: number
  networkInKB: number
  networkOutKB: number
  anomalyPeriod?: ServerMonitor[]
  createdAt: string
}

export interface ServerMonitorPermission {
  canViewMonitor: boolean
  canViewSensitive: boolean
  canExport: boolean
  canTrace: boolean
}

export interface ServerMonitorValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface ServerMonitorListParams {
  pageNum?: number
  pageSize?: number
  serverId?: string
  serverName?: string
  environment?: ServerEnvironment
  alertType?: AlertType
  alertLevel?: AlertLevel
  hasAlert?: string | boolean
  startDate?: string
  endDate?: string
  monitorType?: MonitorType
}

export interface ServerMonitorConnectivity {
  connected: boolean
  lastUpdate?: string
  message: string
}

export interface ServerMonitorRealtimeData {
  data: ServerMonitor[]
  connectivity: ServerMonitorConnectivity
  timestamp: string
}

export interface ServerMonitorHistoryData {
  data: ServerMonitor[]
  granularity: string
  total: number
}

export interface ServerMonitorPeakData {
  data: ServerMonitor[]
  peakStats: {
    cpu: number
    memory: number
    disk: number
    network: number
    api: number
  }
  total: number
}

export interface ServerMonitorStatsData {
  summary: {
    totalRecords: number
    avgCpu: number
    avgMemory: number
    avgDisk: number
    avgQps: number
    alertCount: number
  }
  alertsByType: Record<string, number>
  alertsByLevel: Record<string, number>
  riskDistribution: Record<string, number>
  loadDistribution: Record<string, number>
  trend: {
    time: string
    avgCpu: number
    avgMemory: number
    avgQps: number
    alertCount: number
  }[]
}

export interface ServerMonitorExportParams {
  startDate?: string
  endDate?: string
  serverId?: string
  includeAlerts?: boolean
  format?: 'json' | 'csv'
}

export interface ServerMonitorExportResult {
  data: ServerMonitor[]
  exportInfo: {
    exportTime: string
    totalRecords: number
    validRecords: number
    emptyRecords: number
    filters: any
    format: string
  }
  fileName: string
}

export interface ServerMonitorAnomaly {
  type: string
  severity: 'critical' | 'warning'
  time: string
  recordId: number
  message: string
  value: number | string
}

export interface ServerMonitorAnomalyDetection {
  anomalies: ServerMonitorAnomaly[]
  totalAnomalies: number
  criticalCount: number
  warningCount: number
  byType: {
    cpu_overload: number
    memory_overload: number
    disk_overload: number
    api_overload: number
    api_timeout: number
    system_crash: number
  }
}

export interface ServerMonitorLoadMatching {
  valid: boolean
  message?: string
  avgMatchScore: number
  lowVolumeHighLoadCount: number
  highVolumeLowLoadCount: number
  totalMismatches: number
  mismatchedPeriods: {
    time: string
    type: string
    businessVolume: number
    avgLoad: string
    message: string
  }[]
}

export interface ServerMonitorRisk {
  type: string
  level: RiskLevel
  title: string
  description: string
  suggestion: string
}

export interface ServerMonitorRiskPrediction {
  risks: ServerMonitorRisk[]
  overallRisk: RiskLevel
  predictionWindow: string
  message?: string
}

export interface ServerMonitorResourceAnalysis {
  cpu: { avg: number; max: number; min: number; p95: number }
  memory: { avg: number; max: number; min: number; p95: number }
  disk: { avg: number; max: number; min: number; p95: number }
  api: { avgQps: number; maxQps: number; avgResponseTime: number; p95ResponseTime: number }
}

export interface ServerMonitorOptimizationSuggestion {
  priority: 'high' | 'medium' | 'low'
  category: string
  title: string
  description: string
  action: string
}

export interface ServerMonitorOptimizationReport {
  suggestions: ServerMonitorOptimizationSuggestion[]
  overallStatus: RiskLevel
  summary: string
}

export interface ServerMonitorTraceabilityResult {
  serverOverview: {
    serverId: string
    serverName: string
    serverIp: string
    environment: ServerEnvironment
    region?: string
    totalRecords: number
    analysisPeriod: string
  }
  executionTimeline: ServerMonitor[]
  resourceAnalysis: ServerMonitorResourceAnalysis
  anomalyDetection: ServerMonitorAnomalyDetection
  loadMatching: ServerMonitorLoadMatching
  riskPrediction: ServerMonitorRiskPrediction
  optimizationSuggestions: ServerMonitorOptimizationReport
}

export interface ServerMonitorOption {
  value: string
  label: string
  type?: string
}

export interface ServerInfo {
  serverId: string
  serverName: string
  serverIp: string
  environment: ServerEnvironment
  region?: string
}

export interface ServerMonitorAlertRecord {
  id: string
  recordId: number
  serverId: string
  serverName: string
  alertType: AlertType
  alertLevel: AlertLevel
  alertMessage?: string
  viewedAt: string
}

// ================ 特效滤镜素材录入 ================

export type FilterFileFormat = 'glsl' | 'json' | 'lut_3d' | 'lut_1d' | 'custom'
export type FilterStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'offline' | 'violation'
export type FilterEditChangeType = 'create' | 'edit' | 'edit_limited' | 'status_change' | 'status_blocked' | 'batch_submit' | 'trace_verify' | 'batch_status' | 'status_hf_blocked' | 'category_bind' | 'category_adjust' | 'category_migrate' | 'category_unbind' | 'category_auto_correct' | 'weight_adjust' | 'weight_batch' | 'weight_auto_correct'

export interface FilterEffect {
  id: number
  filterCode: string
  name: string
  description: string
  tags: string[]
  categoryId: number
  categoryName: string
  fileUrl: string
  fileFormat: FilterFileFormat
  fileSize: number
  coverUrl: string
  previewUrl: string
  resolution: string
  width: number
  height: number
  adaptScene: string[]
  adaptDevice: string[]
  coreParams: Record<string, any>
  sortWeight: number
  status: FilterStatus
  copyrightLicense: string
  copyrightExpiredAt: string
  source: string
  authorId: number
  authorName: string
  integrityHash: string
  isCompliant: boolean
  complianceIssues: string[]
  remark: string
  useHeat: number
  inUseCount: number
  statusChangeCount: number
  lastStatusChangeAt: string
  violationReason: string
  violationAt: string
  recommendWeight: number
  canUserUse: boolean
  lastStatusChangeOperator: string
  userRating: number
  qualityLevel: 'poor' | 'normal' | 'good' | 'excellent'
  weightChangeCount: number
  lastWeightChangeAt: string
  weightRangeMin: number
  weightRangeMax: number
  publishedAt: string
  offlineAt: string
  createdAt: string
  updatedAt: string
}

export interface FilterValidationResult {
  valid: boolean
  errors: string[]
  duplicate?: boolean
}

export interface FilterEditLog {
  id: number
  filterId: number
  filterCode: string
  filterName: string
  editStep: number
  changeType: FilterEditChangeType
  changedFields: string[]
  beforeData: Record<string, any> | null
  afterData: Record<string, any> | null
  operatorId: number
  operatorName: string
  operatorRole: string
  ip: string
  reason: string
  batchId: string
  remark: string
  createdAt: string
}

export interface FilterBatchResult {
  valid: Partial<FilterEffect>[]
  invalid: { _validation: FilterValidationResult }[]
  submitted: { id: number; filterCode: string; name: string }[]
  batchId: string
  total: number
}

export interface FilterTraceIssue {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
}

export interface FilterTraceResultItem {
  filter: FilterEffect
  editLogs: FilterEditLog[]
  integrityCheck: {
    passed: boolean
    issues: FilterTraceIssue[]
  }
  copyrightCheck: {
    passed: boolean
    issues: FilterTraceIssue[]
  }
  overallCheck: {
    passed: boolean
    isBlocked: boolean
    issues: FilterTraceIssue[]
  }
}

export interface FilterListParams extends PageParams {
  keyword?: string
  status?: FilterStatus | string
  categoryId?: number
  fileFormat?: FilterFileFormat
  adaptScene?: string
  filterCode?: string
  isCompliant?: boolean
  useHeatMin?: number
  statusChangeCountMin?: number
}

// ================ 特效滤镜状态管控 ================

export interface FilterStatusOverview {
  total: number
  pending: number
  published: number
  offline: number
  violation: number
  mutexStatus: string[]
  statusCounts: Record<string, number>
  publishRate: number
}

export interface FilterUsingWork {
  filterId: number
  filterCode: string
  filterName: string
  inUseCount: number
  useHeat: number
}

export interface FilterStatusUpdateResult {
  updated?: boolean
  filter?: FilterEffect
  heatWarnings?: FilterTraceIssue[]
  needSecondConfirm?: boolean
  inUseCount?: number
  useHeat?: number
  usingWorks?: FilterUsingWork[]
  message?: string
}

export interface BatchStatusResult {
  total: number
  success: { id: number; filterCode: string; name: string; status: FilterStatus }[]
  failed: { id: number; reason: string; filterCode?: string; name?: string }[]
  filtered: { id: number; filterCode: string; name: string; reason: string; status: FilterStatus }[]
  batchId: string
}

// ================ 滤镜分类适配管理 ================

export type FilterCategoryBindType = 'primary' | 'auto' | 'manual' | 'migration'
export type FilterCategoryChangeType = 'bind' | 'adjust' | 'migrate' | 'unbind' | 'auto_correct'

export interface FilterCategoryAdapt {
  id: number
  filterId: number
  filterCode: string
  filterName: string
  categoryId: number
  categoryName: string
  adaptScore: number
  adaptIssues: string[]
  isMatched: boolean
  isPrimary: boolean
  filterScenes: string[]
  categorySceneRule: string[]
  useCount: number
  useHeat: number
  bindType: FilterCategoryBindType
  changeType: FilterCategoryChangeType
  operatorId: number
  operatorName: string
  reason: string
  batchId: string
  beforeCategoryId: number
  beforeCategoryName: string
  createdAt: string
  updatedAt: string
}

export interface CategoryValidateResult {
  valid: boolean
  errors: string[]
  adaptScore: number
  isMatched: boolean
  filterScenes: string[]
  categoryRuleScenes: string[]
  categoryId: number
  categoryName: string
  filterId: number
  filterName: string
}

export interface CategoryAdjustResult {
  updated: boolean
  filter: FilterEffect
  adaptScore: number
}

export interface BatchCategoryMigrateResult {
  total: number
  success: { id: number; filterCode: string; name: string; adaptScore: number }[]
  failed: { id: number; reason: string }[]
  filtered: { id: number; filterCode: string; name: string; reason: string; adaptScore?: number }[]
  batchId: string
  targetCategoryId: number
  targetCategoryName: string
}

export interface CategoryTraceIssue {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  filterId: number
}

export interface FilterCategoryTraceResult {
  category: { id: number; name: string }
  filterCount: number
  filters: (FilterEffect & {
    adaptRecords: FilterCategoryAdapt[]
    otherCategoryBinds: { categoryId: number; categoryName: string; bindType: string }[]
  })[]
  adaptRecords: FilterCategoryAdapt[]
  issues: CategoryTraceIssue[]
  duplicateBindCount: number
  mismatchCount: number
  overallValid: boolean
}

// ================ 滤镜热度权重管理 ================

export type FilterWeightChangeType = 'manual' | 'batch' | 'auto' | 'auto_correct'

export interface FilterWeightLog {
  id: number
  filterId: number
  filterCode: string
  filterName: string
  beforeWeight: number
  afterWeight: number
  beforeRecommendWeight: number
  afterRecommendWeight: number
  useHeatAtAdjust: number
  userRatingAtAdjust: number
  qualityLevelAtAdjust: 'poor' | 'normal' | 'good' | 'excellent'
  changeType: FilterWeightChangeType
  weightMatchScore: number
  matchIssues: string[]
  operatorId: number
  operatorName: string
  reason: string
  batchId: string
  sortRankBefore: number
  sortRankAfter: number
  displayPriorityBefore: string
  displayPriorityAfter: string
  createdAt: string
  updatedAt: string
}

export interface WeightValidateResult {
  valid: boolean
  errors: string[]
  matchPercent: number
  heatRange: { min: number; max: number }
  qualityRange: { min: number; max: number; default: number }
  qualityLevel: string
  useHeat: number
  userRating: number
  suggestedWeight: number
}

export interface WeightAdjustResult {
  updated: boolean
  filter: FilterEffect
  beforeWeight: number
  afterWeight: number
  rankChange: number
  matchScore: number
  suggestedWeight: number
}

export interface BatchWeightResult {
  total: number
  success: { id: number; filterCode: string; name: string; beforeWeight: number; afterWeight: number; qualityLevel: string; useHeat: number; matchScore: number }[]
  failed: { id: number; reason: string }[]
  filtered: { id: number; filterCode: string; name: string; reason: string; qualityLevel: string; useHeat: number; suggestedWeight: number }[]
  batchId: string
  excellentCount: number
  goodCount: number
  normalCount: number
  poorCount: number
}

export interface WeightTraceResult {
  filter: FilterEffect
  weightLogs: FilterWeightLog[]
  totalAdjustments: number
  avgMatchScore: number
  virtualHighCount: number
  mismatchCount: number
  overallValid: boolean
  issues: CategoryTraceIssue[]
  currentWeight: number
  currentRecommend: number
  weightChangeCount: number
}

// ================ 作品精选收录管理 ================

export type FeaturedStatus = 'pending_verify' | 'verified' | 'featured' | 'removed' | 'rejected'
export type FeaturedLevel = 'normal' | 'silver' | 'gold' | 'platinum' | 'diamond'
export type DisplayPosition = 'home_banner' | 'home_recommend' | 'category_top' | 'special_zone' | 'editor_pick' | 'hot_list'

export type FeaturedOperationType =
  | 'pre_validate'
  | 'verify_pass'
  | 'verify_reject'
  | 'featured'
  | 'adjust_weight'
  | 'adjust_position'
  | 'adjust_level'
  | 'cancel_featured'
  | 'batch_featured'
  | 'batch_cancel'
  | 'trace_verify'
  | 'auto_expire'
  | 'compliance_recheck'
  | 'quality_recheck'

export type FeaturedLogResult = 'success' | 'fail' | 'warning' | 'blocked' | 'filtered'

export interface FeaturedWork {
  id: number
  featuredCode: string
  resourceId: number
  resourceTitle: string
  resourceType: 'image' | 'video' | 'audio' | 'template'
  coverUrl: string
  authorId: number
  authorName: string
  categoryId: number
  categoryName: string
  status: FeaturedStatus
  featuredLevel: FeaturedLevel
  displayWeight: number
  displayPosition: DisplayPosition | null
  featuredTags: string[]
  qualityScore: number
  originalScore: number
  resolutionScore: number
  complianceScore: number
  overallScore: number
  verifyReason: string
  verifyOperatorId: number
  verifyOperatorName: string
  verifyTime: string
  featuredOperatorId: number
  featuredOperatorName: string
  featuredTime: string
  removeReason: string
  removeOperatorId: number
  removeOperatorName: string
  removeTime: string
  viewCount: number
  clickCount: number
  likeCountInZone: number
  shareCount: number
  collectionCount: number
  isOriginal: boolean
  originalProof: string
  hasViolation: boolean
  violationDetails: any
  accountStatusNormal: boolean
  accountStatusReason: string
  heatAtFeatured: number
  likeAtFeatured: number
  viewAtFeatured: number
  expireAt: string
  remark: string
  createdAt: string
  updatedAt: string
}

export interface FeaturedResourceItem extends ImageResource {
  isFeatured: boolean
  featuredStatus: FeaturedStatus | null
  featuredLevel: FeaturedLevel | null
  featuredWeight: number | null
}

export interface FeaturedPreValidateChecks {
  status: { valid: boolean; status: string }
  violation: { hasViolation: boolean; violationCount: number; details: any }
  quality: { resolutionScore: number; qualityScore: number }
  original: { score: number }
  compliance: { score: number }
  account: { normal: boolean; status: string; reason: string | null }
  overall: { score: number; threshold: number }
}

export interface FeaturedPreValidateResult {
  valid: boolean
  blocked: boolean
  errors: string[]
  warnings: string[]
  checkResults: FeaturedPreValidateChecks
  resource: ImageResource
  suggestedLevel: FeaturedLevel
  suggestedWeight: number
}

export interface FeaturedWorkLog {
  id: number
  featuredId: number
  featuredCode: string
  resourceId: number
  resourceTitle: string
  resourceType: 'image' | 'video' | 'audio' | 'template'
  operationType: FeaturedOperationType
  beforeStatus: string
  afterStatus: string
  beforeWeight: number
  afterWeight: number
  beforeLevel: string
  afterLevel: string
  beforePosition: string
  afterPosition: string
  changeFields: string[]
  beforeData: any
  afterData: any
  reason: string
  verifyBasis: any
  validationResult: any
  operatorId: number
  operatorName: string
  operatorRole: string
  ip: string
  batchId: string
  step: number
  duration: number
  result: FeaturedLogResult
  failReason: string
  warnings: string[]
  traceId: string
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical'
  recheckIssues: any
  createdAt: string
  updatedAt: string
}

export interface BatchFeatureResult {
  batchId: string
  total: number
  success: {
    id: number
    featuredId: number
    featuredCode: string
    title: string
    featuredLevel: FeaturedLevel
    overallScore: number
  }[]
  filtered: { id: number; title: string; reason: string }[]
  failed: { id: number; reason: string }[]
  warnings: { id: number; warnings: string[] }[]
}

export interface BatchCancelResult {
  batchId: string
  total: number
  success: { id: number; title: string }[]
  failed: { id: number; reason: string }[]
  filtered: { id: number; title: string; reason: string }[]
}

export interface FeaturedRecheckIssue {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  details?: any
  threshold?: number
  currentScore?: number
}

export interface FeaturedTraceResult {
  featured: FeaturedWork
  operationLogs: FeaturedWorkLog[]
  traceInfo: {
    traceTime: string
    featuredCode: string
    featuredAt: string
    featuredBy: string
    verifiedAt: string
    verifiedBy: string
    verifyBasis: string
  }
  recheckResult: {
    totalIssues: number
    criticalCount: number
    highCount: number
    mediumCount: number
    violationIssueCount: number
    accountIssueCount: number
    qualityIssueCount: number
    overallPass: boolean
    needReview: boolean
    issues: FeaturedRecheckIssue[]
  }
}

export interface FeaturedStatusOverview {
  total: number
  statusCounts: Record<FeaturedStatus, number>
  featuredCount: number
  verifiedCount: number
  pendingCount: number
  removedCount: number
  rejectedCount: number
  levelCounts: Record<FeaturedLevel, number>
  positionCounts: Record<string, number>
  avgOverallScore: number
  featuredRate: number
}

export interface FeaturedResourceListParams extends PageParams {
  keyword?: string
  fileType?: string
  categoryId?: number
  authorId?: number
  originalOnly?: boolean
  minLikeCount?: number
  minViewCount?: number
  noViolation?: boolean
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FeaturedListParams extends PageParams {
  keyword?: string
  status?: FeaturedStatus
  featuredLevel?: FeaturedLevel
  displayPosition?: DisplayPosition
  resourceType?: string
  categoryId?: number
  authorId?: number
  minOverallScore?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface FeaturedLogListParams extends PageParams {
  featuredId?: number
  resourceId?: number
  operationType?: FeaturedOperationType
  operatorId?: number
  batchId?: string
  result?: FeaturedLogResult
  riskLevel?: string
}

export interface FeaturedVerifyParams {
  pass: boolean
  reason?: string
  verifyBasis?: Record<string, any>
  operatorName?: string
}

export interface FeaturedCancelParams {
  reason?: string
  operatorName?: string
}

export interface FeaturedWeightParams {
  newWeight: number
  reason?: string
  operatorName?: string
}

export interface FeaturedPositionParams {
  newPosition: DisplayPosition | null
  reason?: string
  operatorName?: string
}

export interface FeaturedLevelParams {
  newLevel: FeaturedLevel
  displayWeight?: number
  reason?: string
  operatorName?: string
}

export type VisibilityType = 'public' | 'private' | 'friends_only' | 'violation_hidden'

export type VisibilityAuditStatus = 'none' | 'pending' | 'approved' | 'rejected'

export type VisibilityChangeType = 'manual' | 'auto' | 'batch' | 'audit'

export interface VisibilityCheckItem {
  valid: boolean
  reason?: string
  issues?: string[]
  currentCount?: number
}

export interface VisibilityPreValidateResult {
  canChange: boolean
  needsAudit: boolean
  currentVisibility: VisibilityType
  targetVisibility: VisibilityType
  checks: {
    transition: VisibilityCheckItem
    permission: VisibilityCheckItem
    account: VisibilityCheckItem
    content: VisibilityCheckItem
    highFrequency: VisibilityCheckItem
  }
  blockReasons: string[]
}

export interface VisibilityChangeResult {
  resource: any
  changed: boolean
  pendingAudit: boolean
  reason: string
}

export interface VisibilityBatchResult {
  successIds: number[]
  failedItems: { id: number; title: string; reason: string }[]
  pendingAuditIds: number[]
  filteredItems: { id: number; title: string; reason: string }[]
  total: number
  successCount: number
  failedCount: number
  pendingCount: number
  filteredCount: number
}

export interface VisibilityLogItem {
  id: number
  resourceId: number
  resourceTitle: string
  oldVisibility: VisibilityType | null
  newVisibility: VisibilityType
  changeType: VisibilityChangeType
  reason: string | null
  operatorId: number | null
  operatorName: string | null
  operatorRole: string | null
  auditStatus: VisibilityAuditStatus
  auditorId: number | null
  auditorName: string | null
  auditOpinion: string | null
  auditTime: string | null
  beforeSnapshot: any
  afterSnapshot: any
  ip: string | null
  userAgent: string | null
  changeCount: number
  isHighFrequency: boolean
  remark: string | null
  resource?: any
  createdAt: string
  updatedAt: string
}

export interface VisibilityStats {
  visibilityDistribution: Record<VisibilityType, number>
  pendingAudit: number
  todayChanges: number
  highFrequencyCount: number
}

export interface VisibilityListParams extends PageParams {
  keyword?: string
  visibility?: VisibilityType
  visibilityAuditStatus?: VisibilityAuditStatus
  categoryId?: number
  fileType?: string
  authorId?: number
  sortBy?: string
  sortOrder?: string
  violationOnly?: boolean
  abnormalOnly?: boolean
}

export interface VisibilityLogParams extends PageParams {
  resourceId?: number
  operatorId?: number
  changeType?: VisibilityChangeType
  newVisibility?: VisibilityType
  auditStatus?: VisibilityAuditStatus
  startTime?: string
  endTime?: string
  keyword?: string
}

export interface VisibilityChangeParams {
  newVisibility: VisibilityType
  reason?: string
}

export interface VisibilityAuditParams {
  pass: boolean
  auditOpinion?: string
}

export interface VisibilityBatchParams {
  ids: number[]
  newVisibility: VisibilityType
  reason?: string
}

export interface VisibilityDetailResult {
  resource: any
  changeLogs: VisibilityLogItem[]
  currentVisibility: VisibilityType
  auditStatus: VisibilityAuditStatus
  changeCount24h: number
}

export type QualityLevel = 'excellent' | 'good' | 'normal' | 'low_quality' | 'violation'

export type QualityReviewStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'locked'

export type AssessType = 'auto' | 'manual' | 'batch' | 'recheck'

export type ReviewResult = 'approved' | 'rejected' | 'locked'

export interface QualityScores {
  resolution: number
  content: number
  composition: number
  compliance: number
  author: number
  overall: number
}

export interface QualityFlagIssue {
  type: string
  severity: 'low' | 'warning' | 'high'
  description: string
}

export interface QualityConsistencyResult {
  consistent: boolean
  issues: QualityFlagIssue[]
  score: number
}

export interface QualityAssessResult {
  resource: any
  assessmentLog: QualityAssessmentLogItem
  scores: QualityScores
  level: QualityLevel
  flags: string[]
  needsReview: boolean
}

export interface QualityBatchAssessResult {
  successIds: number[]
  failedItems: { id: number; title: string; reason: string }[]
  excellent: { id: number; title: string; score: number }[]
  good: { id: number; title: string; score: number }[]
  normal: { id: number; title: string; score: number }[]
  low_quality: { id: number; title: string; score: number }[]
  violation: { id: number; title: string; score: number }[]
  total: number
  successCount: number
  failedCount: number
}

export interface QualityReviewResult {
  resource: any
  reviewLog: QualityReviewLogItem
  misjudgmentFound: boolean
  omissionsFound: boolean
  consistencyScore: number
  message: string
}

export interface QualityAssessmentLogItem {
  id: number
  resourceId: number
  resourceTitle: string
  assessType: AssessType
  oldQualityLevel: QualityLevel | null
  newQualityLevel: QualityLevel
  oldQualityScore: number | null
  newQualityScore: number
  resolutionScore: number
  contentScore: number
  compositionScore: number
  complianceScore: number
  authorQualityScore: number
  qualityFlags: { items?: string[] } | null
  assessBasis: any
  operatorId: number | null
  operatorName: string | null
  operatorRole: string | null
  remark: string | null
  ip: string | null
  userAgent: string | null
  beforeSnapshot: any
  afterSnapshot: any
  isMisjudgment: boolean
  misjudgmentNote: string | null
  resource?: any
  createdAt: string
  updatedAt: string
}

export interface QualityReviewLogItem {
  id: number
  assessmentLogId: number | null
  resourceId: number
  resourceTitle: string
  oldQualityLevel: QualityLevel
  newQualityLevel: QualityLevel | null
  reviewResult: ReviewResult
  reviewReason: string | null
  reviewBasis: any
  reviewerId: number
  reviewerName: string
  reviewerRole: string | null
  consistencyScore: number
  misjudgmentFound: boolean
  omissionsFound: boolean
  ruleOptimizationNote: string | null
  ip: string | null
  userAgent: string | null
  reviewedAt: string | null
  resource?: any
  reviewer?: any
  assessmentLog?: QualityAssessmentLogItem
  createdAt: string
  updatedAt: string
}

export interface QualityStats {
  levelDistribution: Record<QualityLevel, number>
  pendingReview: number
  locked: number
  todayAssessments: number
  todayReviews: number
  misjudgments: number
  avgQualityScore: string
}

export interface QualityListParams extends PageParams {
  keyword?: string
  qualityLevel?: QualityLevel
  qualityReviewStatus?: QualityReviewStatus
  fileType?: string
  categoryId?: number
  authorId?: number
  minScore?: number
  maxScore?: number
  needsReview?: boolean
  hasViolation?: boolean
  sortBy?: string
  sortOrder?: string
}

export interface QualityLogParams extends PageParams {
  resourceId?: number
  assessType?: AssessType
  newQualityLevel?: QualityLevel
  operatorId?: number
  startTime?: string
  endTime?: string
  keyword?: string
  misjudgmentOnly?: boolean
}

export interface QualityReviewLogParams extends PageParams {
  resourceId?: number
  reviewResult?: ReviewResult
  reviewerId?: number
  startTime?: string
  endTime?: string
  keyword?: string
  misjudgmentOnly?: boolean
  omissionsOnly?: boolean
}

export interface QualityAssessParams {
  remark?: string
}

export interface QualityBatchAssessParams {
  ids: number[]
  remark?: string
}

export interface QualityReviewParams {
  reviewResult: ReviewResult
  newLevel?: QualityLevel
  reviewReason?: string
  lockReason?: string
  ruleOptimizationNote?: string
}

export interface QualityDetailResult {
  resource: any
  assessmentLogs: QualityAssessmentLogItem[]
  reviewLogs: QualityReviewLogItem[]
  consistency: QualityConsistencyResult
  scores: QualityScores
  flags: string[]
}

export type DataIntegrityStatus = 'normal' | 'suspected' | 'abnormal'

export type DataQueryType = 'single' | 'batch' | 'summary' | 'trace'

export interface DataPreValidateResult {
  canQuery: boolean
  errors: string[]
  warnings: string[]
}

export interface DataOverview {
  totalResources: number
  totalViews: number
  totalLikes: number
  totalFavorites: number
  totalShares: number
  totalComments: number
  abnormalCount: number
  qualityDistribution: Record<string, number>
  topByHotness: { id: number; title: string; hotnessScore: number; viewCount: number; likeCount: number }[]
  recentSnapshots: number
  recentAnomalies: number
}

export interface DataSnapshotItem {
  id: number
  resourceId: number
  resourceTitle: string
  snapshotDate: string
  snapshotType: string
  viewCount: number
  viewIncrement: number
  likeCount: number
  likeIncrement: number
  favoriteCount: number
  favoriteIncrement: number
  shareCount: number
  shareIncrement: number
  commentCount: number
  commentIncrement: number
  downloadCount: number
  downloadIncrement: number
  hotnessScore: number
  hotnessRank: number
  trafficSources: any
  integrityCheck: any
  isAnomaly: boolean
  anomalyDetails: any
  createdAt: string
}

export interface DataIntegrityIssue {
  type: string
  severity: 'low' | 'medium' | 'high'
  description: string
}

export interface DataIntegrityResult {
  hasIssues: boolean
  issues: DataIntegrityIssue[]
  score: number
}

export interface ResourceDataDetail {
  resource: any
  currentData: {
    viewCount: number
    likeCount: number
    favoriteCount: number
    shareCount: number
    commentCount: number
    downloadCount: number
    hotnessScore: number
  }
  dailySnapshots: DataSnapshotItem[]
  integrityCheck: DataIntegrityResult
  dataIntegrityStatus: DataIntegrityStatus
}

export interface BatchSummaryResult {
  total: number
  totalViews: number
  totalLikes: number
  totalFavorites: number
  totalShares: number
  totalComments: number
  totalDownloads: number
  totalHotness: number
  avgViews: string
  avgLikes: string
  avgHotness: string
  anomalyCount: number
  qualityDistribution: Record<string, number>
  statusDistribution: Record<string, number>
  topByViews: { id: number; title: string; value: number }[]
  topByLikes: { id: number; title: string; value: number }[]
  topByHotness: { id: number; title: string; value: number }[]
}

export interface DataTraceResult {
  resource: { id: number; title: string; qualityLevel: string }
  currentData: {
    viewCount: number
    likeCount: number
    favoriteCount: number
    shareCount: number
    commentCount: number
    downloadCount: number
  }
  dailyIncrements: {
    date: string
    viewIncrement: number
    likeIncrement: number
    favoriteIncrement: number
    shareIncrement: number
    commentIncrement: number
    downloadIncrement: number
    hotnessScore: number
    hotnessRank: number
    isAnomaly: boolean
    trafficSources: any
  }[]
  totalIncrements: {
    views: number
    likes: number
    favorites: number
    shares: number
    comments: number
  }
  avgDaily: {
    views: string
    likes: string
    favorites: string
    shares: string
    comments: string
  }
  peakDay: any
  integrityCheck: DataIntegrityResult
  snapshotDays: number
}

export interface DataQueryLogItem {
  id: number
  queryType: DataQueryType
  operatorId: number | null
  operatorName: string | null
  operatorRole: string | null
  queryParams: any
  validationResult: any
  resultCount: number
  affectedResourceIds: number[] | null
  summaryData: any
  anomalyFound: boolean
  anomalyDetails: any
  ip: string | null
  userAgent: string | null
  remark: string | null
  createdAt: string
}

export interface DataListParams extends PageParams {
  keyword?: string
  fileType?: string
  qualityLevel?: string
  visibility?: string
  status?: string
  categoryId?: number
  authorId?: number
  startTime?: string
  endTime?: string
  minScore?: number
  maxScore?: number
  sortBy?: string
  sortOrder?: string
  includeDeleted?: boolean
  includeHidden?: boolean
}

export interface DataQueryLogParams extends PageParams {
  queryType?: DataQueryType
  operatorId?: number
  startTime?: string
  endTime?: string
}



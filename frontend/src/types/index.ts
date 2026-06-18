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
  level: string
  points: number
  balance: number
  expireTime: string
  totalDownload: number
  totalConsume: number
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
  userId: number
  username: string
  module: string
  action: string
  target: string
  targetId: number
  detail: string
  ip: string
  result: string
  createdAt: string
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

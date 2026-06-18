import type { Request } from 'express'

export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

export interface PageParams {
  page: number
  pageSize: number
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PageResult<T, P = Record<string, any>> {
  list: T[]
  total: number
  page: number
  pageSize: number
  stats?: Array<{ abnormalType: string; count: number }>
  permission?: P
}

export interface JwtPayload {
  userId: number
  username: string
  roles: string[]
  permissions: string[]
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload
}

export interface NoteDraftData {
  id?: number
  title: string
  content: string
  coverImage?: string
  videoUrl?: string
  noteType?: number
  tagIds?: number[]
  externalLinks?: string[]
}

export interface NotePublishData extends NoteDraftData {
  ip?: string
  userAgent?: string
  batchNo?: string
  contentFingerprint?: string
}

export interface NoteScheduleData extends NotePublishData {
  scheduleTime: Date
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

export interface ReviewWeightParams {
  noteType: number
  noteLevel: number
  hasSensitiveWords: boolean
  violationCount7d: number
  authorLevel: number
}

export interface ReviewActionData {
  noteId: number
  action: number
  reason?: string
  violationType?: string
}

export interface BatchReviewData {
  noteIds: number[]
  action: number
  reason?: string
  violationType?: string
}

export interface ReviewResult {
  noteId: number
  success: boolean
  action: number
  statusAfter: number
  error?: string
}

export interface ReviewComplianceResult {
  isCompliant: boolean
  isAbnormal: boolean
  abnormalType?: string
  abnormalReason?: string
  severity?: number
}

export interface ReviewerStats {
  totalReviewed: number
  approved: number
  rejected: number
  postponed: number
  rejectionRate: number
  abnormalCount: number
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

export interface NoteOpsComplianceResult {
  allowed: boolean
  blockedReason?: string
  warnings?: string[]
  isAbnormal?: boolean
  abnormalReason?: string
}

export type OperatorRole = 'admin' | 'super_ops' | 'normal_ops'

export interface NoteOpsLogListParams {
  page: number
  pageSize: number
  noteId?: number
  operatorId?: number
  operatorRole?: OperatorRole
  startTime?: string
  endTime?: string
}

export interface NoteOpsStats {
  totalToday: number
  abnormalCount: number
  byOperator: Array<{
    operatorId: number
    operatorName: string
    count: number
  }>
}

export interface NoteAbnormalOpsListParams {
  page: number
  pageSize: number
  handled?: number
}

export interface CategoryData {
  id?: number
  name: string
  code: string
  parentId?: number
  level?: number
  description?: string
  coverImage?: string
  icon?: string
  color?: string
  sort?: number
  status?: number
  isCore?: number
  weight?: number
  scenes: string[]
}

export interface TagData {
  id?: number
  name: string
  type?: string
  categoryId?: number | null
  parentId?: number | null
  description?: string
  coverImage?: string
  sort?: number
  status?: number
  hotLevel?: number
  weight?: number
  isCore?: number
  complianceTags: string[]
  scenes?: string[]
  color?: string
  icon?: string
}

export interface BatchTagOpsData {
  ids: number[]
  action: 'enable' | 'disable' | 'update_weight' | 'delete'
  weight?: number
}

export interface TagCategoryComplianceResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

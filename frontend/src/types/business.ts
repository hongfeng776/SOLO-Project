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
  type: TagType
  sort: number
  status: number
  createTime: string
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

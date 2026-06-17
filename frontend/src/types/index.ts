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

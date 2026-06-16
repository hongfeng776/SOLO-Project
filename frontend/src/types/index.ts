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

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

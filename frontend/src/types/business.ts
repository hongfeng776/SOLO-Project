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

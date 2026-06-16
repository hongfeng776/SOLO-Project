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
  username: string
  nickname: string
  avatar: string
  role: string
  email: string
  phone: string
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
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: number
  name: string
  icon: string
  sort: number
  status: string
  parentId: number
  children?: Category[]
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
  createdAt: string
  updatedAt: string
}

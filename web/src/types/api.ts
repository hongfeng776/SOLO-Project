export interface Result<T = any> {
  code: number
  message: string
  data: T
}

export interface UserInfo {
  id: number
  username: string
  nickname: string
  avatar: string
  phone: string
  email: string
}

export interface LoginData {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  userInfo: UserInfo
}

export interface PageResult<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

export interface PageParams {
  pageNum?: number
  pageSize?: number
  keyword?: string
}

export interface UserVO {
  id: number
  username: string
  nickname: string
  avatar: string
  phone: string
  email: string
  status: number
  publishCount?: number
  createTime: string
}

export interface VocabularyVO {
  id: number
  word: string
  phonetic: string
  partOfSpeech: string
  definition: string
  example: string
  translation: string
  creatorId: number
  creatorName: string
  status: number
  materialCount: number
  commentCount: number
  createTime: string
}

export interface MaterialVO {
  id: number
  vocabularyId: number
  vocabularyWord: string
  title: string
  content: string
  materialType: string
  source: string
  difficulty: number
  creatorId: number
  creatorName: string
  status: number
  commentCount: number
  createTime: string
}

export interface CommentVO {
  id: number
  vocabularyId: number
  materialId: number
  vocabularyWord: string
  materialTitle: string
  userId: number
  userName: string
  content: string
  likes: number
  status: number
  createTime: string
}

export interface ViolationVO {
  id: number
  userId: number
  userName: string
  targetType: string
  targetId: number
  reason: string
  description: string
  status: number
  handlerId: number
  handlerName: string
  handleResult: string
  createTime: string
}

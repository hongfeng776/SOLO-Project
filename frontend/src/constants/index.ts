export enum ResourceStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
  OFFLINE = 'offline'
}

export const ResourceStatusLabel: Record<ResourceStatus, string> = {
  [ResourceStatus.DRAFT]: '草稿',
  [ResourceStatus.PENDING]: '待审核',
  [ResourceStatus.APPROVED]: '审核通过',
  [ResourceStatus.REJECTED]: '审核拒绝',
  [ResourceStatus.PUBLISHED]: '已发布',
  [ResourceStatus.OFFLINE]: '已下架'
}

export enum AuditLevel {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3
}

export const AuditLevelLabel: Record<AuditLevel, string> = {
  [AuditLevel.LEVEL_1]: '一级审核',
  [AuditLevel.LEVEL_2]: '二级审核',
  [AuditLevel.LEVEL_3]: '三级审核'
}

export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  TEMPLATE = 'template'
}

export const FileTypeLabel: Record<FileType, string> = {
  [FileType.IMAGE]: '图片',
  [FileType.VIDEO]: '视频',
  [FileType.AUDIO]: '音频',
  [FileType.TEMPLATE]: '模板'
}

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  AUDITOR = 'auditor',
  OPERATOR = 'operator',
  MEMBER = 'member'
}

export const UserRoleLabel: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: '超级管理员',
  [UserRole.ADMIN]: '管理员',
  [UserRole.AUDITOR]: '审核员',
  [UserRole.OPERATOR]: '运营员',
  [UserRole.MEMBER]: '会员'
}

export enum MemberLevel {
  NORMAL = 'normal',
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export const MemberLevelLabel: Record<MemberLevel, string> = {
  [MemberLevel.NORMAL]: '普通会员',
  [MemberLevel.BRONZE]: '青铜会员',
  [MemberLevel.SILVER]: '白银会员',
  [MemberLevel.GOLD]: '黄金会员',
  [MemberLevel.PLATINUM]: '铂金会员'
}

export const DATE_FORMAT = 'YYYY-MM-DD'
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss'
export const TIME_FORMAT = 'HH:mm:ss'

export const IMAGE_MAX_SIZE = 10 * 1024 * 1024
export const VIDEO_MAX_SIZE = 500 * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/mov']

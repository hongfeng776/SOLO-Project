export const CONTENT_AUDIT_STATUS = {
  PENDING: { value: 0, label: '待审核', color: '#E6A23C', type: 'warning' },
  REVIEWING: { value: 1, label: '审核中', color: '#409EFF', type: 'primary' },
  APPROVED: { value: 2, label: '审核通过', color: '#67C23A', type: 'success' },
  REJECTED: { value: 3, label: '审核驳回', color: '#F56C6C', type: 'danger' },
  OFFLINE: { value: 4, label: '已下架', color: '#909399', type: 'info' },
} as const

export const COPYRIGHT_TYPE = {
  EXCLUSIVE: { value: 1, label: '独家版权', color: '#409EFF', type: 'primary' },
  NON_EXCLUSIVE: { value: 2, label: '非独家版权', color: '#67C23A', type: 'success' },
  AGENCY: { value: 3, label: '代理版权', color: '#E6A23C', type: 'warning' },
  PUBLIC: { value: 4, label: '公共版权', color: '#909399', type: 'info' },
} as const

export const MEMBER_LEVEL = {
  NORMAL: { value: 0, label: '普通用户', color: '#909399', type: 'info' },
  VIP: { value: 1, label: 'VIP会员', color: '#E6A23C', type: 'warning' },
  SVIP: { value: 2, label: 'SVIP会员', color: '#F56C6C', type: 'danger' },
  YEAR_VIP: { value: 3, label: '年度VIP', color: '#409EFF', type: 'primary' },
  LIFETIME: { value: 4, label: '终身会员', color: '#67C23A', type: 'success' },
} as const

export const CONTENT_CATEGORY = {
  MOVIE: { value: 1, label: '电影' },
  TV_SERIES: { value: 2, label: '电视剧' },
  VARIETY: { value: 3, label: '综艺' },
  ANIME: { value: 4, label: '动漫' },
  DOCUMENTARY: { value: 5, label: '纪录片' },
  SHORT_VIDEO: { value: 6, label: '短视频' },
  LIVE: { value: 7, label: '直播' },
} as const

export const CLARITY_LEVEL = {
  SD: { value: 1, label: '标清480P' },
  HD: { value: 2, label: '高清720P' },
  FHD: { value: 3, label: '全高清1080P' },
  UHD_4K: { value: 4, label: '超清4K' },
  UHD_8K: { value: 5, label: '极致8K' },
} as const

export const RESOLUTION_OPTIONS = [
  { value: '480x360', label: '480P (480×360)' },
  { value: '640x480', label: '480P (640×480)' },
  { value: '1280x720', label: '720P (1280×720)' },
  { value: '1920x1080', label: '1080P (1920×1080)' },
  { value: '2560x1440', label: '2K (2560×1440)' },
  { value: '3840x2160', label: '4K (3840×2160)' },
  { value: '7680x4320', label: '8K (7680×4320)' },
] as const

export const AD_STATUS = {
  DRAFT: { value: 0, label: '草稿', color: '#909399', type: 'info' },
  PENDING: { value: 1, label: '待投放', color: '#E6A23C', type: 'warning' },
  RUNNING: { value: 2, label: '投放中', color: '#67C23A', type: 'success' },
  PAUSED: { value: 3, label: '已暂停', color: '#F56C6C', type: 'danger' },
  ENDED: { value: 4, label: '已结束', color: '#409EFF', type: 'primary' },
} as const

export const AD_TYPE = {
  BANNER: { value: 1, label: '首页Banner' },
  SPLASH: { value: 2, label: '开屏广告' },
  INTERSTITIAL: { value: 3, label: '插屏广告' },
  NATIVE: { value: 4, label: '信息流广告' },
  REWARD: { value: 5, label: '激励视频' },
} as const

export const ACTIVITY_STATUS = {
  DRAFT: { value: 0, label: '草稿', color: '#909399', type: 'info' },
  PUBLISHED: { value: 1, label: '已发布', color: '#67C23A', type: 'success' },
  ONGOING: { value: 2, label: '进行中', color: '#409EFF', type: 'primary' },
  ENDED: { value: 3, label: '已结束', color: '#E6A23C', type: 'warning' },
  CANCELLED: { value: 4, label: '已取消', color: '#F56C6C', type: 'danger' },
} as const

export const ACTIVITY_TYPE = {
  DISCOUNT: { value: 1, label: '优惠活动' },
  LUCKY_DRAW: { value: 2, label: '抽奖活动' },
  SIGN_IN: { value: 3, label: '签到活动' },
  SEASONAL: { value: 4, label: '节日活动' },
  MEMBER_PROMOTION: { value: 5, label: '会员促销' },
} as const

export const USER_STATUS = {
  ACTIVE: { value: 1, label: '正常', color: '#67C23A', type: 'success' },
  DISABLED: { value: 0, label: '禁用', color: '#F56C6C', type: 'danger' },
  LOCKED: { value: 2, label: '锁定', color: '#E6A23C', type: 'warning' },
} as const

export const ROLE_CODE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  CONTENT_AUDITOR: 'CONTENT_AUDITOR',
  COPYRIGHT_MANAGER: 'COPYRIGHT_MANAGER',
  AD_MANAGER: 'AD_MANAGER',
  ACTIVITY_MANAGER: 'ACTIVITY_MANAGER',
  VIEWER: 'VIEWER',
} as const

export const DATE_FORMAT = {
  FULL: 'YYYY-MM-DD HH:mm:ss',
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  MONTH: 'YYYY-MM',
} as const

export type EnumObjType = Record<string, { value: number | string; label: string; color?: string; type?: string }>

export function getEnumOptions<T extends EnumObjType>(enumObj: T): Array<T[keyof T]> {
  return Object.values(enumObj) as Array<T[keyof T]>
}

export function getEnumLabel<T extends EnumObjType>(enumObj: T, value: number | string): string {
  const item = Object.values(enumObj).find((e) => e.value === value)
  return item ? item.label : '未知'
}

export function getEnumItem<T extends EnumObjType>(enumObj: T, value: number | string) {
  return Object.values(enumObj).find((e) => e.value === value) || null
}

export const COMMENT_STATUS = {
  PENDING: { value: 0, label: '待审核', color: '#E6A23C', type: 'warning' },
  NORMAL: { value: 1, label: '正常', color: '#67C23A', type: 'success' },
  HIDDEN: { value: 2, label: '已隐藏', color: '#909399', type: 'info' },
  DELETED: { value: 3, label: '违规删除', color: '#F56C6C', type: 'danger' },
} as const

export const MEMBER_STATUS = {
  EXPIRED: { value: 0, label: '已过期', color: '#909399', type: 'info' },
  ACTIVE: { value: 1, label: '正常', color: '#67C23A', type: 'success' },
  FROZEN: { value: 2, label: '已冻结', color: '#F56C6C', type: 'danger' },
  PENDING: { value: 3, label: '待激活', color: '#E6A23C', type: 'warning' },
} as const

export const MESSAGE_TYPE = {
  SYSTEM: { value: 1, label: '系统通知' },
  AUDIT: { value: 2, label: '审核通知' },
  COPYRIGHT_WARNING: { value: 3, label: '版权预警' },
  ACTIVITY: { value: 4, label: '活动通知' },
  COMMENT_REPLY: { value: 5, label: '评论回复' },
  MEMBER: { value: 6, label: '会员通知' },
  AD: { value: 7, label: '广告通知' },
} as const

export const OPERATION_TYPE = {
  CREATE: { value: 'CREATE', label: '新增' },
  UPDATE: { value: 'UPDATE', label: '修改' },
  DELETE: { value: 'DELETE', label: '删除' },
  AUDIT: { value: 'AUDIT', label: '审核' },
  BATCH_DELETE: { value: 'BATCH_DELETE', label: '批量删除' },
  EXPORT: { value: 'EXPORT', label: '导出' },
  LOGIN: { value: 'LOGIN', label: '登录' },
  LOGOUT: { value: 'LOGOUT', label: '退出' },
  CHANGE_STATUS: { value: 'CHANGE_STATUS', label: '状态变更' },
  CHANGE_PASSWORD: { value: 'CHANGE_PASSWORD', label: '修改密码' },
} as const

export const VIOLATION_LEVEL = {
  NONE: { value: 0, label: '无违规', color: '#67C23A', type: 'success' },
  LOW: { value: 1, label: '低风险', color: '#E6A23C', type: 'warning' },
  MEDIUM: { value: 2, label: '中风险', color: '#F56C6C', type: 'danger' },
  HIGH: { value: 3, label: '高风险', color: '#F56C6C', type: 'danger' },
} as const

export const MESSAGE_PRIORITY = {
  NORMAL: { value: 0, label: '普通' },
  IMPORTANT: { value: 1, label: '重要' },
  URGENT: { value: 2, label: '紧急' },
} as const

export const OPERATION_MODULE = {
  CONTENT: { value: 'content', label: '内容管理' },
  COPYRIGHT: { value: 'copyright', label: '版权管理' },
  ADVERTISEMENT: { value: 'advertisement', label: '广告管理' },
  ACTIVITY: { value: 'activity', label: '活动管理' },
  USER: { value: 'user', label: '用户管理' },
  ROLE: { value: 'role', label: '角色管理' },
  COMMENT: { value: 'comment', label: '评论管理' },
  MEMBER: { value: 'member', label: '会员管理' },
  AUTH: { value: 'auth', label: '认证授权' },
  SYSTEM: { value: 'system', label: '系统管理' },
  SHORT_VIDEO: { value: 'shortVideo', label: '短视频管理' },
} as const

export const CREATOR_LEVEL = {
  NORMAL: { value: 0, label: '普通创作者', color: '#909399', type: 'info' },
  JUNIOR: { value: 1, label: '初级创作者', color: '#67C23A', type: 'success' },
  INTERMEDIATE: { value: 2, label: '中级创作者', color: '#409EFF', type: 'primary' },
  SENIOR: { value: 3, label: '高级创作者', color: '#E6A23C', type: 'warning' },
  HEAD: { value: 4, label: '头部创作者', color: '#F56C6C', type: 'danger' },
} as const

export const CONTENT_RATING = {
  ALL_AGE: { value: 0, label: '全年龄', color: '#67C23A', type: 'success' },
  TEEN: { value: 1, label: '青少年', color: '#409EFF', type: 'primary' },
  ADULT: { value: 2, label: '成人', color: '#F56C6C', type: 'danger' },
} as const

export const VIDEO_QUALITY = {
  SD: { value: 0, label: '标清', color: '#909399', type: 'info' },
  HD: { value: 1, label: '高清', color: '#67C23A', type: 'success' },
  UHD: { value: 2, label: '超清', color: '#409EFF', type: 'primary' },
  BLU_RAY: { value: 3, label: '蓝光', color: '#E6A23C', type: 'warning' },
} as const

export const VIDEO_FORMAT = {
  MP4: { value: 'mp4', label: 'MP4' },
  WEBM: { value: 'webm', label: 'WebM' },
  MOV: { value: 'mov', label: 'MOV' },
  AVI: { value: 'avi', label: 'AVI' },
} as const

export const SHORT_VIDEO_STATUS = {
  DRAFT: { value: 0, label: '草稿', color: '#909399', type: 'info' },
  REVIEWING: { value: 1, label: '审核中', color: '#409EFF', type: 'primary' },
  PUBLISHED: { value: 2, label: '已上架', color: '#67C23A', type: 'success' },
  OFFLINE: { value: 3, label: '已下架', color: '#E6A23C', type: 'warning' },
  VIOLATION: { value: 5, label: '违规封禁', color: '#F56C6C', type: 'danger' },
  ARCHIVED: { value: 6, label: '已归档', color: '#C0C4CC', type: 'info' },
} as const

export const STATUS_CHANGE_TYPE = {
  CREATE: { value: 'CREATE', label: '创建' },
  AUDIT: { value: 'AUDIT', label: '审核' },
  MANUAL: { value: 'MANUAL', label: '手动变更' },
  BATCH: { value: 'BATCH', label: '批量操作' },
  SYSTEM: { value: 'SYSTEM', label: '系统触发' },
} as const

export const VIOLATION_TYPE = {
  COPYRIGHT: { value: 'copyright', label: '版权侵权' },
  PORN: { value: 'porn', label: '色情低俗' },
  VIOLENCE: { value: 'violence', label: '暴力血腥' },
  POLITICS: { value: 'politics', label: '政治敏感' },
  SPAM: { value: 'spam', label: '垃圾广告' },
  PLAGIARISM: { value: 'plagiarism', label: '抄袭搬运' },
  OTHER: { value: 'other', label: '其他违规' },
} as const

export const DATE_FORMAT_STRING = DATE_FORMAT

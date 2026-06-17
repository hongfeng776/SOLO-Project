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

export const ARTICLE_TYPE = {
  NEWS: { value: 0, label: '普通资讯', color: '#409EFF', type: 'primary' },
  TOPIC: { value: 1, label: '专题文章', color: '#67C23A', type: 'success' },
  COLUMN: { value: 2, label: '专栏', color: '#E6A23C', type: 'warning' },
  INTERVIEW: { value: 3, label: '人物访谈', color: '#909399', type: 'info' },
  ANALYSIS: { value: 4, label: '行业分析', color: '#F56C6C', type: 'danger' },
} as const

export const DOMAIN_CATEGORY = {
  TECH: { value: 'tech', label: '科技', color: '#409EFF', type: 'primary' },
  ENTERTAINMENT: { value: 'entertainment', label: '娱乐', color: '#E6A23C', type: 'warning' },
  SPORTS: { value: 'sports', label: '体育', color: '#67C23A', type: 'success' },
  FINANCE: { value: 'finance', label: '财经', color: '#F56C6C', type: 'danger' },
  LIFESTYLE: { value: 'lifestyle', label: '生活', color: '#909399', type: 'info' },
  EDUCATION: { value: 'education', label: '教育', color: '#67C23A', type: 'success' },
} as const

export const PUBLISH_CHANNEL = {
  HOME: { value: 1, label: '首页', color: '#409EFF', type: 'primary' },
  NEWS: { value: 2, label: '资讯页', color: '#67C23A', type: 'success' },
  TOPIC: { value: 3, label: '专题页', color: '#E6A23C', type: 'warning' },
  MULTI: { value: 4, label: '多渠道', color: '#F56C6C', type: 'danger' },
} as const

export const PUBLISH_PERMISSION = {
  PUBLIC: { value: 0, label: '公开', color: '#67C23A', type: 'success' },
  LOGIN: { value: 1, label: '登录可见', color: '#409EFF', type: 'primary' },
  MEMBER: { value: 2, label: '会员可见', color: '#E6A23C', type: 'warning' },
  PAID: { value: 3, label: '付费可见', color: '#F56C6C', type: 'danger' },
} as const

export const LAYOUT_TEMPLATE = {
  DEFAULT: { value: 'default', label: '默认模板', desc: '标准三栏布局' },
  FULL_WIDTH: { value: 'full-width', label: '通栏模板', desc: '全宽沉浸式阅读' },
  MAGAZINE: { value: 'magazine', label: '杂志模板', desc: '图文并茂杂志风' },
  ELEGANT: { value: 'elegant', label: '雅致模板', desc: '简约文艺排版' },
  TECH_STYLE: { value: 'tech-style', label: '科技模板', desc: '深色科技风格' },
} as const

export const ARTICLE_QUALITY = {
  LOW: { value: 0, label: '低质', color: '#F56C6C', type: 'danger' },
  NORMAL: { value: 1, label: '普通', color: '#909399', type: 'info' },
  GOOD: { value: 2, label: '优质', color: '#67C23A', type: 'success' },
  EXCELLENT: { value: 3, label: '精品', color: '#409EFF', type: 'primary' },
} as const

export const EDIT_MODE = {
  FULL: { value: 0, label: '全覆盖修改', desc: '替换全部内容，生成新版本' },
  INCREMENTAL: { value: 1, label: '增量修改', desc: '只更新修改部分，保留原内容' },
} as const

export const SENSITIVE_CHECK_STATUS = {
  UNCHECKED: { value: 0, label: '未检测', type: 'info' },
  PASSED: { value: 1, label: '检测通过', type: 'success' },
  FAILED: { value: 2, label: '含敏感词', type: 'danger' },
} as const

export const TOPIC_TYPE = {
  FESTIVAL: { value: 0, label: '节日专题', color: '#F56C6C', type: 'danger' },
  HOT: { value: 1, label: '热点专题', color: '#E6A23C', type: 'warning' },
  CATEGORY: { value: 2, label: '品类专题', color: '#409EFF', type: 'primary' },
  PEOPLE: { value: 3, label: '人物专题', color: '#909399', type: 'info' },
  ACTIVITY: { value: 4, label: '活动专题', color: '#67C23A', type: 'success' },
} as const

export const TOPIC_COVER_TEMPLATE = {
  FESTIVAL_DEFAULT: { value: 'festival-default', label: '节日默认模板', desc: '红金配色，节日氛围' },
  HOT_STYLE: { value: 'hot-style', label: '热点风格模板', desc: '醒目大标题，时效性强' },
  CATEGORY_BANNER: { value: 'category-banner', label: '品类横幅模板', desc: '分类导航，内容聚合' },
  PEOPLE_FEATURE: { value: 'people-feature', label: '人物特写模板', desc: '大图人物，故事叙述' },
  ACTIVITY_SPECIAL: { value: 'activity-special', label: '活动专属模板', desc: '互动感强，转化导向' },
} as const

export const TOPIC_SORT_RULE = {
  MANUAL: { value: 0, label: '手动排序' },
  HOT: { value: 1, label: '热度优先' },
  TIME: { value: 2, label: '时间优先' },
  WEIGHT: { value: 3, label: '权重优先' },
  COMPOSITE: { value: 4, label: '综合评分' },
} as const

export const TOPIC_STATUS = {
  DRAFT: { value: 0, label: '草稿', color: '#909399', type: 'info' },
  NOT_LAUNCHED: { value: 1, label: '未上线', color: '#409EFF', type: 'primary' },
  ONLINE: { value: 2, label: '已上线', color: '#67C23A', type: 'success' },
  OFFLINE: { value: 3, label: '已下线', color: '#E6A23C', type: 'warning' },
  EXPIRED: { value: 4, label: '已过期', color: '#F56C6C', type: 'danger' },
} as const

export const COVER_CATEGORY = {
  MOVIE: { value: 'movie', label: '电影' },
  TV: { value: 'tv', label: '剧集' },
  SHORT_VIDEO: { value: 'short_video', label: '短视频' },
  ARTICLE: { value: 'article', label: '图文' },
  ACTIVITY: { value: 'activity', label: '活动' },
} as const

export const DATE_FORMAT_STRING = DATE_FORMAT

export const RISK_LEVEL = {
  LOW: { value: 1, label: '低风险', color: '#67C23A', type: 'success' },
  MEDIUM: { value: 2, label: '中风险', color: '#E6A23C', type: 'warning' },
  HIGH: { value: 3, label: '高风险', color: '#F56C6C', type: 'danger' },
  VERY_HIGH: { value: 4, label: '极高风险', color: '#C0392B', type: 'danger' },
} as const

export const AUDIT_REVIEW_LEVEL = {
  FIRST: { value: 1, label: '初审', color: '#409EFF', type: 'primary' },
  SECOND: { value: 2, label: '复审', color: '#E6A23C', type: 'warning' },
  THIRD: { value: 3, label: '终审', color: '#F56C6C', type: 'danger' },
} as const

export const AUDIT_TASK_PRIORITY = {
  NORMAL: { value: 0, label: '普通', color: '#909399', type: 'info' },
  URGENT: { value: 1, label: '加急', color: '#E6A23C', type: 'warning' },
  SUPER_URGENT: { value: 2, label: '特急', color: '#F56C6C', type: 'danger' },
} as const

export const REJECT_REASON_CATEGORY = {
  COPYRIGHT: { value: 'copyright', label: '版权问题', examples: ['无版权证明', '版权过期', '版权归属不清'] },
  QUALITY: { value: 'quality', label: '内容质量', examples: ['画质模糊', '音画不同步', '画面抖动'] },
  POLICY: { value: 'policy', label: '违规内容', examples: ['含敏感内容', '违反社区规范', '广告营销'] },
  METADATA: { value: 'metadata', label: '信息错误', examples: ['标题错误', '分类错误', '标签不规范'] },
  OTHER: { value: 'other', label: '其他原因', examples: [] },
} as const

export const AUDIT_EXCEPTION_TYPE = {
  DUPLICATE_SUBMIT: { value: 'duplicate_submit', label: '重复提交', color: '#E6A23C' },
  STATUS_ABNORMAL: { value: 'status_abnormal', label: '状态异常', color: '#F56C6C' },
  OMISSION: { value: 'omission', label: '审核疏漏', color: '#409EFF' },
  VIOLATION_AUDIT: { value: 'violation_audit', label: '违规审核', color: '#C0392B' },
  SPEED_ABNORMAL: { value: 'speed_abnormal', label: '审核速度异常', color: '#722ed1' },
} as const

export const QC_REPORT_STATUS = {
  PENDING: { value: 0, label: '待处理', color: '#E6A23C', type: 'warning' },
  PROCESSING: { value: 1, label: '处理中', color: '#409EFF', type: 'primary' },
  RESOLVED: { value: 2, label: '已处理', color: '#67C23A', type: 'success' },
  IGNORED: { value: 3, label: '已忽略', color: '#909399', type: 'info' },
} as const

export const BATCH_AUDIT_ACTION = {
  APPROVE: { value: 'approve', label: '批量通过', icon: 'CircleCheck', type: 'success' },
  REJECT: { value: 'reject', label: '批量驳回', icon: 'CircleClose', type: 'danger' },
  PENDING: { value: 'pending', label: '批量待定', icon: 'Clock', type: 'warning' },
  URGENT: { value: 'urgent', label: '批量加急', icon: 'Lightning', type: 'primary' },
  ARCHIVE: { value: 'archive', label: '批量归档', icon: 'Folder', type: 'info' },
} as const

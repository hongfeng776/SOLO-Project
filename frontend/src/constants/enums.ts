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

export const ARTICLE_AUDIT_STATUS = {
  PENDING: { value: 0, label: '待审核', color: '#E6A23C', type: 'warning' },
  REVIEWING: { value: 1, label: '审核中', color: '#409EFF', type: 'primary' },
  APPROVED: { value: 2, label: '已通过', color: '#67C23A', type: 'success' },
  REJECTED: { value: 3, label: '已驳回', color: '#F56C6C', type: 'danger' },
  SUSPECTED: { value: 6, label: '疑似违规', color: '#722ed1', type: 'warning' },
} as const

export const AI_PRE_SCREEN_RESULT = {
  PASSED: { value: 'passed', label: 'AI初筛通过', color: '#67C23A', type: 'success' },
  WARNING: { value: 'warning', label: 'AI警告', color: '#E6A23C', type: 'warning' },
  FAILED: { value: 'failed', label: 'AI初筛异常', color: '#F56C6C', type: 'danger' },
  PENDING: { value: 'pending', label: '未检测', color: '#909399', type: 'info' },
} as const

export const AI_RISK_TYPE = {
  SENSITIVE_WORD: { value: 'sensitive_word', label: '敏感词', severity: 'high', defaultPoints: 20 },
  INAPPROPRIATE_IMAGE: { value: 'inappropriate_image', label: '违规配图', severity: 'high', defaultPoints: 25 },
  FAKE_INFO: { value: 'fake_info', label: '虚假信息', severity: 'high', defaultPoints: 25 },
  EXAGGERATED: { value: 'exaggerated', label: '夸大宣传', severity: 'medium', defaultPoints: 12 },
  AD_PROMOTION: { value: 'ad_promotion', label: '违规广告', severity: 'medium', defaultPoints: 15 },
  COPYRIGHT: { value: 'copyright', label: '版权嫌疑', severity: 'medium', defaultPoints: 15 },
  POOR_QUALITY: { value: 'poor_quality', label: '低质内容', severity: 'low', defaultPoints: 8 },
  TYPO: { value: 'typo', label: '错别字', severity: 'low', defaultPoints: 5 },
  PLAGIARISM: { value: 'plagiarism', label: '疑似抄袭', severity: 'high', defaultPoints: 20 },
} as const

export const ARTICLE_RISK_TAG = {
  SENSITIVE: { value: 'sensitive', label: '敏感', color: '#F56C6C' },
  VIOLATION: { value: 'violation', label: '违规', color: '#C0392B' },
  FAKE: { value: 'fake', label: '虚假', color: '#E6A23C' },
  LOW_QUALITY: { value: 'low_quality', label: '低质', color: '#909399' },
  AD: { value: 'ad', label: '广告', color: '#409EFF' },
  COPYRIGHT: { value: 'copyright', label: '版权', color: '#722ed1' },
  PLAGIARISM: { value: 'plagiarism', label: '抄袭', color: '#F56C6C' },
  IMAGE: { value: 'image', label: '配图', color: '#13c2c2' },
} as const

export const ARTICLE_AUDIT_EXCEPTION = {
  DUPLICATE_AUDIT: { value: 'duplicate_audit', label: '重复审核', color: '#E6A23C' },
  CONTENT_MODIFIED: { value: 'content_modified', label: '内容被篡改', color: '#F56C6C' },
  RESULT_MISMATCH: { value: 'result_mismatch', label: '结果与风险不匹配', color: '#722ed1' },
  OVERDUE: { value: 'overdue', label: '审核超时', color: '#409EFF' },
  MISSED_RISK: { value: 'missed_risk', label: '风险漏判', color: '#C0392B' },
} as const

export const BATCH_ARTICLE_ACTION = {
  APPROVE_LOW_RISK: { value: 'approve_low_risk', label: '批量通过低风险', icon: 'CircleCheck', type: 'success' },
  MARK_OVERDUE: { value: 'mark_overdue', label: '批量标记超时', icon: 'AlarmClock', type: 'warning' },
  REVIEW_SUSPECTED: { value: 'review_suspected', label: '批量复核疑似违规', icon: 'RefreshRight', type: 'primary' },
  EXPORT_LEDGER: { value: 'export_ledger', label: '导出审核台账', icon: 'Download', type: 'info' },
} as const

export const COMMENT_AUDIT_STATUS = {
  PENDING_AUDIT: { value: 0, label: '待审核', color: '#E6A23C', type: 'warning' },
  NORMAL: { value: 1, label: '正常展示', color: '#67C23A', type: 'success' },
  HIDDEN: { value: 2, label: '已屏蔽', color: '#909399', type: 'info' },
  DELETED: { value: 3, label: '违规删除', color: '#F56C6C', type: 'danger' },
  LOCKED: { value: 4, label: '高危锁定', color: '#C0392B', type: 'danger' },
} as const

export const COMMENT_VIOLATION_TYPE = {
  SPAM_AD: { value: 'spam_ad', label: '垃圾广告', level: 2, defaultMuteDays: 1 },
  ABUSE_INSULT: { value: 'abuse_insult', label: '辱骂攻击', level: 2, defaultMuteDays: 3 },
  PORN_VULGAR: { value: 'porn_vulgar', label: '色情低俗', level: 3, defaultMuteDays: 7 },
  POLITICS_SENSITIVE: { value: 'politics_sensitive', label: '政治敏感', level: 3, defaultMuteDays: 30 },
  VIOLENCE_THREAT: { value: 'violence_threat', label: '暴力恐吓', level: 3, defaultMuteDays: 15 },
  FAKE_INFO: { value: 'fake_info', label: '虚假不实', level: 2, defaultMuteDays: 3 },
  PIRACY: { value: 'piracy', label: '侵权盗版', level: 2, defaultMuteDays: 3 },
  DISCRIMINATION: { value: 'discrimination', label: '歧视仇恨', level: 3, defaultMuteDays: 15 },
  MINOR_HARMFUL: { value: 'minor_harmful', label: '未成年人不良', level: 3, defaultMuteDays: 30 },
  MALICIOUS_BRUSH: { value: 'malicious_brush', label: '恶意刷评', level: 2, defaultMuteDays: 7 },
  PERSONAL_PRIVACY: { value: 'personal_privacy', label: '泄露隐私', level: 3, defaultMuteDays: 15 },
  OTHER: { value: 'other', label: '其他违规', level: 1, defaultMuteDays: 0 },
} as const

export const COMMENT_AUDIT_ACTION = {
  APPROVE: { value: 'approve', label: '放行', icon: 'CircleCheck', type: 'success', nextStatus: 1 },
  HIDE: { value: 'hide', label: '屏蔽', icon: 'Hide', type: 'warning', nextStatus: 2 },
  DELETE: { value: 'delete', label: '删除', icon: 'Delete', type: 'danger', nextStatus: 3 },
  MUTE: { value: 'mute', label: '禁言用户', icon: 'Mute', type: 'danger', nextStatus: 3 },
} as const

export const USER_MUTE_LEVEL = {
  MUTE_1D: { value: 1, label: '禁言1天', days: 1 },
  MUTE_7D: { value: 2, label: '禁言7天', days: 7 },
  MUTE_30D: { value: 3, label: '禁言30天', days: 30 },
  MUTE_FOREVER: { value: 9, label: '永久禁言', days: -1 },
} as const

export const COMMENT_AUDIT_SOURCE = {
  NEW_PUBLISHED: { value: 'new_published', label: '新发布未审', color: '#409EFF' },
  USER_REPORTED: { value: 'user_reported', label: '用户举报', color: '#E6A23C' },
  HISTORY_VIOLATION: { value: 'history_violation', label: '历史违规复查', color: '#722ed1' },
  HIGH_RISK_AUTO: { value: 'high_risk_auto', label: 'AI高危自动锁定', color: '#C0392B' },
} as const

export const BATCH_COMMENT_ACTION = {
  CLEAN_HISTORY: { value: 'clean_history', label: '批量清理历史违规', icon: 'Delete', type: 'danger' },
  APPROVE_COMPLIANT: { value: 'approve_compliant', label: '批量放行合规待审', icon: 'CircleCheck', type: 'success' },
  MARK_SUSPECTED: { value: 'mark_suspected', label: '批量标记疑似风险', icon: 'Warning', type: 'warning' },
} as const

export const USER_PUNISHMENT_THRESHOLD = {
  MUTE_TRIGGER: 3,
  LIMIT_FLOW_TRIGGER: 5,
  BAN_TRIGGER: 10,
} as const

export const AUDIT_RULE_TYPE = {
  CONTENT_AUDIT: { value: 'content_audit', label: '内容审核规则', icon: 'Film', color: '#409EFF' },
  ARTICLE_AUDIT: { value: 'article_audit', label: '图文审核规则', icon: 'Document', color: '#67C23A' },
  COMMENT_AUDIT: { value: 'comment_audit', label: '评论审核规则', icon: 'ChatDotRound', color: '#E6A23C' },
  RISK_ASSESS: { value: 'risk_assess', label: '风险评估规则', icon: 'Warning', color: '#F56C6C' },
  ASSIGN_RULE: { value: 'assign_rule', label: '任务分配规则', icon: 'UserFilled', color: '#722ed1' },
  PUNISHMENT: { value: 'punishment', label: '处罚规则', icon: 'Lock', color: '#C0392B' },
  AI_SCREEN: { value: 'ai_screen', label: 'AI初筛规则', icon: 'MagicStick', color: '#13c2c2' },
} as const

export const AUDIT_RULE_STATUS = {
  DRAFT: { value: 0, label: '草稿', color: '#909399', type: 'info' },
  ENABLED: { value: 1, label: '已启用', color: '#67C23A', type: 'success' },
  DISABLED: { value: 2, label: '已停用', color: '#909399', type: 'info' },
  EXPIRED: { value: 3, label: '已过期', color: '#F56C6C', type: 'danger' },
  PENDING_REVIEW: { value: 4, label: '待审核', color: '#E6A23C', type: 'warning' },
} as const

export const AUDIT_RULE_CATEGORY = {
  AUTO_AUDIT: { value: 'auto_audit', label: '自动审核', description: '系统自动判定规则' },
  MANUAL_AID: { value: 'manual_aid', label: '人工辅助', description: '辅助人工审核' },
  WORKFLOW: { value: 'workflow', label: '工作流', description: '审核流程控制' },
  PUNISH_POLICY: { value: 'punish_policy', label: '处罚策略', description: '违规处罚配置' },
  QUALITY_CONTROL: { value: 'quality_control', label: '质检规则', description: '审核质量控制' },
} as const

export const AUDIT_RULE_TRIGGER_CONDITION = {
  CONTENT_CATEGORY: { value: 'content_category', label: '内容品类', fieldType: 'select', options: 'CONTENT_CATEGORY' },
  DURATION_RANGE: { value: 'duration_range', label: '时长范围', fieldType: 'number_range', unit: '分钟' },
  RISK_LEVEL: { value: 'risk_level', label: '风险等级', fieldType: 'select', options: 'RISK_LEVEL' },
  TIME_PERIOD: { value: 'time_period', label: '生效时段', fieldType: 'time_range' },
  SENSITIVE_WORD_COUNT: { value: 'sensitive_word_count', label: '敏感词数量', fieldType: 'number' },
  USER_LEVEL: { value: 'user_level', label: '用户等级', fieldType: 'select', options: 'CREATOR_LEVEL' },
  VIOLATION_COUNT: { value: 'violation_count', label: '违规次数', fieldType: 'number' },
  WORD_COUNT: { value: 'word_count', label: '字数范围', fieldType: 'number_range', unit: '字' },
  IMAGE_COUNT: { value: 'image_count', label: '图片数量', fieldType: 'number' },
  PUBLISH_SOURCE: { value: 'publish_source', label: '发布来源', fieldType: 'select', options: 'CONTENT_SOURCE' },
} as const

export const AUDIT_RULE_ACTION = {
  AUTO_PASS: { value: 'auto_pass', label: '自动通过', color: '#67C23A' },
  AUTO_REJECT: { value: 'auto_reject', label: '自动驳回', color: '#F56C6C' },
  AUTO_REVIEW: { value: 'auto_review', label: '自动复审', color: '#E6A23C' },
  SET_PRIORITY: { value: 'set_priority', label: '设置优先级', color: '#409EFF' },
  ASSIGN_REVIEWER: { value: 'assign_reviewer', label: '指定审核员', color: '#722ed1' },
  ADD_TAGS: { value: 'add_tags', label: '添加标签', color: '#13c2c2' },
  TRIGGER_MUTE: { value: 'trigger_mute', label: '触发禁言', color: '#C0392B' },
  LOCK_CONTENT: { value: 'lock_content', label: '锁定内容', color: '#F56C6C' },
} as const

export const BATCH_RULE_ACTION = {
  BATCH_ENABLE: { value: 'batch_enable', label: '批量启用', icon: 'CircleCheck', type: 'success' },
  BATCH_DISABLE: { value: 'batch_disable', label: '批量停用', icon: 'SwitchButton', type: 'warning' },
  BATCH_SYNC: { value: 'batch_sync', label: '批量同步全品类', icon: 'Refresh', type: 'primary' },
  BATCH_DELETE: { value: 'batch_delete', label: '批量删除', icon: 'Delete', type: 'danger' },
  BATCH_EXPORT: { value: 'batch_export', label: '批量导出', icon: 'Download', type: 'info' },
} as const

export const RULE_MODIFY_TYPE = {
  CREATE: { value: 'create', label: '创建', color: '#67C23A' },
  EDIT: { value: 'edit', label: '参数修改', color: '#409EFF' },
  ENABLE: { value: 'enable', label: '启用', color: '#67C23A' },
  DISABLE: { value: 'disable', label: '停用', color: '#909399' },
  RESET_EFFECT: { value: 'reset_effect', label: '重置生效时间', color: '#E6A23C' },
  CONFLICT_RESOLVE: { value: 'conflict_resolve', label: '冲突解决', color: '#F56C6C' },
  BATCH_SYNC: { value: 'batch_sync', label: '批量同步', color: '#722ed1' },
} as const

export const COPYRIGHT_QUALIFICATION_TYPE = {
  CERTIFICATE: { value: 'certificate', label: '版权证书', required: true, color: '#409EFF' },
  AGREEMENT: { value: 'agreement', label: '授权协议', required: true, color: '#67C23A' },
  OWNERSHIP: { value: 'ownership', label: '权属证明', required: true, color: '#E6A23C' },
} as const

export const COPYRIGHT_CONTENT_TYPE = {
  MOVIE: { value: 1, label: '电影', validityUnit: 'year', defaultValidity: 5, scopeOptions: ['公映权', '信息网络传播权', '广播权'] },
  TV_SERIES: { value: 2, label: '电视剧', validityUnit: 'year', defaultValidity: 5, scopeOptions: ['信息网络传播权', '广播权', '二轮播出权'] },
  VARIETY: { value: 3, label: '综艺', validityUnit: 'year', defaultValidity: 3, scopeOptions: ['信息网络传播权', '独家网络首播权', '非独家使用权'] },
  ANIME: { value: 4, label: '动漫', validityUnit: 'year', defaultValidity: 5, scopeOptions: ['信息网络传播权', '改编权', '翻译权'] },
  DOCUMENTARY: { value: 5, label: '纪录片', validityUnit: 'year', defaultValidity: 10, scopeOptions: ['信息网络传播权', '教育用途授权', '公益展播权'] },
  SHORT_VIDEO: { value: 6, label: '短视频', validityUnit: 'month', defaultValidity: 12, scopeOptions: ['信息网络传播权', '二创授权', '商业化授权'] },
  ARTICLE: { value: 7, label: '图文', validityUnit: 'year', defaultValidity: 3, scopeOptions: ['信息网络传播权', '汇编权', '转载授权'] },
  MUSIC: { value: 8, label: '音乐', validityUnit: 'year', defaultValidity: 5, scopeOptions: ['信息网络传播权', '表演权', '录音制作者权'] },
} as const

export const COPYRIGHT_BIND_STATUS = {
  UNBOUND: { value: 0, label: '未绑定内容', color: '#909399', type: 'info' },
  BOUND_DRAFT: { value: 1, label: '已绑定(待上架)', color: '#409EFF', type: 'primary' },
  BOUND_PUBLISHED: { value: 2, label: '已绑定(已上架)', color: '#67C23A', type: 'success' },
  BOUND_OFFLINE: { value: 3, label: '已绑定(已下架)', color: '#E6A23C', type: 'warning' },
} as const

export const COPYRIGHT_OWNERSHIP_STATUS = {
  CLEAR: { value: 1, label: '权属清晰', color: '#67C23A', type: 'success' },
  DISPUTED: { value: 2, label: '权属争议中', color: '#E6A23C', type: 'warning' },
  UNVERIFIED: { value: 3, label: '权属待核实', color: '#F56C6C', type: 'danger' },
  TRANSFERRED: { value: 4, label: '已转让', color: '#909399', type: 'info' },
} as const

export const COPYRIGHT_COMPLIANCE_STATUS = {
  COMPLIANT: { value: 1, label: '合规', color: '#67C23A', type: 'success' },
  WARNING: { value: 2, label: '合规预警', color: '#E6A23C', type: 'warning' },
  EXPIRED: { value: 3, label: '已过期', color: '#F56C6C', type: 'danger' },
  INCOMPLETE: { value: 4, label: '资料不完整', color: '#909399', type: 'info' },
} as const

export const BATCH_COPYRIGHT_ACTION = {
  IMPORT: { value: 'import', label: '批量导入资质台账', icon: 'Upload', type: 'primary' },
  RENEW: { value: 'renew', label: '批量续期即将过期', icon: 'RefreshRight', type: 'success' },
  INVALID: { value: 'invalid', label: '批量标记失效版权', icon: 'CircleClose', type: 'danger' },
  EXPORT: { value: 'export', label: '批量导出版权台账', icon: 'Download', type: 'info' },
} as const

export const COPYRIGHT_FILE_VALIDITY = {
  VALID: { value: 'valid', label: '有效', color: '#67C23A' },
  EXPIRED: { value: 'expired', label: '已过期', color: '#F56C6C' },
  UNCLEAR: { value: 'unclear', label: '文件不清晰', color: '#E6A23C' },
  PENDING: { value: 'pending', label: '待核验', color: '#909399' },
} as const

export const VALIDITY_STATUS = {
  NORMAL: { value: 1, label: '正常', color: '#67C23A', type: 'success', bgClass: 'validity-normal' },
  WARNING: { value: 2, label: '即将过期', color: '#E6A23C', type: 'warning', bgClass: 'validity-warning' },
  EXPIRED: { value: 3, label: '已过期', color: '#F56C6C', type: 'danger', bgClass: 'validity-expired' },
} as const

export const EXPIRE_HANDLER_RULE = {
  NOTIFY_ONLY: { value: 1, label: '仅发送预警通知', desc: '到期前发送运营预警，不执行自动下架' },
  AUTO_OFFLINE: { value: 2, label: '自动下架关联内容', desc: '到期后自动下架全部关联内容，停止流量分发' },
  AUTO_OFFLINE_ARCHIVE: { value: 3, label: '下架并归档台账', desc: '下架内容后，将版权记录移入历史台账' },
  REVIEW_BEFORE_OFFLINE: { value: 4, label: '人工复核后下架', desc: '到期后发送待办任务，人工确认后执行下架' },
} as const

export const RELATED_CONTENT_SCOPE = {
  PUBLISHED_ONLY: { value: 1, label: '仅已上架内容', countKey: 'publishedCount' },
  ALL_BOUND: { value: 2, label: '全部已绑定内容', countKey: 'totalBoundCount' },
  SPECIFIC_CATEGORY: { value: 3, label: '指定品类内容', countKey: 'categoryCount' },
} as const

export const WARNING_THRESHOLD_UNIT = {
  DAY: { value: 'day', label: '天', factor: 1 },
  WEEK: { value: 'week', label: '周', factor: 7 },
  MONTH: { value: 'month', label: '个月', factor: 30 },
} as const

export const VALIDITY_CHANGE_SOURCE = {
  MANUAL: { value: 'manual', label: '手动变更', color: '#409EFF' },
  BATCH: { value: 'batch', label: '批量操作', color: '#722ed1' },
  SYSTEM_TRIGGER: { value: 'system', label: '系统自动触发', color: '#E6A23C' },
  RENEWAL: { value: 'renewal', label: '续期变更', color: '#67C23A' },
  TEST_ENV: { value: 'test', label: '测试环境演练', color: '#13c2c2' },
} as const

export const BATCH_VALIDITY_ACTION = {
  RENEW_WARNING: { value: 'renew_warning', label: '批量续期预警版权', type: 'success', confirm: true, riskLevel: 'low' },
  OFFLINE_EXPIRED: { value: 'offline_expired', label: '批量下架过期内容', type: 'warning', confirm: true, riskLevel: 'medium' },
  ARCHIVE_EXPIRED: { value: 'archive_expired', label: '批量归档过期台账', type: 'info', confirm: true, riskLevel: 'low' },
  TRIGGER_SCAN: { value: 'trigger_scan', label: '批量触发全量筛查', type: 'primary', confirm: false, riskLevel: 'low' },
} as const

export const ENVIRONMENT_MODE = {
  TEST: { value: 'test', label: '测试环境', tip: '仅模拟执行，不落库不影响线上数据', color: '#13c2c2', badgeType: 'info' },
  PRODUCTION: { value: 'prod', label: '正式环境', tip: '真实执行，下架/归档等操作不可逆', color: '#F56C6C', badgeType: 'danger' },
} as const

export const WARNING_PUSH_CHANNEL = {
  MESSAGE_CENTER: { value: 'message_center', label: '系统消息', icon: 'Bell' },
  EMAIL: { value: 'email', label: '邮件', icon: 'Message' },
  SMS: { value: 'sms', label: '短信', icon: 'Iphone' },
  DING_TALK: { value: 'dingtalk', label: '钉钉群', icon: 'ChatDotRound' },
  FEISHU: { value: 'feishu', label: '飞书群', icon: 'Promotion' },
} as const

export const VALIDITY_TRACE_EVENT = {
  CONFIG_CREATE: { value: 'config_create', label: '有效期配置创建', color: '#409EFF' },
  CONFIG_UPDATE: { value: 'config_update', label: '有效期配置更新', color: '#409EFF' },
  THRESHOLD_TRIGGER: { value: 'threshold_trigger', label: '阈值触发预警', color: '#E6A23C' },
  WARNING_PUSHED: { value: 'warning_pushed', label: '预警推送完成', color: '#E6A23C' },
  STATUS_CHANGE: { value: 'status_change', label: '状态变更执行', color: '#F56C6C' },
  CONTENT_OFFLINE: { value: 'content_offline', label: '内容下架', color: '#F56C6C' },
  ARCHIVE_COMPLETE: { value: 'archive_complete', label: '台账归档', color: '#909399' },
  RENEWAL_COMPLETE: { value: 'renewal_complete', label: '续期完成', color: '#67C23A' },
  SYNC_TO_AUDIT: { value: 'sync_audit', label: '同步至内容审核', color: '#722ed1' },
  SYNC_TO_RISK: { value: 'sync_risk', label: '同步至风控模块', color: '#722ed1' },
  EXCEPTION_DETECTED: { value: 'exception', label: '异常检测', color: '#C0392B' },
} as const

export const TRACE_EXCEPTION_TYPE = {
  INVALID_RENEWAL: { value: 'invalid_renewal', label: '无效续期拦截', severity: 'high', desc: '续期参数无效或版权未处于可续期状态' },
  DUPLICATE_WARNING: { value: 'duplicate_warning', label: '重复预警配置', severity: 'medium', desc: '同一批次同一版权触发多次预警' },
  MISSED_OFFLINE: { value: 'missed_offline', label: '过期内容漏下架', severity: 'high', desc: '内容应下架但状态仍为上架' },
  MISSED_WARNING: { value: 'missed_warning', label: '预警漏推送', severity: 'medium', desc: '到达阈值未发送预警消息' },
  SYNC_DELAY: { value: 'sync_delay', label: '状态同步不及时', severity: 'low', desc: '审核/风控模块状态滞后超过阈值' },
  RULE_INCOMPLETE: { value: 'rule_incomplete', label: '处理规则执行不完整', severity: 'high', desc: '部分关联内容未按规则处理' },
} as const

export const VALIDITY_BATCH_STATUS = {
  PENDING: { value: 'pending', label: '待执行', color: '#909399', type: 'info' },
  RUNNING: { value: 'running', label: '执行中', color: '#409EFF', type: 'primary' },
  COMPLETED: { value: 'completed', label: '执行完成', color: '#67C23A', type: 'success' },
  PARTIAL: { value: 'partial', label: '部分成功', color: '#E6A23C', type: 'warning' },
  FAILED: { value: 'failed', label: '执行失败', color: '#F56C6C', type: 'danger' },
  CANCELLED: { value: 'cancelled', label: '已取消', color: '#C0C4CC', type: 'info' },
} as const

export const END_USER_ACCOUNT_STATUS = {
  NORMAL: { value: 1, label: '正常', color: '#67C23A', type: 'success' },
  FLOW_LIMITED: { value: 2, label: '限流', color: '#E6A23C', type: 'warning' },
  MUTED: { value: 3, label: '禁言', color: '#F56C6C', type: 'danger' },
  TEMP_BANNED: { value: 4, label: '临时封禁', color: '#F56C6C', type: 'danger' },
  PERMANENT_BANNED: { value: 5, label: '永久封禁', color: '#C0392B', type: 'danger' },
} as const

export const END_USER_TYPE = {
  NORMAL: { value: 1, label: '普通用户', color: '#909399', type: 'info' },
  CREATOR: { value: 2, label: '创作者', color: '#409EFF', type: 'primary' },
  MEMBER: { value: 3, label: '会员用户', color: '#E6A23C', type: 'warning' },
} as const

export const END_USER_ACTIVITY_LEVEL = {
  DORMANT: { value: 0, label: '沉睡用户', color: '#C0C4CC', type: 'info' },
  LOW: { value: 1, label: '低活跃', color: '#909399', type: 'info' },
  MEDIUM: { value: 2, label: '中活跃', color: '#409EFF', type: 'primary' },
  HIGH: { value: 3, label: '高活跃', color: '#67C23A', type: 'success' },
  ACTIVE: { value: 4, label: '核心活跃', color: '#722ed1', type: 'primary' },
} as const

export const END_USER_FLOW_LIMIT_LEVEL = {
  NONE: { value: 0, label: '无限流', color: '#67C23A', type: 'success' },
  LIGHT: { value: 1, label: '轻度限流', color: '#E6A23C', type: 'warning' },
  MEDIUM: { value: 2, label: '中度限流', color: '#F56C6C', type: 'danger' },
  SEVERE: { value: 3, label: '重度限流', color: '#C0392B', type: 'danger' },
} as const

export const END_USER_GENDER = {
  UNKNOWN: { value: 0, label: '保密' },
  MALE: { value: 1, label: '男', color: '#409EFF' },
  FEMALE: { value: 2, label: '女', color: '#EB2F96' },
} as const

export const OPERATION_TYPE_USER = {
  MANUAL: { value: 'MANUAL', label: '手动操作', color: '#409EFF' },
  BATCH: { value: 'BATCH', label: '批量操作', color: '#722ed1' },
  SYSTEM: { value: 'SYSTEM', label: '系统触发', color: '#E6A23C' },
} as const

export const BATCH_END_USER_ACTION = {
  UNBAN_LOW_VIOLATION: { value: 'UNBAN_LOW_VIOLATION', label: '批量解封低违规', icon: 'Unlock', type: 'success', desc: '仅解封违规次数≤1的封禁账号' },
  FLOW_LIMIT_LOW_QUALITY: { value: 'FLOW_LIMIT_LOW_QUALITY', label: '批量限流低质创作者', icon: 'TrendCharts', type: 'warning', desc: '对初级及以下创作者执行限流' },
  ACTIVATE_DORMANT: { value: 'ACTIVATE_DORMANT', label: '批量激活沉睡用户', icon: 'RefreshRight', type: 'primary', desc: '将沉睡用户提升为低活跃等级' },
  BATCH_UNBAN: { value: 'BATCH_UNBAN', label: '批量解封账号', icon: 'Unlock', type: 'success', desc: '解除所有选中封禁账号的限制' },
  BATCH_FLOW_LIMIT: { value: 'BATCH_FLOW_LIMIT', label: '批量限流', icon: 'TrendCharts', type: 'warning', desc: '对所有正常状态账号执行限流' },
  BATCH_TEMP_BAN: { value: 'BATCH_TEMP_BAN', label: '批量临时封禁', icon: 'Warning', type: 'danger', desc: '对正常/限流状态账号临时封禁' },
} as const

export const STATUS_CHANGE_PERMISSION = {
  NORMAL: { canWatch: true, canComment: true, canPublish: true, canDistribute: true },
  FLOW_LIMITED: { canWatch: true, canComment: true, canPublish: true, canDistribute: false },
  MUTED: { canWatch: true, canComment: false, canPublish: true, canDistribute: true },
  TEMP_BANNED: { canWatch: false, canComment: false, canPublish: false, canDistribute: false },
  PERMANENT_BANNED: { canWatch: false, canComment: false, canPublish: false, canDistribute: false },
} as const

export const PERMISSION_LABEL: Record<string, string> = {
  canWatch: '观看权限',
  canComment: '评论权限',
  canPublish: '投稿权限',
  canDistribute: '内容分发',
}




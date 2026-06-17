const CONTENT_AUDIT_STATUS = {
  PENDING: { value: 0, label: '待审核', color: '#E6A23C' },
  REVIEWING: { value: 1, label: '审核中', color: '#409EFF' },
  APPROVED: { value: 2, label: '审核通过', color: '#67C23A' },
  REJECTED: { value: 3, label: '审核驳回', color: '#F56C6C' },
  OFFLINE: { value: 4, label: '已下架', color: '#909399' },
};

const getAuditStatusLabel = (value) => {
  const status = Object.values(CONTENT_AUDIT_STATUS).find(s => s.value === value);
  return status ? status.label : '未知';
};

const COPYRIGHT_TYPE = {
  EXCLUSIVE: { value: 1, label: '独家版权', color: '#409EFF' },
  NON_EXCLUSIVE: { value: 2, label: '非独家版权', color: '#67C23A' },
  AGENCY: { value: 3, label: '代理版权', color: '#E6A23C' },
  PUBLIC: { value: 4, label: '公共版权', color: '#909399' },
};

const MEMBER_LEVEL = {
  NORMAL: { value: 0, label: '普通用户', color: '#909399' },
  VIP: { value: 1, label: 'VIP会员', color: '#E6A23C' },
  SVIP: { value: 2, label: 'SVIP会员', color: '#F56C6C' },
  YEAR_VIP: { value: 3, label: '年度VIP', color: '#409EFF' },
  LIFETIME: { value: 4, label: '终身会员', color: '#67C23A' },
};

const CONTENT_CATEGORY = {
  MOVIE: { value: 1, label: '电影' },
  TV_SERIES: { value: 2, label: '电视剧' },
  VARIETY: { value: 3, label: '综艺' },
  ANIME: { value: 4, label: '动漫' },
  DOCUMENTARY: { value: 5, label: '纪录片' },
  SHORT_VIDEO: { value: 6, label: '短视频' },
  LIVE: { value: 7, label: '直播' },
};

const AD_STATUS = {
  DRAFT: { value: 0, label: '草稿', color: '#909399' },
  PENDING: { value: 1, label: '待投放', color: '#E6A23C' },
  RUNNING: { value: 2, label: '投放中', color: '#67C23A' },
  PAUSED: { value: 3, label: '已暂停', color: '#F56C6C' },
  ENDED: { value: 4, label: '已结束', color: '#409EFF' },
};

const AD_TYPE = {
  BANNER: { value: 1, label: '首页Banner' },
  SPLASH: { value: 2, label: '开屏广告' },
  INTERSTITIAL: { value: 3, label: '插屏广告' },
  NATIVE: { value: 4, label: '信息流广告' },
  REWARD: { value: 5, label: '激励视频' },
};

const ACTIVITY_STATUS = {
  DRAFT: { value: 0, label: '草稿', color: '#909399' },
  PUBLISHED: { value: 1, label: '已发布', color: '#67C23A' },
  ONGOING: { value: 2, label: '进行中', color: '#409EFF' },
  ENDED: { value: 3, label: '已结束', color: '#E6A23C' },
  CANCELLED: { value: 4, label: '已取消', color: '#F56C6C' },
};

const ACTIVITY_TYPE = {
  DISCOUNT: { value: 1, label: '优惠活动' },
  LUCKY_DRAW: { value: 2, label: '抽奖活动' },
  SIGN_IN: { value: 3, label: '签到活动' },
  SEASONAL: { value: 4, label: '节日活动' },
  MEMBER_PROMOTION: { value: 5, label: '会员促销' },
};

const USER_STATUS = {
  ACTIVE: { value: 1, label: '正常', color: '#67C23A' },
  DISABLED: { value: 0, label: '禁用', color: '#F56C6C' },
  LOCKED: { value: 2, label: '锁定', color: '#E6A23C' },
};

const ROLE_CODE = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  CONTENT_AUDITOR: 'CONTENT_AUDITOR',
  COPYRIGHT_MANAGER: 'COPYRIGHT_MANAGER',
  AD_MANAGER: 'AD_MANAGER',
  ACTIVITY_MANAGER: 'ACTIVITY_MANAGER',
  VIEWER: 'VIEWER',
};

const DATE_FORMAT = {
  FULL: 'YYYY-MM-DD HH:mm:ss',
  DATE: 'YYYY-MM-DD',
  TIME: 'HH:mm:ss',
  MONTH: 'YYYY-MM',
};

const getEnumOptions = (enumObj) => {
  return Object.values(enumObj).map((item) => ({
    label: item.label,
    value: item.value,
    ...item,
  }));
};

const getEnumByValue = (enumObj, value) => {
  return Object.values(enumObj).find((item) => item.value === value) || null;
};

const COMMENT_STATUS = {
  PENDING: { value: 0, label: '待审核', color: '#E6A23C' },
  NORMAL: { value: 1, label: '正常', color: '#67C23A' },
  HIDDEN: { value: 2, label: '已隐藏', color: '#909399' },
  DELETED: { value: 3, label: '违规删除', color: '#F56C6C' },
};

const MEMBER_STATUS = {
  EXPIRED: { value: 0, label: '已过期', color: '#909399' },
  ACTIVE: { value: 1, label: '正常', color: '#67C23A' },
  FROZEN: { value: 2, label: '已冻结', color: '#F56C6C' },
  PENDING: { value: 3, label: '待激活', color: '#E6A23C' },
};

const MESSAGE_TYPE = {
  SYSTEM: { value: 1, label: '系统通知' },
  AUDIT: { value: 2, label: '审核通知' },
  COPYRIGHT_WARNING: { value: 3, label: '版权预警' },
  ACTIVITY: { value: 4, label: '活动通知' },
  COMMENT_REPLY: { value: 5, label: '评论回复' },
  MEMBER: { value: 6, label: '会员通知' },
  AD: { value: 7, label: '广告通知' },
};

const OPERATION_TYPE = {
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
};

const VIOLATION_LEVEL = {
  NONE: { value: 0, label: '无违规', color: '#67C23A' },
  LOW: { value: 1, label: '低风险', color: '#E6A23C' },
  MEDIUM: { value: 2, label: '中风险', color: '#F56C6C' },
  HIGH: { value: 3, label: '高风险', color: '#F56C6C' },
};

const MESSAGE_PRIORITY = {
  NORMAL: { value: 0, label: '普通' },
  IMPORTANT: { value: 1, label: '重要' },
  URGENT: { value: 2, label: '紧急' },
};

const OPERATION_MODULE = {
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
};

const ARTICLE_TYPE = {
  NEWS: { value: 0, label: '普通资讯', color: '#409EFF' },
  TOPIC: { value: 1, label: '专题文章', color: '#67C23A' },
  COLUMN: { value: 2, label: '专栏', color: '#E6A23C' },
  INTERVIEW: { value: 3, label: '人物访谈', color: '#909399' },
  ANALYSIS: { value: 4, label: '行业分析', color: '#F56C6C' },
};

const DOMAIN_CATEGORY = {
  TECH: { value: 'tech', label: '科技', color: '#409EFF' },
  ENTERTAINMENT: { value: 'entertainment', label: '娱乐', color: '#E6A23C' },
  SPORTS: { value: 'sports', label: '体育', color: '#67C23A' },
  FINANCE: { value: 'finance', label: '财经', color: '#F56C6C' },
  LIFESTYLE: { value: 'lifestyle', label: '生活', color: '#909399' },
  EDUCATION: { value: 'education', label: '教育', color: '#67C23A' },
};

const PUBLISH_CHANNEL = {
  HOME: { value: 1, label: '首页', color: '#409EFF' },
  NEWS: { value: 2, label: '资讯页', color: '#67C23A' },
  TOPIC: { value: 3, label: '专题页', color: '#E6A23C' },
  MULTI: { value: 4, label: '多渠道', color: '#F56C6C' },
};

const PUBLISH_PERMISSION = {
  PUBLIC: { value: 0, label: '公开', color: '#67C23A' },
  LOGIN: { value: 1, label: '登录可见', color: '#409EFF' },
  MEMBER: { value: 2, label: '会员可见', color: '#E6A23C' },
  PAID: { value: 3, label: '付费可见', color: '#F56C6C' },
};

const LAYOUT_TEMPLATE = {
  DEFAULT: { value: 'default', label: '默认模板', desc: '标准三栏布局' },
  FULL_WIDTH: { value: 'full-width', label: '通栏模板', desc: '全宽沉浸式阅读' },
  MAGAZINE: { value: 'magazine', label: '杂志模板', desc: '图文并茂杂志风' },
  ELEGANT: { value: 'elegant', label: '雅致模板', desc: '简约文艺排版' },
  TECH_STYLE: { value: 'tech-style', label: '科技模板', desc: '深色科技风格' },
};

const ARTICLE_QUALITY = {
  LOW: { value: 0, label: '低质', color: '#F56C6C' },
  NORMAL: { value: 1, label: '普通', color: '#909399' },
  GOOD: { value: 2, label: '优质', color: '#67C23A' },
  EXCELLENT: { value: 3, label: '精品', color: '#409EFF' },
};

const EDIT_MODE = {
  FULL: { value: 0, label: '全覆盖修改' },
  INCREMENTAL: { value: 1, label: '增量修改' },
};

const TOPIC_TYPE = {
  FESTIVAL: { value: 0, label: '节日专题', color: '#F56C6C' },
  HOT: { value: 1, label: '热点专题', color: '#E6A23C' },
  CATEGORY: { value: 2, label: '品类专题', color: '#409EFF' },
  PEOPLE: { value: 3, label: '人物专题', color: '#909399' },
  ACTIVITY: { value: 4, label: '活动专题', color: '#67C23A' },
};

const TOPIC_COVER_TEMPLATE = {
  FESTIVAL_DEFAULT: { value: 'festival-default', label: '节日默认模板', desc: '红金配色，节日氛围' },
  HOT_STYLE: { value: 'hot-style', label: '热点风格模板', desc: '醒目大标题，时效性强' },
  CATEGORY_BANNER: { value: 'category-banner', label: '品类横幅模板', desc: '分类导航，内容聚合' },
  PEOPLE_FEATURE: { value: 'people-feature', label: '人物特写模板', desc: '大图人物，故事叙述' },
  ACTIVITY_SPECIAL: { value: 'activity-special', label: '活动专属模板', desc: '互动感强，转化导向' },
};

const TOPIC_SORT_RULE = {
  MANUAL: { value: 0, label: '手动排序' },
  HOT: { value: 1, label: '热度优先' },
  TIME: { value: 2, label: '时间优先' },
  WEIGHT: { value: 3, label: '权重优先' },
  COMPOSITE: { value: 4, label: '综合评分' },
};

const TOPIC_STATUS = {
  DRAFT: { value: 0, label: '草稿', color: '#909399' },
  NOT_LAUNCHED: { value: 1, label: '未上线', color: '#409EFF' },
  ONLINE: { value: 2, label: '已上线', color: '#67C23A' },
  OFFLINE: { value: 3, label: '已下线', color: '#E6A23C' },
  EXPIRED: { value: 4, label: '已过期', color: '#F56C6C' },
};

const COVER_CATEGORY = {
  MOVIE: { value: 'movie', label: '电影' },
  TV: { value: 'tv', label: '剧集' },
  SHORT_VIDEO: { value: 'short_video', label: '短视频' },
  ARTICLE: { value: 'article', label: '图文' },
  ACTIVITY: { value: 'activity', label: '活动' },
};

module.exports = {
  CONTENT_AUDIT_STATUS,
  getAuditStatusLabel,
  COPYRIGHT_TYPE,
  MEMBER_LEVEL,
  CONTENT_CATEGORY,
  AD_STATUS,
  AD_TYPE,
  ACTIVITY_STATUS,
  ACTIVITY_TYPE,
  USER_STATUS,
  ROLE_CODE,
  DATE_FORMAT,
  getEnumOptions,
  getEnumByValue,
  COMMENT_STATUS,
  MEMBER_STATUS,
  MESSAGE_TYPE,
  OPERATION_TYPE,
  VIOLATION_LEVEL,
  MESSAGE_PRIORITY,
  OPERATION_MODULE,
  ARTICLE_TYPE,
  DOMAIN_CATEGORY,
  PUBLISH_CHANNEL,
  PUBLISH_PERMISSION,
  LAYOUT_TEMPLATE,
  ARTICLE_QUALITY,
  EDIT_MODE,
  TOPIC_TYPE,
  TOPIC_COVER_TEMPLATE,
  TOPIC_SORT_RULE,
  TOPIC_STATUS,
  COVER_CATEGORY,
};

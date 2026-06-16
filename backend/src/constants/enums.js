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
};

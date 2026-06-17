export * from './businessCode'

export const CHANNEL_TYPE_OPTIONS = [
  { label: '微信', value: 'wechat' },
  { label: '抖音', value: 'douyin' },
  { label: '快手', value: 'kuaishou' },
  { label: '小红书', value: 'xiaohongshu' },
  { label: '微博', value: 'weibo' },
  { label: '其他', value: 'other' },
] as const

export const PROMOTER_LEVEL_OPTIONS = [
  { label: 'L1 初级', value: 1 },
  { label: 'L2 中级', value: 2 },
  { label: 'L3 高级', value: 3 },
  { label: 'L4 金牌', value: 4 },
  { label: 'L5 钻石', value: 5 },
] as const

export const PROMOTER_LEVEL_MAP: Record<number, { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  1: { label: 'L1 初级', type: 'info' },
  2: { label: 'L2 中级', type: 'primary' },
  3: { label: 'L3 高级', type: 'success' },
  4: { label: 'L4 金牌', type: 'warning' },
  5: { label: 'L5 钻石', type: 'danger' },
}

export const PROMOTER_STATUS_OPTIONS = [
  { label: '正常', value: 1, type: 'success' },
  { label: '审核中', value: 2, type: 'primary' },
  { label: '冻结', value: 0, type: 'warning' },
  { label: '注销', value: -1, type: 'danger' },
  { label: '已拒绝', value: -2, type: 'danger' },
] as const

export const PROMOTER_STATUS_MAP: Record<number, { label: string; type: 'success' | 'warning' | 'danger' | 'info' | 'primary' }> = {
  1: { label: '正常', type: 'success' },
  2: { label: '审核中', type: 'primary' },
  0: { label: '冻结', type: 'warning' },
  '-1': { label: '注销', type: 'danger' },
  '-2': { label: '已拒绝', type: 'danger' },
}

export const ORDER_STATUS_OPTIONS = [
  { label: '待支付', value: 0, type: 'info' },
  { label: '已支付', value: 1, type: 'primary' },
  { label: '已发货', value: 2, type: 'warning' },
  { label: '已完成', value: 3, type: 'success' },
  { label: '已取消', value: 4, type: 'info' },
  { label: '退款中', value: 5, type: 'warning' },
  { label: '已退款', value: 6, type: 'danger' },
] as const

export const ORDER_STATUS_MAP: Record<number, { label: string; type: 'success' | 'danger' | 'warning' | 'info' | 'primary' }> = {
  0: { label: '待支付', type: 'info' },
  1: { label: '已支付', type: 'primary' },
  2: { label: '已发货', type: 'warning' },
  3: { label: '已完成', type: 'success' },
  4: { label: '已取消', type: 'info' },
  5: { label: '退款中', type: 'warning' },
  6: { label: '已退款', type: 'danger' },
}

export const COMMISSION_STATUS_OPTIONS = [
  { label: '待结算', value: 0, type: 'info' },
  { label: '结算中', value: 1, type: 'warning' },
  { label: '已结算', value: 2, type: 'success' },
  { label: '已提现', value: 3, type: 'primary' },
  { label: '已扣除', value: 4, type: 'danger' },
] as const

export const COMMISSION_STATUS_MAP: Record<number, { label: string; type: 'success' | 'danger' | 'warning' | 'info' | 'primary' }> = {
  0: { label: '待结算', type: 'info' },
  1: { label: '结算中', type: 'warning' },
  2: { label: '已结算', type: 'success' },
  3: { label: '已提现', type: 'primary' },
  4: { label: '已扣除', type: 'danger' },
}

export const MARKETING_TYPE_OPTIONS = [
  { label: '优惠券', value: 'coupon' },
  { label: '折扣', value: 'discount' },
  { label: '返现', value: 'cashback' },
  { label: '返利', value: 'rebate' },
  { label: '奖励金', value: 'bonus' },
] as const

export const MARKETING_TYPE_MAP: Record<string, { label: string }> = {
  coupon: { label: '优惠券' },
  discount: { label: '折扣' },
  cashback: { label: '返现' },
  rebate: { label: '返利' },
  bonus: { label: '奖励金' },
}

export const MARKETING_STATUS_OPTIONS = [
  { label: '草稿', value: 0, type: 'info' },
  { label: '进行中', value: 1, type: 'success' },
  { label: '已结束', value: 2, type: 'warning' },
  { label: '已取消', value: 3, type: 'danger' },
] as const

export const MARKETING_STATUS_MAP: Record<number, { label: string; type: 'success' | 'danger' | 'warning' | 'info' }> = {
  0: { label: '草稿', type: 'info' },
  1: { label: '进行中', type: 'success' },
  2: { label: '已结束', type: 'warning' },
  3: { label: '已取消', type: 'danger' },
}

export const WITHDRAW_STATUS_OPTIONS = [
  { label: '待审核', value: 0, type: 'warning' },
  { label: '审核通过', value: 1, type: 'primary' },
  { label: '审核拒绝', value: 2, type: 'danger' },
  { label: '打款中', value: 3, type: 'warning' },
  { label: '打款成功', value: 4, type: 'success' },
  { label: '打款失败', value: 5, type: 'danger' },
  { label: '已取消', value: 6, type: 'info' },
] as const

export const WITHDRAW_STATUS_MAP: Record<number, { label: string; type: 'success' | 'danger' | 'warning' | 'info' | 'primary' }> = {
  0: { label: '待审核', type: 'warning' },
  1: { label: '审核通过', type: 'primary' },
  2: { label: '审核拒绝', type: 'danger' },
  3: { label: '打款中', type: 'warning' },
  4: { label: '打款成功', type: 'success' },
  5: { label: '打款失败', type: 'danger' },
  6: { label: '已取消', type: 'info' },
}

export const WITHDRAW_METHOD_OPTIONS = [
  { label: '微信', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '银行卡', value: 'bank' },
] as const

export const WITHDRAW_METHOD_MAP: Record<string, { label: string }> = {
  wechat: { label: '微信' },
  alipay: { label: '支付宝' },
  bank: { label: '银行卡' },
}

export const PERMISSION_TYPE_OPTIONS = [
  { label: '目录', value: 'directory' },
  { label: '菜单', value: 'menu' },
  { label: '按钮', value: 'button' },
] as const

export const PERMISSION_TYPE_MAP: Record<string, { label: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  directory: { label: '目录', type: 'primary' },
  menu: { label: '菜单', type: 'success' },
  button: { label: '按钮', type: 'warning' },
}

export const STATUS_OPTIONS = [
  { label: '启用', value: 1, type: 'success' },
  { label: '禁用', value: 0, type: 'danger' },
] as const

export const STATUS_MAP: Record<number | string, { label: string; type: 'success' | 'danger' | 'warning' | 'info' }> = {
  1: { label: '启用', type: 'success' },
  0: { label: '禁用', type: 'danger' },
  enable: { label: '启用', type: 'success' },
  disable: { label: '禁用', type: 'danger' },
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const

export const DEFAULT_PAGE_SIZE = 20

export const POSITION_LEVEL_OPTIONS = [
  { label: '超级管理员', value: 1 },
  { label: '系统管理员', value: 3 },
  { label: '运营经理', value: 5 },
  { label: '运营操作员', value: 7 },
  { label: '只读用户', value: 9 },
]

export const POSITION_LEVEL_MAP: Record<number, { label: string; color: 'primary' | 'success' | 'warning' | 'danger' | 'info' }> = {
  1: { label: '超级管理员', color: 'danger' },
  3: { label: '系统管理员', color: 'warning' },
  5: { label: '运营经理', color: 'primary' },
  7: { label: '运营操作员', color: 'success' },
  9: { label: '只读用户', color: 'info' },
}

export const USER_ROLE_OPTIONS = [
  { label: '超级管理员', value: 'admin' },
  { label: '普通管理员', value: 'user' },
  { label: '访客', value: 'guest' },
]

export const USER_ROLE_MAP: Record<string, string> = {
  admin: '超级管理员',
  user: '普通管理员',
  guest: '访客',
}

export const ROLE_LEVEL_OPTIONS = [
  { label: '超级管理员', value: 1, color: 'danger' },
  { label: '系统管理员', value: 3, color: 'warning' },
  { label: '运营经理', value: 5, color: 'primary' },
  { label: '运营操作员', value: 7, color: 'success' },
  { label: '只读用户', value: 9, color: 'info' },
] as const

export const ROLE_LEVEL_MAP: Record<number, { label: string; color: string }> = {
  1: { label: '超级管理员', color: 'danger' },
  3: { label: '系统管理员', color: 'warning' },
  5: { label: '运营经理', color: 'primary' },
  7: { label: '运营操作员', color: 'success' },
  9: { label: '只读用户', color: 'info' },
}

export const ROLE_SCENARIO_OPTIONS = [
  { label: '渠道运营', value: 'channel_operation' },
  { label: '推客管理', value: 'promoter_management' },
  { label: '订单审核', value: 'order_audit' },
  { label: '财务结算', value: 'financial_settlement' },
  { label: '营销策划', value: 'marketing' },
  { label: '数据查看', value: 'data_view' },
  { label: '系统运维', value: 'system_ops' },
  { label: '全功能权限', value: 'full_access' },
] as const

export const ROLE_SCENARIO_MAP: Record<string, string> = {
  channel_operation: '渠道运营',
  promoter_management: '推客管理',
  order_audit: '订单审核',
  financial_settlement: '财务结算',
  marketing: '营销策划',
  data_view: '数据查看',
  system_ops: '系统运维',
  full_access: '全功能权限',
}

export const PERMISSION_MODULE_OPTIONS = [
  { label: '数据看板', value: 'dashboard' },
  { label: '系统管理', value: 'system' },
  { label: '渠道管理', value: 'channel' },
  { label: '推客管理', value: 'promoter' },
  { label: '订单管理', value: 'order' },
  { label: '佣金管理', value: 'commission' },
  { label: '营销管理', value: 'marketing' },
  { label: '提现管理', value: 'withdraw' },
  { label: '日志管理', value: 'log' },
]
export const PERMISSION_MODULE_MAP: Record<string, string> = {
  dashboard: '数据看板',
  system: '系统管理',
  channel: '渠道管理',
  promoter: '推客管理',
  order: '订单管理',
  commission: '佣金管理',
  marketing: '营销管理',
  withdraw: '提现管理',
  log: '日志管理',
}
export const PERMISSION_LEVEL_OPTIONS = [
  { label: '一级菜单', value: 1 },
  { label: '二级菜单', value: 2 },
  { label: '三级菜单', value: 3 },
]
export const VISIBLE_RANGE_OPTIONS = [
  { label: '全部角色可见', value: 'all' },
  { label: '超级管理员可见', value: 'admin' },
  { label: '运营团队可见', value: 'manager' },
  { label: '仅指定角色可见', value: 'custom' },
]

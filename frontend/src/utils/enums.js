export const OrderStatusEnum = {
  PENDING_PAYMENT: { value: 1, label: '待支付', type: 'warning', color: '#faad14' },
  PAID: { value: 2, label: '已支付', type: 'primary', color: '#1890ff' },
  COMPLETED: { value: 3, label: '已完成', type: 'success', color: '#52c41a' },
  CANCELLED: { value: 4, label: '已取消', type: 'info', color: '#909399' },
  REFUNDING: { value: 5, label: '退款中', type: 'warning', color: '#ff7a45' },
  REFUNDED: { value: 6, label: '已退款', type: 'danger', color: '#ff4d4f' }
}

export const OrderSourceEnum = {
  APP: { value: 'app', label: 'APP端' },
  WECHAT: { value: 'wechat', label: '微信端' },
  WEB: { value: 'web', label: 'PC端' },
  OFFLINE: { value: 'offline', label: '线下门店' },
  THIRD_PARTY: { value: 'third_party', label: '第三方渠道' }
}

export const OrderAbnormalEnum = {
  NORMAL: { value: 0, label: '正常', type: 'success' },
  ABNORMAL: { value: 1, label: '异常', type: 'warning' },
  INVALID: { value: 2, label: '作废', type: 'danger' }
}

export const OrderLockEnum = {
  UNLOCKED: { value: 0, label: '未锁定', type: 'info' },
  LOCKED: { value: 1, label: '已锁定', type: 'danger' }
}

export const OrderArchiveEnum = {
  UNARCHIVED: { value: 0, label: '未归档' },
  ARCHIVED: { value: 1, label: '已归档' }
}

export const TravelCategoryEnum = {
  FLIGHT: { value: 1, label: '机票' },
  HOTEL: { value: 2, label: '酒店' },
  CAR_RENTAL: { value: 3, label: '租车' },
  TOUR_TICKET: { value: 4, label: '文旅票务' }
}

export const AuditStatusEnum = {
  PENDING: { value: 1, label: '待审核', type: 'warning' },
  APPROVED: { value: 2, label: '已通过', type: 'success' },
  REJECTED: { value: 3, label: '已拒绝', type: 'danger' }
}

export const CommonStatusEnum = {
  ENABLED: { value: 1, label: '启用', type: 'success' },
  DISABLED: { value: 0, label: '禁用', type: 'info' }
}

export const BusinessTravelStatusEnum = {
  PENDING: { value: 0, label: '待确认', type: 'warning' },
  DESIGNING: { value: 1, label: '方案设计中', type: 'primary' },
  PENDING_APPROVAL: { value: 2, label: '待审批', type: 'warning' },
  CONFIRMED: { value: 3, label: '已确认', type: 'success' },
  CANCELLED: { value: 4, label: '已取消', type: 'info' },
  COMPLETED: { value: 5, label: '已完成', type: 'success' }
}

export const BusinessTravelTypeEnum = {
  BUSINESS: { value: 1, label: '商务出行' },
  TEAM_BUILDING: { value: 2, label: '团队建设' },
  CONFERENCE: { value: 3, label: '会议考察' }
}

export const CouponTypeEnum = {
  FULL_REDUCTION: { value: 1, label: '满减券' },
  DISCOUNT: { value: 2, label: '折扣券' },
  CASH: { value: 3, label: '立减券' }
}

export const CouponStatusEnum = {
  NOT_STARTED: { value: 0, label: '未开始', type: 'info' },
  ACTIVE: { value: 1, label: '进行中', type: 'success' },
  EXPIRED: { value: 2, label: '已结束', type: 'warning' },
  REVOKED: { value: 3, label: '已作废', type: 'danger' }
}

export const ApprovalStatusEnum = {
  PENDING: { value: 0, label: '待审批', type: 'warning' },
  APPROVED: { value: 1, label: '已通过', type: 'success' },
  REJECTED: { value: 2, label: '已拒绝', type: 'danger' }
}

export const ViolationLevelEnum = {
  NORMAL: { value: 0, label: '正常', type: 'success' },
  MINOR: { value: 1, label: '轻微', type: 'info' },
  MODERATE: { value: 2, label: '一般', type: 'warning' },
  SEVERE: { value: 3, label: '严重', type: 'danger' }
}

export const NotificationTypeEnum = {
  SYSTEM: { value: 'system', label: '系统通知' },
  ORDER: { value: 'order', label: '订单通知' },
  MERCHANT: { value: 'merchant', label: '商家通知' },
  APPROVAL: { value: 'approval', label: '审批通知' }
}

export const PaymentModeEnum = {
  INSTANT: { value: 'instant', label: '即时支付' },
  INSTALLMENT: { value: 'installment', label: '分期支付' },
  DIFFERENCE: { value: 'difference', label: '补差支付' }
}

export const PaymentChannelEnum = {
  WECHAT: { value: 'wechat', label: '微信支付', icon: 'ChatDotRound' },
  ALIPAY: { value: 'alipay', label: '支付宝', icon: 'Aim' },
  UNIONPAY: { value: 'unionpay', label: '银联支付', icon: 'CreditCard' },
  CREDIT_CARD: { value: 'credit_card', label: '信用卡', icon: 'Money' },
  BALANCE: { value: 'balance', label: '余额支付', icon: 'Wallet' }
}

export const PaymentFlowStatusEnum = {
  PENDING: { value: 0, label: '待支付', type: 'warning', color: '#faad14' },
  SUCCESS: { value: 1, label: '支付成功', type: 'success', color: '#52c41a' },
  FAILED: { value: 2, label: '支付失败', type: 'danger', color: '#ff4d4f' },
  REFUNDED: { value: 3, label: '已退款', type: 'info', color: '#909399' }
}

export const PaymentFailCodeEnum = {
  INSUFFICIENT_BALANCE: { value: 'insufficient_balance', label: '余额不足' },
  CHANNEL_ERROR: { value: 'channel_error', label: '渠道异常' },
  TIMEOUT: { value: 'timeout', label: '超时未支付' }
}

export const DeductionTypeEnum = {
  COUPON: { value: 'coupon', label: '优惠券', color: '#faad14' },
  POINTS: { value: 'points', label: '积分抵扣', color: '#1890ff' },
  MEMBER_DISCOUNT: { value: 'member_discount', label: '会员折扣', color: '#722ed1' },
  ACTIVITY: { value: 'activity', label: '活动优惠', color: '#eb2f96' },
  VOUCHER: { value: 'voucher', label: '代金券', color: '#52c41a' }
}

export const FeeTypeEnum = {
  CHANNEL: { value: 'channel', label: '渠道手续费' },
  SERVICE: { value: 'service', label: '服务费' },
  INSTALLMENT: { value: 'installment', label: '分期手续费' },
  WITHDRAW: { value: 'withdraw', label: '提现手续费' }
}

export const OrderPriorityEnum = {
  NORMAL: { value: 0, label: '普通订单', type: 'info' },
  HIGH_END: { value: 1, label: '高端商旅', type: 'danger' }
}

export const getEnumLabel = (enumObj, value) => {
  const item = Object.values(enumObj).find((item) => item.value === value)
  return item ? item.label : '未知'
}

export const getEnumType = (enumObj, value) => {
  const item = Object.values(enumObj).find((item) => item.value === value)
  return item ? item.type : 'info'
}

export const getEnumOptions = (enumObj) => {
  return Object.values(enumObj).map((item) => ({
    label: item.label,
    value: item.value
  }))
}

export const getEnumColor = (enumObj, value) => {
  const item = Object.values(enumObj).find((item) => item.value === value)
  return item ? item.color : '#909399'
}

export default {
  OrderStatusEnum,
  OrderSourceEnum,
  OrderAbnormalEnum,
  OrderLockEnum,
  OrderArchiveEnum,
  TravelCategoryEnum,
  AuditStatusEnum,
  CommonStatusEnum,
  BusinessTravelStatusEnum,
  BusinessTravelTypeEnum,
  CouponTypeEnum,
  CouponStatusEnum,
  ApprovalStatusEnum,
  ViolationLevelEnum,
  NotificationTypeEnum,
  PaymentModeEnum,
  PaymentChannelEnum,
  PaymentFlowStatusEnum,
  PaymentFailCodeEnum,
  DeductionTypeEnum,
  FeeTypeEnum,
  OrderPriorityEnum,
  getEnumLabel,
  getEnumType,
  getEnumOptions,
  getEnumColor
}

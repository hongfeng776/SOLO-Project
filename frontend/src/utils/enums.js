export const OrderStatusEnum = {
  PENDING_PAYMENT: { value: 1, label: '待支付', type: 'warning' },
  PAID: { value: 2, label: '已支付', type: 'primary' },
  COMPLETED: { value: 3, label: '已完成', type: 'success' },
  CANCELLED: { value: 4, label: '已取消', type: 'info' },
  REFUNDING: { value: 5, label: '退款中', type: 'warning' },
  REFUNDED: { value: 6, label: '已退款', type: 'danger' }
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

export default {
  OrderStatusEnum,
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
  getEnumLabel,
  getEnumType,
  getEnumOptions
}

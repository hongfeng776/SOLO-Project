export const OrderStatusEnum = {
  PENDING_PAYMENT: {
    value: 1,
    label: '待支付',
    type: 'warning'
  },
  PAID: {
    value: 2,
    label: '已支付',
    type: 'primary'
  },
  COMPLETED: {
    value: 3,
    label: '已完成',
    type: 'success'
  },
  CANCELLED: {
    value: 4,
    label: '已取消',
    type: 'info'
  },
  REFUNDED: {
    value: 5,
    label: '已退款',
    type: 'danger'
  }
}

export const TravelCategoryEnum = {
  FLIGHT: {
    value: 1,
    label: '机票'
  },
  HOTEL: {
    value: 2,
    label: '酒店'
  },
  CAR_RENTAL: {
    value: 3,
    label: '租车'
  },
  TOUR_TICKET: {
    value: 4,
    label: '文旅票务'
  }
}

export const AuditStatusEnum = {
  PENDING: {
    value: 1,
    label: '待审核',
    type: 'warning'
  },
  APPROVED: {
    value: 2,
    label: '已通过',
    type: 'success'
  },
  REJECTED: {
    value: 3,
    label: '已拒绝',
    type: 'danger'
  }
}

export const CommonStatusEnum = {
  ENABLED: {
    value: 1,
    label: '启用',
    type: 'success'
  },
  DISABLED: {
    value: 0,
    label: '禁用',
    type: 'info'
  }
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
  getEnumLabel,
  getEnumType,
  getEnumOptions
}

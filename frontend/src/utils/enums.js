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

export const AfterSaleTypeEnum = {
  NOT_FULFILLED: { value: 'not_fulfilled', label: '未履约退款', color: '#52c41a' },
  PARTIAL_FULFILLED: { value: 'partial_fulfilled', label: '部分履约退款', color: '#faad14' },
  FULL_FULFILLED: { value: 'full_fulfilled', label: '完全履约退款', color: '#ff7a45' }
}

export const AfterSaleStatusEnum = {
  PENDING: { value: 0, label: '待审核', type: 'warning', color: '#faad14' },
  APPROVED: { value: 1, label: '审核通过', type: 'primary', color: '#1890ff' },
  REJECTED: { value: 2, label: '审核驳回', type: 'danger', color: '#ff4d4f' },
  REFUNDING: { value: 3, label: '退款中', type: 'warning', color: '#ff7a45' },
  REFUNDED: { value: 4, label: '已退款', type: 'success', color: '#52c41a' },
  CLOSED: { value: 5, label: '已关闭', type: 'info', color: '#909399' },
  POSTPONED: { value: 6, label: '暂缓处理', type: 'info', color: '#722ed1' }
}

export const AfterSaleAuditActionEnum = {
  SUBMIT: { value: 'submit', label: '提交申请' },
  APPROVE: { value: 'approve', label: '审核通过' },
  REJECT: { value: 'reject', label: '审核驳回' },
  POSTPONE: { value: 'postpone', label: '暂缓处理' },
  CLOSE: { value: 'close', label: '关闭申请' },
  EXECUTE_REFUND: { value: 'execute_refund', label: '执行退款' }
}

export const RefundChannelEnum = {
  WECHAT: { value: 'wechat', label: '微信退款', icon: 'ChatDotRound' },
  ALIPAY: { value: 'alipay', label: '支付宝退款', icon: 'Aim' },
  UNIONPAY: { value: 'unionpay', label: '银联退款', icon: 'CreditCard' },
  CREDIT_CARD: { value: 'credit_card', label: '信用卡退款', icon: 'Money' },
  BALANCE: { value: 'balance', label: '余额退款', icon: 'Wallet' }
}

export const RefundFlowStatusEnum = {
  PROCESSING: { value: 0, label: '处理中', type: 'warning', color: '#faad14' },
  SUCCESS: { value: 1, label: '退款成功', type: 'success', color: '#52c41a' },
  FAILED: { value: 2, label: '退款失败', type: 'danger', color: '#ff4d4f' },
  CANCELLED: { value: 3, label: '已撤销', type: 'info', color: '#909399' }
}

export const PenaltyRuleEnum = {
  WITHIN_24H: { value: 0.1, label: '24小时内', rateLabel: '10%' },
  WITHIN_7D: { value: 0.05, label: '7天内', rateLabel: '5%' },
  OVER_7D: { value: 0, label: '超过7天', rateLabel: '0%' }
}

export const RefundRatioEnum = {
  NOT_FULFILLED: { value: 1.0, label: '未履约', rateLabel: '100%' },
  PARTIAL_FULFILLED: { value: 0.7, label: '部分履约', rateLabel: '70%' },
  FULL_FULFILLED: { value: 0.5, label: '完全履约', rateLabel: '50%' }
}

export const StatsPeriodEnum = {
  DAY: { value: 'day', label: '单日' },
  WEEK: { value: 'week', label: '周度' },
  MONTH: { value: 'month', label: '月度' },
  CUSTOM: { value: 'custom', label: '自定义周期' }
}

export const StatsDimensionEnum = {
  OVERVIEW: { value: 'overview', label: '整体概览' },
  CATEGORY: { value: 'category', label: '按品类' },
  PAYMENT: { value: 'payment', label: '按支付渠道' },
  STATUS: { value: 'status', label: '按订单状态' }
}

export const UserLevelEnum = {
  NORMAL: { value: 1, label: '普通用户', color: '#909399', type: 'info' },
  BUSINESS: { value: 2, label: '商旅用户', color: '#1890ff', type: 'primary' },
  VIP: { value: 3, label: 'VIP用户', color: '#faad14', type: 'warning' }
}

export const UserStatusEnum = {
  ENABLED: { value: 1, label: '启用', color: '#52c41a', type: 'success', gradient: 'linear-gradient(135deg, #52c41a, #73d13d)' },
  DISABLED: { value: 0, label: '禁用', color: '#909399', type: 'info', gradient: 'linear-gradient(135deg, #909399, #c0c4cc)' },
  FROZEN: { value: 2, label: '冻结', color: '#ff4d4f', type: 'danger', gradient: 'linear-gradient(135deg, #ff4d4f, #ff7875)' }
}

export const UserAbnormalTypeEnum = {
  FAKE_REG: { value: 'fake_reg', label: '虚假注册', color: '#ff4d4f' },
  INFO_MISSING: { value: 'info_missing', label: '信息缺失', color: '#faad14' },
  DUPLICATE: { value: 'duplicate', label: '重复注册', color: '#722ed1' }
}

export const RegisterChannelEnum = {
  APP: { value: 'app', label: 'APP端', color: '#1890ff' },
  WECHAT: { value: 'wechat', label: '微信端', color: '#52c41a' },
  WEB: { value: 'web', label: 'PC端', color: '#722ed1' },
  OFFLINE: { value: 'offline', label: '线下门店', color: '#faad14' },
  THIRD_PARTY: { value: 'third_party', label: '第三方渠道', color: '#eb2f96' }
}

export const UserTagOptions = [
  { value: 'frequent', label: '高频用户', color: '#1890ff' },
  { value: 'high_value', label: '高价值', color: '#faad14' },
  { value: 'new_user', label: '新用户', color: '#52c41a' },
  { value: 'potential', label: '潜力用户', color: '#722ed1' },
  { value: 'lost', label: '流失预警', color: '#ff4d4f' },
  { value: 'complaint', label: '投诉用户', color: '#eb2f96' }
]

export const PermissionTypeEnum = {
  BASE: { value: 'base', label: '基础权限', color: '#1890ff', icon: 'User' },
  TRAVEL: { value: 'travel', label: '出行特权', color: '#52c41a', icon: 'Van' },
  MARKETING: { value: 'marketing', label: '营销权益', color: '#faad14', icon: 'Present' },
  BUSINESS: { value: 'business', label: '商旅专属', color: '#722ed1', icon: 'Suitcase' }
}

export const PermissionActionEnum = {
  GRANT: { value: 'grant', label: '授予权限', color: '#52c41a' },
  REVOKE: { value: 'revoke', label: '收回权限', color: '#ff4d4f' },
  UPDATE: { value: 'update', label: '修改配置', color: '#1890ff' },
  BATCH_GRANT: { value: 'batch_grant', label: '批量授予', color: '#52c41a' },
  BATCH_REVOKE: { value: 'batch_revoke', label: '批量收回', color: '#ff4d4f' },
  RESET: { value: 'reset', label: '重置权限', color: '#722ed1' },
  EXPIRE: { value: 'expire', label: '自动过期', color: '#909399' }
}

export const PermissionStatusEnum = {
  ACTIVE: { value: 1, label: '生效中', color: '#52c41a', type: 'success' },
  EXPIRED: { value: 0, label: '已过期', color: '#909399', type: 'info' },
  CANCELED: { value: 2, label: '已取消', color: '#ff4d4f', type: 'danger' }
}

export const PermissionTemplateOptions = [
  { value: 'normal_default', label: '普通用户默认', userLevel: 1, description: '基础浏览与下单权限' },
  { value: 'business_standard', label: '商旅用户标准', userLevel: 2, description: '商旅出行专属权益' },
  { value: 'vip_premium', label: 'VIP尊享', userLevel: 3, description: '全部特权开放' },
  { value: 'restricted', label: '受限用户', userLevel: 1, description: '仅保留基础查看权限' }
]

export const PermissionSourceEnum = {
  MANUAL: { value: 'manual', label: '手动配置', color: '#1890ff' },
  LEVEL: { value: 'level', label: '等级自带', color: '#52c41a' },
  ACTIVITY: { value: 'activity', label: '活动赠送', color: '#faad14' },
  BATCH: { value: 'batch', label: '批量配置', color: '#722ed1' }
}

export const BehaviorTypeEnum = {
  BROWSE: { value: 'browse', label: '浏览行为', color: '#1890ff', icon: 'View' },
  ORDER: { value: 'order', label: '下单行为', color: '#52c41a', icon: 'ShoppingCart' },
  AFTERSALE: { value: 'aftersale', label: '售后行为', color: '#faad14', icon: 'Service' },
  MARKETING: { value: 'marketing', label: '营销参与', color: '#722ed1', icon: 'Present' }
}

export const BehaviorKeyEnum = {
  product_view: { label: '商品浏览', type: 'browse' },
  category_view: { label: '分类浏览', type: 'browse' },
  search: { label: '搜索行为', type: 'browse' },
  home_view: { label: '首页访问', type: 'browse' },
  order_create: { label: '创建订单', type: 'order' },
  order_pay: { label: '订单支付', type: 'order' },
  order_cancel: { label: '取消订单', type: 'order' },
  coupon_use: { label: '使用优惠券', type: 'order' },
  refund_apply: { label: '申请退款', type: 'aftersale' },
  refund_audit: { label: '退款审核', type: 'aftersale' },
  exchange_apply: { label: '申请换货', type: 'aftersale' },
  complaint: { label: '投诉申诉', type: 'aftersale' },
  coupon_receive: { label: '领取优惠券', type: 'marketing' },
  activity_join: { label: '参与活动', type: 'marketing' },
  points_exchange: { label: '积分兑换', type: 'marketing' },
  share_invite: { label: '分享邀请', type: 'marketing' }
}

export const RiskLevelEnum = {
  NORMAL: { value: 0, label: '正常', color: '#52c41a', type: 'success' },
  LIGHT: { value: 1, label: '轻度预警', color: '#faad14', type: 'warning' },
  MEDIUM: { value: 2, label: '中度关注', color: '#fa8c16', type: 'warning' },
  HEAVY: { value: 3, label: '重度高危', color: '#ff4d4f', type: 'danger' }
}

export const AbnormalTypeEnum = {
  fake: { value: 'fake', label: '虚假行为', color: '#ff4d4f' },
  duplicate: { value: 'duplicate', label: '重复操作', color: '#faad14' },
  fraud: { value: 'fraud', label: '刷单行为', color: '#eb2f96' },
  abuse: { value: 'abuse', label: '恶意售后', color: '#fa541c' },
  wool: { value: 'wool', label: '薅羊毛', color: '#722ed1' }
}

export const RiskTagOptions = [
  { value: '刷单嫌疑', color: '#eb2f96' },
  { value: '恶意售后', color: '#ff4d4f' },
  { value: '薅权益', color: '#722ed1' },
  { value: 'IP异常', color: '#faad14' },
  { value: '人工标记', color: '#1890ff' },
  { value: '高频操作', color: '#fa8c16' }
]

export const RestrictTypeEnum = {
  order: { value: 'order', label: '限制下单', desc: '禁止用户创建新订单' },
  aftersale: { value: 'aftersale', label: '限制售后', desc: '禁止用户发起售后申请' },
  all: { value: 'all', label: '全功能限制', desc: '禁止用户所有业务操作' }
}

export const MerchantTypeEnum = {
  INDIVIDUAL: { value: 1, label: '个人商家' },
  ENTERPRISE: { value: 2, label: '企业商家' },
  OFFICIAL: { value: 3, label: '官方直营' },
  FRANCHISE: { value: 4, label: '品牌加盟' }
}

export const MerchantAuditStatusEnum = {
  PENDING: { value: 0, label: '待审核', type: 'warning', color: '#faad14' },
  APPROVED: { value: 1, label: '已通过', type: 'success', color: '#52c41a' },
  REJECTED: { value: 2, label: '已驳回', type: 'danger', color: '#ff4d4f' },
  AUDITING: { value: 3, label: '审核中', type: 'primary', color: '#1890ff' },
  TEMPORARY: { value: 4, label: '已暂存', type: 'info', color: '#722ed1' },
  EXPIRED: { value: 5, label: '已过期', type: 'info', color: '#909399' },
  FINAL_AUDITING: { value: 6, label: '终审中', type: 'primary', color: '#13c2c2' },
  REVISED_PENDING: { value: 7, label: '已修正待审', type: 'warning', color: '#eb2f96' }
}

export const MerchantBusinessTypeEnum = {
  FLIGHT: { value: 'flight', label: '机票商家', icon: 'Promotion', color: '#1890ff', gradient: 'linear-gradient(135deg, #1890ff, #69c0ff)' },
  HOTEL: { value: 'hotel', label: '酒店商家', icon: 'OfficeBuilding', color: '#52c41a', gradient: 'linear-gradient(135deg, #52c41a, #95de64)' },
  TOURISM: { value: 'tourism', label: '文旅商家', icon: 'Tickets', color: '#faad14', gradient: 'linear-gradient(135deg, #faad14, #ffd666)' },
  CAR: { value: 'car', label: '租车商家', icon: 'Van', color: '#722ed1', gradient: 'linear-gradient(135deg, #722ed1, #b37feb)' }
}

export const MerchantCategoryEnum = {
  NORMAL: { value: 1, label: '普通商家', type: 'info' },
  HIGH_RISK: { value: 2, label: '高危行业', type: 'danger' }
}

export const SettleStatusEnum = {
  NOT_STARTED: { value: 0, label: '未开始', type: 'info' },
  INFO_SUBMITTED: { value: 1, label: '信息已提交', type: 'primary' },
  QUALIFICATION_SUBMITTED: { value: 2, label: '资质已提交', type: 'primary' },
  AUDITING: { value: 3, label: '审核中', type: 'warning' },
  COMPLETED: { value: 4, label: '入驻完成', type: 'success' },
  LOCKED: { value: 5, label: '已锁定', type: 'danger' }
}

export const AuditLevelEnum = {
  INITIAL: { value: 1, label: '初审', type: 'primary' },
  FINAL: { value: 2, label: '终审', type: 'danger' }
}

export const QualificationCategoryEnum = {
  BUSINESS_LICENSE: { value: 'business_license', label: '营业执照', required: true },
  OPERATION_PERMIT: { value: 'operation_permit', label: '经营资质证书', required: true },
  AUTHORIZATION: { value: 'authorization', label: '品牌授权证明', required: true },
  LEGAL_PERSON: { value: 'legal_person', label: '法人身份证明', required: true },
  FLIGHT_PERMIT: { value: 'flight_permit', label: '航空运营资质', required: false },
  HOTEL_PERMIT: { value: 'hotel_permit', label: '酒店特种许可', required: false },
  TICKET_PERMIT: { value: 'ticket_permit', label: '文旅经营许可', required: false },
  CAR_PERMIT: { value: 'car_permit', label: '车辆运营资质', required: false }
}

export const QualificationAuditResultEnum = {
  PENDING: { value: 0, label: '待审核', type: 'warning' },
  PASSED: { value: 1, label: '通过', type: 'success' },
  FAILED: { value: 2, label: '不合格', type: 'danger' }
}

export const AuditActionEnum = {
  SUBMIT: { value: 'submit', label: '提交入驻申请', color: '#1890ff' },
  AUDIT_PASS: { value: 'audit_pass', label: '审核通过', color: '#52c41a' },
  AUDIT_REJECT: { value: 'audit_reject', label: '审核驳回', color: '#ff4d4f' },
  AUDIT_TEMPORARY: { value: 'audit_temporary', label: '审核暂存', color: '#722ed1' },
  REVISE: { value: 'revise', label: '信息修正', color: '#faad14' },
  FINAL_PASS: { value: 'final_pass', label: '终审通过', color: '#13c2c2' },
  FINAL_REJECT: { value: 'final_reject', label: '终审驳回', color: '#ff4d4f' },
  EXPIRE: { value: 'expire', label: '审核过期', color: '#909399' },
  AUTO_RESET: { value: 'auto_reset', label: '自动重置', color: '#909399' },
  DETECT_VIOLATION: { value: 'detect_violation', label: '违规检测拦截', color: '#f5222d' }
}

export const ExportStatusEnum = {
  IDLE: { value: 'idle', label: '待导出' },
  PROCESSING: { value: 'processing', label: '导出中' },
  SUCCESS: { value: 'success', label: '导出成功' },
  FAILED: { value: 'failed', label: '导出失败' }
}

export const BenefitTypeEnum = {
  COUPON: { value: 1, label: '出行优惠券', color: '#1890ff', gradient: 'linear-gradient(135deg, #1890ff, #69c0ff)', icon: 'Present' },
  POINT: { value: 2, label: '积分权益', color: '#52c41a', gradient: 'linear-gradient(135deg, #52c41a, #95de64)', icon: 'Medal' },
  VIP: { value: 3, label: '贵宾权益', color: '#faad14', gradient: 'linear-gradient(135deg, #faad14, #ffd666)', icon: 'StarFilled' },
  BUSINESS: { value: 4, label: '商旅专属', color: '#722ed1', gradient: 'linear-gradient(135deg, #722ed1, #b37feb)', icon: 'OfficeBuilding' }
}

export const BenefitStatusEnum = {
  VOID: { value: 0, label: '已作废', color: '#909399', type: 'info' },
  UNUSED: { value: 1, label: '未使用', color: '#52c41a', type: 'success' },
  PARTIAL: { value: 2, label: '部分使用', color: '#1890ff', type: 'primary' },
  USED_UP: { value: 3, label: '已用完', color: '#722ed1', type: '' },
  EXPIRED: { value: 4, label: '已过期', color: '#ff4d4f', type: 'danger' }
}

export const BenefitUnitEnum = {
  COUNT: { value: 'count', label: '次' },
  SCORE: { value: 'score', label: '积分' },
  AMOUNT: { value: 'amount', label: '元' },
  DISCOUNT: { value: 'discount', label: '折' }
}

export const BenefitSourceEnum = {
  MANUAL: { value: 'manual', label: '手动发放', color: '#1890ff' },
  SYSTEM: { value: 'system', label: '系统自动', color: '#52c41a' },
  BATCH: { value: 'batch', label: '批量发放', color: '#722ed1' },
  CAMPAIGN: { value: 'campaign', label: '活动赠送', color: '#faad14' },
  ORDER: { value: 'order', label: '订单关联', color: '#fa8c16' }
}

export const BenefitActionEnum = {
  GRANT: { value: 'grant', label: '发放', color: '#52c41a' },
  REISSUE: { value: 'reissue', label: '补发', color: '#1890ff' },
  VOID: { value: 'void', label: '作废', color: '#909399' },
  USE: { value: 'use', label: '使用', color: '#722ed1' },
  RETURN: { value: 'return', label: '退回', color: '#13c2c2' },
  EXTEND: { value: 'extend', label: '延期', color: '#faad14' },
  RECYCLE: { value: 'recycle', label: '回收', color: '#ff4d4f' },
  EXPIRE: { value: 'expire', label: '过期', color: '#f5222d' },
  BLOCK: { value: 'block', label: '拦截', color: '#eb2f96' }
}

export const BenefitAbnormalEnum = {
  DUPLICATE: { value: 'duplicate', label: '重复发放', color: '#fa8c16' },
  OVER_LIMIT: { value: 'over_limit', label: '超额发放', color: '#faad14' },
  OVER_COUNT: { value: 'over_count', label: '超次使用', color: '#ff4d4f' },
  INVALID: { value: 'invalid', label: '无效使用', color: '#f5222d' },
  SCENE: { value: 'scene', label: '场景不符', color: '#eb2f96' },
  MISMATCH: { value: 'mismatch', label: '数据不一致', color: '#722ed1' },
  OVER_FREQ: { value: 'over_frequency', label: '操作频率过高', color: '#fa541c' }
}

export const BenefitTemplateOptions = [
  {
    value: 'coupon_flight_50',
    benefitType: 1,
    label: '机票满500减50',
    amountValue: 50,
    minAmount: 500,
    unitType: 'amount',
    scenes: 'flight',
    desc: '机票订单满500元可使用'
  },
  {
    value: 'coupon_hotel_100',
    benefitType: 1,
    label: '酒店满1000减100',
    amountValue: 100,
    minAmount: 1000,
    unitType: 'amount',
    scenes: 'hotel',
    desc: '酒店订单满1000元可使用'
  },
  {
    value: 'coupon_all_95',
    benefitType: 1,
    label: '全场95折优惠券',
    amountValue: 95,
    unitType: 'discount',
    scenes: 'flight,hotel,car,ticket',
    desc: '全场通用95折，最高优惠200元'
  },
  {
    value: 'point_1000',
    benefitType: 2,
    label: '赠送1000积分',
    totalQuantity: 1000,
    unitType: 'score',
    desc: '可用于积分兑换商城商品'
  },
  {
    value: 'point_double',
    benefitType: 2,
    label: '双倍积分特权(7天)',
    totalQuantity: 7,
    unitType: 'count',
    desc: '7天内消费积分双倍返还'
  },
  {
    value: 'vip_lounge',
    benefitType: 3,
    label: 'VIP休息室(1次)',
    benefitType: 3,
    levelRequired: 3,
    totalQuantity: 1,
    unitType: 'count',
    scenes: 'flight',
    desc: '机场VIP贵宾休息室，全国机场通用'
  },
  {
    value: 'vip_fasttrack',
    benefitType: 3,
    label: '快速安检通道(3次)',
    levelRequired: 3,
    totalQuantity: 3,
    unitType: 'count',
    scenes: 'flight',
    desc: '机场快速安检通道3次权益'
  },
  {
    value: 'business_fee_waiver',
    benefitType: 4,
    label: '改签手续费全免(5次)',
    levelRequired: 2,
    totalQuantity: 5,
    unitType: 'count',
    scenes: 'flight,hotel',
    desc: '机票/酒店订单改签手续费全免'
  },
  {
    value: 'business_manager',
    benefitType: 4,
    label: '专属商旅经理',
    levelRequired: 2,
    totalQuantity: 1,
    unitType: 'count',
    scenes: 'business',
    desc: '一对一专属商旅经理7*24小时服务'
  }
]

export const BatchModeEnum = {
  STRICT: { value: 'strict', label: '严格模式（超半数失败即中止）' },
  SOFT: { value: 'soft', label: '容错模式（跳过失败继续执行）' }
}

export const ApplyScopeEnum = {
  GLOBAL: { value: 'global', label: '全局生效', color: '#722ed1' },
  PARTIAL: { value: 'partial', label: '局部生效', color: '#1890ff' }
}

export const BusinessStatusEnum = {
  CLOSED: { value: 0, label: '停业', type: 'info', color: '#909399', gradient: 'linear-gradient(135deg, #909399, #c0c4cc)' },
  OPERATING: { value: 1, label: '营业中', type: 'success', color: '#52c41a', gradient: 'linear-gradient(135deg, #52c41a, #95de64)' },
  SUSPENDED: { value: 2, label: '暂停营业', type: 'warning', color: '#faad14', gradient: 'linear-gradient(135deg, #faad14, #ffd666)' },
  DECORATING: { value: 3, label: '装修中', type: 'primary', color: '#1890ff', gradient: 'linear-gradient(135deg, #1890ff, #69c0ff)' },
  OUT_OF_BUSINESS: { value: 4, label: '已结业', type: 'danger', color: '#ff4d4f', gradient: 'linear-gradient(135deg, #ff4d4f, #ff7875)' }
}

export const OperationStatusEnum = {
  ABNORMAL: { value: 0, label: '异常', type: 'danger', color: '#f5222d', gradient: 'linear-gradient(135deg, #f5222d, #ff4d4f)' },
  NORMAL: { value: 1, label: '正常运营', type: 'success', color: '#52c41a', gradient: 'linear-gradient(135deg, #52c41a, #95de64)' },
  TEMP_LOCKED: { value: 2, label: '临时锁定', type: 'warning', color: '#faad14', gradient: 'linear-gradient(135deg, #faad14, #ffd666)' },
  PERM_LOCKED: { value: 3, label: '永久锁定', type: 'danger', color: '#ff4d4f', gradient: 'linear-gradient(135deg, #ff4d4f, #ff7875)' }
}

export const MerchantLevelEnum = {
  LEVEL1: { value: 1, label: '一星', color: '#909399', icon: 'StarFilled' },
  LEVEL2: { value: 2, label: '二星', color: '#67c23a', icon: 'StarFilled' },
  LEVEL3: { value: 3, label: '三星', color: '#909399', icon: 'StarFilled' },
  LEVEL4: { value: 4, label: '四星', color: '#e6a23c', icon: 'StarFilled' },
  LEVEL5: { value: 5, label: '五星', color: '#f56c6c', icon: 'StarFilled' }
}

export const MerchantTagOptions = [
  { value: 'official', label: '官方直营', color: '#1890ff', type: 'primary' },
  { value: 'brand_authorized', label: '品牌授权', color: '#722ed1', type: '' },
  { value: 'high_quality', label: '优质商家', color: '#52c41a', type: 'success' },
  { value: 'new_merchant', label: '新商家', color: '#faad14', type: 'warning' },
  { value: 'hot', label: '热门商家', color: '#f5222d', type: 'danger' },
  { value: 'recommended', label: '平台推荐', color: '#13c2c2', type: '' },
  { value: 'credit', label: '诚信商家', color: '#2f54eb', type: '' },
  { value: 'eco_friendly', label: '绿色环保', color: '#52c41a', type: '' }
]

export const ChangeTypeEnum = {
  BASIC_INFO: { value: 1, label: '基础工商信息', color: '#1890ff', icon: 'Document' },
  BUSINESS_INFO: { value: 2, label: '经营品类信息', color: '#52c41a', icon: 'ShoppingCart' },
  CONTACT_INFO: { value: 3, label: '联系方式', color: '#faad14', icon: 'Phone' },
  SETTLEMENT_INFO: { value: 4, label: '结算信息', color: '#722ed1', icon: 'Money' },
  BUSINESS_STATUS: { value: 5, label: '经营状态', color: '#13c2c2', icon: 'Clock' },
  OPERATION_STATUS: { value: 6, label: '运营状态', color: '#f5222d', icon: 'Lock' },
  TAGS: { value: 7, label: '商家标签', color: '#eb2f96', icon: 'PriceTag' },
  NOTICE: { value: 8, label: '公示信息', color: '#fa8c16', icon: 'Bell' },
  BATCH: { value: 9, label: '批量更新', color: '#909399', icon: 'Files' }
}

export const VerifyStatusEnum = {
  FAILED: { value: 0, label: '校验未通过', type: 'danger', color: '#ff4d4f' },
  PASSED: { value: 1, label: '校验通过', type: 'success', color: '#52c41a' },
  NEED_REVIEW: { value: 2, label: '需复核', type: 'warning', color: '#faad14' }
}

export const SettleCycleEnum = {
  DAILY: { value: 1, label: '日结', color: '#52c41a' },
  WEEKLY: { value: 2, label: '周结', color: '#1890ff' },
  BI_WEEKLY: { value: 3, label: '半月结', color: '#13c2c2' },
  MONTHLY: { value: 4, label: '月结', color: '#722ed1' },
  QUARTERLY: { value: 5, label: '季结', color: '#faad14' }
}

export const DepositStatusEnum = {
  UNPAID: { value: 0, label: '未缴纳', type: 'danger', color: '#ff4d4f' },
  PAID: { value: 1, label: '已缴纳', type: 'success', color: '#52c41a' },
  PARTIAL: { value: 2, label: '部分缴纳', type: 'warning', color: '#faad14' },
  REFUNDED: { value: 3, label: '已退还', type: 'info', color: '#909399' }
}

export const OperationModeEnum = {
  SELF_OPERATED: { value: 1, label: '自营', color: '#1890ff' },
  JOINT_OPERATION: { value: 2, label: '联营', color: '#52c41a' },
  COMMISSION_ONLY: { value: 3, label: '纯佣金', color: '#722ed1' }
}

export const InfoEditBranchEnum = {
  BASIC: { key: 'basic', label: '基础工商信息', icon: 'OfficeBuilding', color: '#1890ff' },
  BUSINESS: { key: 'business', label: '经营品类信息', icon: 'ShoppingCart', color: '#52c41a' },
  CONTACT: { key: 'contact', label: '联系方式', icon: 'Phone', color: '#faad14' },
  SETTLEMENT: { key: 'settlement', label: '结算信息', icon: 'Money', color: '#722ed1' }
}

export const CompletenessStatusEnum = {
  EXCELLENT: { min: 90, label: '信息完整', color: '#52c41a', type: 'success' },
  GOOD: { min: 70, label: '基本完整', color: '#1890ff', type: 'primary' },
  FAIR: { min: 50, label: '部分缺失', color: '#faad14', type: 'warning' },
  POOR: { min: 0, label: '严重缺失', color: '#ff4d4f', type: 'danger' }
}

export const FlightTypeEnum = {
  DOMESTIC: { value: 1, label: '国内航班', type: 'primary', color: '#1890ff', icon: 'Airplane' },
  INTERNATIONAL: { value: 2, label: '国际航班', type: 'success', color: '#52c41a', icon: 'Global' },
  TRANSFER: { value: 3, label: '中转航班', type: 'warning', color: '#faad14', icon: 'Connection' },
  CHARTER: { value: 4, label: '包机航班', type: '', color: '#722ed1', icon: 'Promotion' }
}

export const FlightOperationStatusEnum = {
  NORMAL: { value: 1, label: '正常', type: 'success', color: '#52c41a', dotColor: '#52c41a' },
  DELAYED: { value: 2, label: '延误', type: 'warning', color: '#faad14', dotColor: '#faad14' },
  CANCELLED: { value: 3, label: '取消', type: 'danger', color: '#ff4d4f', dotColor: '#ff4d4f' },
  DIVERTED: { value: 4, label: '备降', type: 'info', color: '#1890ff', dotColor: '#1890ff' },
  RETURNED: { value: 5, label: '返航', type: 'info', color: '#722ed1', dotColor: '#722ed1' }
}

export const FlightDisplayStatusEnum = {
  OFFLINE: { value: 0, label: '已下架', type: 'info', color: '#909399' },
  ONLINE: { value: 1, label: '已上架', type: 'success', color: '#52c41a' }
}

export const FlightSaleStatusEnum = {
  NOT_ON_SALE: { value: 0, label: '不可售', type: 'info', color: '#909399' },
  ON_SALE: { value: 1, label: '可售', type: 'success', color: '#52c41a' }
}

export const CabinClassEnum = {
  ECONOMY: { value: 'economy', label: '经济舱', color: '#1890ff' },
  BUSINESS: { value: 'business', label: '商务舱', color: '#faad14' },
  FIRST: { value: 'first', label: '头等舱', color: '#722ed1' }
}

export const FlightLogTypeEnum = {
  CREATE: { value: 1, label: '创建航班', color: '#52c41a', icon: 'Plus' },
  UPDATE: { value: 2, label: '修改航班', color: '#1890ff', icon: 'Edit' },
  ONLINE: { value: 3, label: '上架', color: '#52c41a', icon: 'Upload' },
  OFFLINE: { value: 4, label: '下架', color: '#909399', icon: 'Download' },
  STATUS_CHANGE: { value: 5, label: '状态变更', color: '#faad14', icon: 'Refresh' },
  BATCH: { value: 6, label: '批量操作', color: '#722ed1', icon: 'Files' },
  DELETE: { value: 7, label: '删除', color: '#ff4d4f', icon: 'Delete' },
  QUALIFICATION: { value: 8, label: '资质变更', color: '#13c2c2', icon: 'Stamp' },
  INVENTORY: { value: 9, label: '库存调整', color: '#eb2f96', icon: 'Goods' }
}

export const FlightValidateFieldEnum = {
  flightNo: '航班号',
  airline: '航空公司',
  routeCode: '航线编码',
  departure: '出发地',
  departureAirport: '出发机场',
  departureAirportCode: '出发机场三字码',
  arrival: '目的地',
  arrivalAirport: '到达机场',
  arrivalAirportCode: '到达机场三字码',
  departureTime: '出发时间',
  arrivalTime: '到达时间',
  aircraftType: '机型',
  aircraftModel: '机型型号',
  price: '价格',
  seats: '剩余座位数',
  seatCount: '总座位数',
  departureCountry: '出发国家',
  arrivalCountry: '到达国家',
  transferCity: '中转城市',
  transferAirportCode: '中转机场三字码',
  charterContractNo: '包机合同编号',
  qualificationCode: '运营资质编码'
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
  AfterSaleTypeEnum,
  AfterSaleStatusEnum,
  AfterSaleAuditActionEnum,
  RefundChannelEnum,
  RefundFlowStatusEnum,
  PenaltyRuleEnum,
  RefundRatioEnum,
  StatsPeriodEnum,
  StatsDimensionEnum,
  UserLevelEnum,
  UserStatusEnum,
  UserAbnormalTypeEnum,
  RegisterChannelEnum,
  UserTagOptions,
  PermissionTypeEnum,
  PermissionActionEnum,
  PermissionStatusEnum,
  PermissionTemplateOptions,
  PermissionSourceEnum,
  BehaviorTypeEnum,
  BehaviorKeyEnum,
  RiskLevelEnum,
  AbnormalTypeEnum,
  RiskTagOptions,
  RestrictTypeEnum,
  MerchantTypeEnum,
  MerchantAuditStatusEnum,
  MerchantBusinessTypeEnum,
  MerchantCategoryEnum,
  SettleStatusEnum,
  AuditLevelEnum,
  QualificationCategoryEnum,
  QualificationAuditResultEnum,
  AuditActionEnum,
  ExportStatusEnum,
  BenefitTypeEnum,
  BenefitStatusEnum,
  BenefitUnitEnum,
  BenefitSourceEnum,
  BenefitActionEnum,
  BenefitAbnormalEnum,
  BenefitTemplateOptions,
  BatchModeEnum,
  ApplyScopeEnum,
  BusinessStatusEnum,
  OperationStatusEnum,
  MerchantLevelEnum,
  MerchantTagOptions,
  ChangeTypeEnum,
  RiskLevelEnum,
  VerifyStatusEnum,
  SettleCycleEnum,
  DepositStatusEnum,
  OperationModeEnum,
  InfoEditBranchEnum,
  CompletenessStatusEnum,
  FlightTypeEnum,
  FlightOperationStatusEnum,
  FlightDisplayStatusEnum,
  FlightSaleStatusEnum,
  CabinClassEnum,
  FlightLogTypeEnum,
  FlightValidateFieldEnum,
  getEnumLabel,
  getEnumType,
  getEnumOptions,
  getEnumColor
}

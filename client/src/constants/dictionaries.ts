import { MarketType, RiskLevel, ProductType, ProductStatus, CustomerType, CustomerStatus, FlowType, FlowStatus, FlowChannel, AuditType, AuditStatus, TargetType, PermType, UserStatus, RoleStatus, PermissionStatus } from '@/enums'

export const MARKET_LABELS: Record<MarketType, string> = {
  [MarketType.SH]: '沪市',
  [MarketType.SZ]: '深市',
  [MarketType.HK]: '港股',
  [MarketType.US]: '美股',
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  [RiskLevel.R1]: 'R1-低风险',
  [RiskLevel.R2]: 'R2-中低风险',
  [RiskLevel.R3]: 'R3-中风险',
  [RiskLevel.R4]: 'R4-中高风险',
  [RiskLevel.R5]: 'R5-高风险',
}

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  [RiskLevel.R1]: '#67C23A',
  [RiskLevel.R2]: '#95D475',
  [RiskLevel.R3]: '#E6A23C',
  [RiskLevel.R4]: '#F56C6C',
  [RiskLevel.R5]: '#C45656',
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  [ProductType.FUND]: '基金',
  [ProductType.BOND]: '债券',
  [ProductType.INSURANCE]: '保险',
  [ProductType.TRUST]: '信托',
  [ProductType.DERIVATIVE]: '衍生品',
}

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  [ProductStatus.RAISING]: '募集期',
  [ProductStatus.OPERATING]: '运作中',
  [ProductStatus.MATURED]: '已到期',
  [ProductStatus.FROZEN]: '已冻结',
}

export const PRODUCT_STATUS_COLORS: Record<ProductStatus, string> = {
  [ProductStatus.RAISING]: 'warning',
  [ProductStatus.OPERATING]: 'success',
  [ProductStatus.MATURED]: 'info',
  [ProductStatus.FROZEN]: 'danger',
}

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  [CustomerType.INDIVIDUAL]: '个人',
  [CustomerType.INSTITUTION]: '机构',
}

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  [CustomerStatus.NORMAL]: '正常',
  [CustomerStatus.FROZEN]: '已冻结',
  [CustomerStatus.CLOSED]: '已销户',
}

export const CUSTOMER_STATUS_COLORS: Record<CustomerStatus, string> = {
  [CustomerStatus.NORMAL]: 'success',
  [CustomerStatus.FROZEN]: 'danger',
  [CustomerStatus.CLOSED]: 'info',
}

export const FLOW_TYPE_LABELS: Record<FlowType, string> = {
  [FlowType.DEPOSIT]: '充值',
  [FlowType.WITHDRAW]: '提现',
  [FlowType.BUY]: '买入',
  [FlowType.SELL]: '卖出',
  [FlowType.DIVIDEND]: '分红',
  [FlowType.FEE]: '手续费',
}

export const FLOW_STATUS_LABELS: Record<FlowStatus, string> = {
  [FlowStatus.PENDING]: '处理中',
  [FlowStatus.SUCCESS]: '成功',
  [FlowStatus.FAILED]: '失败',
  [FlowStatus.CANCELLED]: '已撤销',
}

export const FLOW_STATUS_COLORS: Record<FlowStatus, string> = {
  [FlowStatus.PENDING]: 'warning',
  [FlowStatus.SUCCESS]: 'success',
  [FlowStatus.FAILED]: 'danger',
  [FlowStatus.CANCELLED]: 'info',
}

export const FLOW_CHANNEL_LABELS: Record<FlowChannel, string> = {
  [FlowChannel.ONLINE]: '线上',
  [FlowChannel.OFFLINE]: '线下',
  [FlowChannel.API]: 'API',
}

export const AUDIT_TYPE_LABELS: Record<AuditType, string> = {
  [AuditType.KYC]: 'KYC审核',
  [AuditType.TRADE]: '交易审核',
  [AuditType.RISK]: '风控审核',
  [AuditType.COMPLIANCE]: '合规审核',
}

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  [AuditStatus.PENDING]: '待审核',
  [AuditStatus.APPROVED]: '已通过',
  [AuditStatus.REJECTED]: '已拒绝',
}

export const AUDIT_STATUS_COLORS: Record<AuditStatus, string> = {
  [AuditStatus.PENDING]: 'warning',
  [AuditStatus.APPROVED]: 'success',
  [AuditStatus.REJECTED]: 'danger',
}

export const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  [TargetType.CUSTOMER]: '客户',
  [TargetType.TRADE]: '交易',
  [TargetType.PRODUCT]: '产品',
}

export const PERM_TYPE_LABELS: Record<PermType, string> = {
  [PermType.MENU]: '菜单',
  [PermType.BUTTON]: '按钮',
  [PermType.API]: '接口',
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.DISABLED]: '禁用',
  [UserStatus.ENABLED]: '启用',
}

export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  [UserStatus.DISABLED]: 'danger',
  [UserStatus.ENABLED]: 'success',
}

export const ROLE_STATUS_LABELS: Record<RoleStatus, string> = {
  [RoleStatus.DISABLED]: '禁用',
  [RoleStatus.ENABLED]: '启用',
}

export const ROLE_STATUS_COLORS: Record<RoleStatus, string> = {
  [RoleStatus.DISABLED]: 'danger',
  [RoleStatus.ENABLED]: 'success',
}

export const PERMISSION_STATUS_LABELS: Record<PermissionStatus, string> = {
  [PermissionStatus.DISABLED]: '禁用',
  [PermissionStatus.ENABLED]: '启用',
}

export const PERMISSION_STATUS_COLORS: Record<PermissionStatus, string> = {
  [PermissionStatus.DISABLED]: 'danger',
  [PermissionStatus.ENABLED]: 'success',
}

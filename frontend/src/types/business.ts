export type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

export enum OrderStatus {
  PENDING_PAYMENT = 1,
  PAID = 2,
  SHIPPED = 3,
  COMPLETED = 4,
  CANCELLED = 5,
  REFUNDING = 6,
  REFUNDED = 7
}

export const OrderStatusMap: Record<number, { label: string; type: TagType }> = {
  [OrderStatus.PENDING_PAYMENT]: { label: '待付款', type: 'warning' },
  [OrderStatus.PAID]: { label: '已付款', type: 'primary' },
  [OrderStatus.SHIPPED]: { label: '已发货', type: 'info' },
  [OrderStatus.COMPLETED]: { label: '已完成', type: 'success' },
  [OrderStatus.CANCELLED]: { label: '已取消', type: 'danger' },
  [OrderStatus.REFUNDING]: { label: '退款中', type: 'warning' },
  [OrderStatus.REFUNDED]: { label: '已退款', type: 'danger' }
}

export enum LogisticsStatus {
  NOT_SHIPPED = 0,
  SHIPPED = 1,
  IN_TRANSIT = 2,
  DELIVERED = 3,
  SIGNED = 4
}

export const LogisticsStatusMap: Record<number, { label: string; type: TagType }> = {
  [LogisticsStatus.NOT_SHIPPED]: { label: '未发货', type: 'info' },
  [LogisticsStatus.SHIPPED]: { label: '已发货', type: 'primary' },
  [LogisticsStatus.IN_TRANSIT]: { label: '运输中', type: 'warning' },
  [LogisticsStatus.DELIVERED]: { label: '已送达', type: 'success' },
  [LogisticsStatus.SIGNED]: { label: '已签收', type: 'success' }
}

export enum GoodsStatus {
  OFF_SHELF = 0,
  ON_SHELF = 1,
  DELETED = 2
}

export const GoodsStatusMap: Record<number, { label: string; type: TagType }> = {
  [GoodsStatus.OFF_SHELF]: { label: '下架', type: 'info' },
  [GoodsStatus.ON_SHELF]: { label: '上架', type: 'success' },
  [GoodsStatus.DELETED]: { label: '已删除', type: 'danger' }
}

export enum UserStatus {
  DISABLED = 0,
  ENABLED = 1
}

export const UserStatusMap: Record<number, { label: string; type: TagType }> = {
  [UserStatus.DISABLED]: { label: '禁用', type: 'danger' },
  [UserStatus.ENABLED]: { label: '启用', type: 'success' }
}

export enum AfterSaleStatus {
  PENDING = 1,
  PROCESSING = 2,
  COMPLETED = 3,
  REJECTED = 4,
  CANCELLED = 5
}

export const AfterSaleStatusMap: Record<number, { label: string; type: TagType }> = {
  [AfterSaleStatus.PENDING]: { label: '待处理', type: 'warning' },
  [AfterSaleStatus.PROCESSING]: { label: '处理中', type: 'primary' },
  [AfterSaleStatus.COMPLETED]: { label: '已完成', type: 'success' },
  [AfterSaleStatus.REJECTED]: { label: '已拒绝', type: 'danger' },
  [AfterSaleStatus.CANCELLED]: { label: '已取消', type: 'info' }
}

export enum MarketingType {
  COUPON = 1,
  DISCOUNT = 2,
  SECKILL = 3,
  GROUPON = 4
}

export const MarketingTypeMap: Record<number, string> = {
  [MarketingType.COUPON]: '优惠券',
  [MarketingType.DISCOUNT]: '满减活动',
  [MarketingType.SECKILL]: '秒杀活动',
  [MarketingType.GROUPON]: '拼团活动'
}

export enum MerchantStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  DISABLED = 3
}

export const MerchantStatusMap: Record<number, { label: string; type: TagType }> = {
  [MerchantStatus.PENDING]: { label: '待审核', type: 'warning' },
  [MerchantStatus.APPROVED]: { label: '已入驻', type: 'success' },
  [MerchantStatus.REJECTED]: { label: '已拒绝', type: 'danger' },
  [MerchantStatus.DISABLED]: { label: '已禁用', type: 'info' }
}

export interface GoodsRequiredField {
  field: string
  label: string
  required: boolean
  rules: any[]
}

export interface ValidateError {
  field: string
  message: string
  code: string
}

export interface ValidateResult {
  valid: boolean
  errors: ValidateError[]
}

export interface EditFieldConfig {
  field: string
  editable: boolean
  readonlyReason?: string
  rules: any[]
}

export interface GoodsEditLog {
  id: number
  goodsId: number
  field: string
  oldValue: string
  newValue: string
  operator: string
  operateTime: string
  remark?: string
}

export interface GoodsAuditRecord {
  id: number
  goodsId: number
  auditor: string
  auditResult: string
  auditTime: string
  remark?: string
}

export interface MerchantInfo {
  id: number
  name: string
  status: number
  licenseNo: string
  registerTime: string
  qualificationList: QualificationItem[]
}

export interface QualificationItem {
  name: string
  no: string
  expireDate: string
  status: number
}

export interface CategoryRecord {
  id: number
  name: string
  parentId: number
  recordTime: string
  attributes: CategoryAttribute[]
}

export interface CategoryAttribute {
  name: string
  value: string
}

export interface GoodsFullTrace {
  merchant: MerchantInfo
  category: CategoryRecord
  editLogs: GoodsEditLog[]
  auditRecords: GoodsAuditRecord[]
}

export interface BatchAbility {
  canEdit: boolean
  canOffline: boolean
  canTop: boolean
  canDelete: boolean
  reason?: string
}

export interface ConsistencyIssue {
  type: string
  level: 'warning' | 'danger'
  message: string
  detail?: string
}

export interface RepeatSuggestion {
  goodsId: number
  name: string
  similarity: number
  matchFields: string[]
}

export interface ConsistencyResult {
  consistent: boolean
  issues: ConsistencyIssue[]
}

export interface BatchResult {
  successCount: number
  failCount: number
  failDetails: { id: number; message: string }[]
}

export enum ComplianceLevel {
  EXCELLENT = 1,
  GOOD = 2,
  NORMAL = 3,
  POOR = 4
}

export const ComplianceLevelMap: Record<number, { label: string; type: TagType }> = {
  [ComplianceLevel.EXCELLENT]: { label: '优秀', type: 'success' },
  [ComplianceLevel.GOOD]: { label: '良好', type: 'primary' },
  [ComplianceLevel.NORMAL]: { label: '一般', type: 'warning' },
  [ComplianceLevel.POOR]: { label: '较差', type: 'danger' }
}

export enum MerchantLevel {
  DIAMOND = 1,
  GOLD = 2,
  SILVER = 3,
  BRONZE = 4
}

export const MerchantLevelMap: Record<number, { label: string; type: TagType }> = {
  [MerchantLevel.DIAMOND]: { label: '钻石', type: 'primary' },
  [MerchantLevel.GOLD]: { label: '黄金', type: 'warning' },
  [MerchantLevel.SILVER]: { label: '白银', type: 'info' },
  [MerchantLevel.BRONZE]: { label: '青铜', type: 'success' }
}

export interface CategoryTreeNode {
  id: number
  name: string
  children?: CategoryTreeNode[]
}

export interface SkuCheckResult {
  unique: boolean
  duplicateGoods?: {
    id: number
    name: string
  }
}

export interface BrandCategoryCheckResult {
  valid: boolean
  authorized: boolean
  message?: string
}


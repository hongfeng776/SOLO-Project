export type TagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

export enum OrderStatus {
  PENDING_PAYMENT = 0,
  PENDING_SHIPMENT = 1,
  SHIPPED = 2,
  COMPLETED = 3,
  CANCELLED = 4
}

export const OrderStatusMap: Record<number, { label: string; type: TagType }> = {
  [OrderStatus.PENDING_PAYMENT]: { label: '待支付', type: 'warning' },
  [OrderStatus.PENDING_SHIPMENT]: { label: '待发货', type: 'primary' },
  [OrderStatus.SHIPPED]: { label: '已发货', type: 'info' },
  [OrderStatus.COMPLETED]: { label: '已完成', type: 'success' },
  [OrderStatus.CANCELLED]: { label: '已取消', type: 'danger' }
}

export enum PayType {
  UNKNOWN = 0,
  WECHAT = 1,
  ALIPAY = 2,
  BANK_CARD = 3
}

export const PayTypeMap: Record<number, string> = {
  [PayType.UNKNOWN]: '未知',
  [PayType.WECHAT]: '微信支付',
  [PayType.ALIPAY]: '支付宝',
  [PayType.BANK_CARD]: '银行卡'
}

export enum ExceptionType {
  PAY_STATUS = 1,
  STOCK_INSUFFICIENT = 2,
  MERCHANT_NO_PERMISSION = 3,
  LOGISTICS_UNSUPPORTED = 4,
  DUPLICATE_ORDER = 5,
  AMOUNT_ABNORMAL = 6,
  OTHER = 7
}

export const ExceptionTypeMap: Record<number, { label: string; type: TagType }> = {
  [ExceptionType.PAY_STATUS]: { label: '支付状态异常', type: 'danger' },
  [ExceptionType.STOCK_INSUFFICIENT]: { label: '库存不足', type: 'warning' },
  [ExceptionType.MERCHANT_NO_PERMISSION]: { label: '商家无权限', type: 'danger' },
  [ExceptionType.LOGISTICS_UNSUPPORTED]: { label: '物流不支持', type: 'warning' },
  [ExceptionType.DUPLICATE_ORDER]: { label: '重复订单', type: 'danger' },
  [ExceptionType.AMOUNT_ABNORMAL]: { label: '金额异常', type: 'warning' },
  [ExceptionType.OTHER]: { label: '其他异常', type: 'info' }
}

export enum ExceptionStatus {
  PENDING = 0,
  PROCESSING = 1,
  HANDLED = 2,
  IGNORED = 3
}

export const ExceptionStatusMap: Record<number, { label: string; type: TagType }> = {
  [ExceptionStatus.PENDING]: { label: '待处理', type: 'warning' },
  [ExceptionStatus.PROCESSING]: { label: '处理中', type: 'primary' },
  [ExceptionStatus.HANDLED]: { label: '已处理', type: 'success' },
  [ExceptionStatus.IGNORED]: { label: '已忽略', type: 'info' }
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
  NORMAL = 1,
  FROZEN = 2,
  CANCELED = 3
}

export const UserStatusMap: Record<number, { label: string; type: TagType }> = {
  [UserStatus.NORMAL]: { label: '正常', type: 'success' },
  [UserStatus.FROZEN]: { label: '冻结', type: 'warning' },
  [UserStatus.CANCELED]: { label: '注销', type: 'info' }
}

export enum UserLevel {
  NORMAL = 1,
  SILVER = 2,
  GOLD = 3,
  DIAMOND = 4,
  PLATINUM = 5
}

export const UserLevelMap: Record<number, { label: string; type: TagType }> = {
  [UserLevel.NORMAL]: { label: '普通', type: 'info' },
  [UserLevel.SILVER]: { label: '银卡', type: 'primary' },
  [UserLevel.GOLD]: { label: '金卡', type: 'warning' },
  [UserLevel.DIAMOND]: { label: '钻石', type: 'success' },
  [UserLevel.PLATINUM]: { label: '至尊', type: 'danger' }
}

export enum Gender {
  UNKNOWN = 0,
  MALE = 1,
  FEMALE = 2
}

export const GenderMap: Record<number, string> = {
  [Gender.UNKNOWN]: '未知',
  [Gender.MALE]: '男',
  [Gender.FEMALE]: '女'
}

export enum UserRiskLevel {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2
}

export const UserRiskLevelMap: Record<number, { label: string; type: TagType }> = {
  [UserRiskLevel.LOW]: { label: '低', type: 'success' },
  [UserRiskLevel.MEDIUM]: { label: '中', type: 'warning' },
  [UserRiskLevel.HIGH]: { label: '高', type: 'danger' }
}

export interface RegisterChannel {
  id: number
  code: string
  name: string
  status: number
}

export interface EditFieldPermission {
  field: string
  label: string
  editable: boolean
  readonlyReason?: string
}

export interface UserEditPermission {
  canEdit: boolean
  reason?: string
  editableFields: EditFieldPermission[]
}

export interface UserProfileLog {
  id: number
  userId: number
  field: string
  fieldName: string
  oldValue: string
  newValue: string
  operatorId: number
  operatorName: string
  operateTime: string
  operateIp: string
  remark?: string
}

export interface UserLoginTrace {
  id: number
  userId: number
  loginTime: string
  loginIp: string
  loginLocation?: string
  device?: string
  browser?: string
  status: number
  failReason?: string
}

export interface UserConsumptionLedger {
  id: number
  userId: number
  orderId: number
  orderNo: string
  amount: number
  payType: number
  payTime: string
  status: number
  remark?: string
}

export interface UserRegisterLog {
  id: number
  userId: number
  registerTime: string
  registerIp: string
  registerLocation?: string
  registerChannel: string
  device?: string
  source?: string
}

export interface ComplianceIssue {
  type: 'duplicate' | 'fake' | 'risk' | 'incomplete'
  level: 'low' | 'medium' | 'high'
  field: string
  message: string
  suggestion?: string
}

export interface ComplianceCheckResult {
  passed: boolean
  score: number
  issues: ComplianceIssue[]
}

export interface UserTraceInfo {
  registerLog?: UserRegisterLog
  profileLogs: UserProfileLog[]
  loginTraces: UserLoginTrace[]
  consumptionLedgers: UserConsumptionLedger[]
  complianceCheck: ComplianceCheckResult
}

export interface UserStatistic {
  id: number
  statDate: string
  totalUsers: number
  newUsers: number
  activeUsers: number
  frozenUsers: number
  canceledUsers: number
  totalAmount: number
  totalOrders: number
  createdAt: string
  updatedAt: string
}

export const REGEX_PATTERNS = {
  PHONE: /^1[3-9]\d{9}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  ID_CARD: /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/
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

export interface CategoryTree {
  id: number
  parentId: number | null
  name: string
  code: string
  level: number
  sort: number
  status: number
  icon?: string
  children: CategoryTree[]
  productCount?: number
  hasChildren?: boolean
  requiredFieldsJson?: string
  complianceRulesJson?: string
}

export interface CategoryCreateData {
  parentId?: number
  name: string
  code: string
  icon?: string
  sort?: number
  status?: number
  requiredFieldsJson?: string
  complianceRulesJson?: string
  levelLimit?: number
}

export interface CategoryUpdateData {
  name?: string
  code?: string
  parentId?: number | null
  icon?: string
  sort?: number
  status?: number
  requiredFieldsJson?: string
}

export interface QualificationRule {
  level: number
  title: string
  required: boolean
  fields: string[]
}

export interface ValidateCreateResult {
  valid: boolean
  errors: ValidateError[]
  canSubmit: boolean
  levelRules: QualificationRule[]
}

export interface EditPermissionType {
  type: 'empty' | 'hasProducts'
  productCount: number
  needConfirm: boolean
  confirmTips: string
}

export interface BatchProgressEvent {
  total: number
  success: number
  fail: number
  percent: number
  currentItem?: string
}

export interface TimelineItem {
  id: number
  timestamp: string
  title: string
  content?: string
  operator?: string
  type?: 'primary' | 'success' | 'warning' | 'danger' | 'info'
}

export interface PermissionConfig {
  id: number
  roleId: number
  roleName: string
  permission: string
  permissionName: string
  enabled: boolean
}

export interface CategoryFullTrace {
  basicInfo: CategoryTree
  hierarchyLogs: TimelineItem[]
  productStats: {
    count: number
    topGoods: {
      id: number
      name: string
      sales: number
      price: number
      coverImage?: string
    }[]
  }
  permissionConfigs: PermissionConfig[]
}

export interface CategoryConstraintError {
  code: string
  message: string
}

export enum RoleType {
  SUPER_ADMIN = 1,
  OPERATOR = 2,
  MERCHANT = 3,
  READONLY = 4
}

export const RoleTypeMap: Record<number, { label: string; type: TagType }> = {
  [RoleType.SUPER_ADMIN]: { label: '超级管理员', type: 'danger' },
  [RoleType.OPERATOR]: { label: '普通运维', type: 'primary' },
  [RoleType.MERCHANT]: { label: '商家', type: 'warning' },
  [RoleType.READONLY]: { label: '只读用户', type: 'info' }
}

export type Channel = 'homepage' | 'infopage' | 'special'

export const ChannelMap: Record<Channel, { label: string; type: TagType }> = {
  homepage: { label: '首页', type: 'primary' },
  infopage: { label: '资讯页', type: 'success' },
  special: { label: '专题页', type: 'warning' }
}

export enum ArticleStatus {
  Draft = 0,
  Pending = 1,
  Published = 2,
  Offline = 3,
  Rejected = 4
}

export const ArticleStatusMap: Record<number, { label: string; type: TagType }> = {
  [ArticleStatus.Draft]: { label: '草稿', type: 'info' },
  [ArticleStatus.Pending]: { label: '待审核', type: 'warning' },
  [ArticleStatus.Published]: { label: '已发布', type: 'success' },
  [ArticleStatus.Offline]: { label: '已下架', type: 'danger' },
  [ArticleStatus.Rejected]: { label: '已驳回', type: 'danger' }
}

export interface ArticleInfo {
  id: number
  uniqueCode: string
  title: string
  summary: string
  content: string
  coverImage: string
  images: string[]
  domainCategoryId: number
  domainCategoryName?: string
  channel: Channel
  template: string
  wordCount: number
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  topFlag: boolean
  status: ArticleStatus
  version: string
  topicId?: number
  topicName?: string
  publisherId: number
  publisherName?: string
  publisherType: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
  abilityList?: {
    canEdit: boolean
    canDelete: boolean
    canTop: boolean
    canOffline: boolean
  }
}

export interface ArticleVersion {
  id: number
  articleId: number
  version: string
  title: string
  content: string
  changeLog: string
  editorId: number
  editorName?: string
  editType: 'incremental' | 'full'
  reviewedStatus: 'pending' | 'approved' | 'rejected'
  reviewerId?: number
  reviewerName?: string
  reviewRemark?: string
  reviewedAt?: string
  createdAt: string
}

export interface ArticleTopic {
  id: number
  name: string
  uniqueCode: string
  coverImage: string
  description: string
  bannerImage: string
  resourceSlot: string
  channel: Channel
  sort: number
  status: number
  publishedCount: number
  startDate: string
  endDate: string
}

export interface SensitiveHit {
  word: string
  type: string
  level: 'low' | 'medium' | 'high'
  position: number
  context: string
}

export const SensitiveLevelMap: Record<string, { label: string; type: TagType }> = {
  low: { label: '低风险', type: 'info' },
  medium: { label: '中风险', type: 'warning' },
  high: { label: '高风险', type: 'danger' }
}

export interface ValidateArticleResult {
  valid: boolean
  errors: ValidateError[]
  sensitiveHits: SensitiveHit[]
  templateConfig: Record<string, unknown>
  wordConfig: {
    minWord: number
    maxWord: number
  }
  minWord: number
  maxWord: number
}

export interface EditMode {
  mode: 'draft' | 'published'
  allowIncremental: boolean
  allowFull: boolean
  needReview: boolean
}

export interface BatchOperScope {
  scope: 'self' | 'global'
  allowedChannels: Channel[]
  allowedDomains: number[]
}

export interface ArticleFullTrace {
  basic: ArticleInfo
  versionTimeline: TimelineItem[]
  topicInfo?: ArticleTopic
  reviewTimeline: TimelineItem[]
}

export interface DuplicateCheckResult {
  hasDuplicate: boolean
  titleDupArticles: { id: number; title: string; similarity: number }[]
  contentDupArticles: { id: number; title: string; similarity: number }[]
  similarityReport: {
    titleSimilarity: number
    contentSimilarity: number
    overallSimilarity: number
  }
}

export interface QualityReport {
  qualityScore: number
  dimensions: {
    name: string
    score: number
    maxScore: number
    description: string
  }[]
  warnings: {
    level: 'low' | 'medium' | 'high'
    message: string
    detail?: string
  }[]
  imageChecks?: {
    url: string
    width: number
    height: number
    resolution达标: boolean
  }[]
}

export type RiskLevel = 1 | 2 | 3

export enum AuditStatus {
  DRAFT = 0,
  PENDING_INITIAL = 1,
  INITIAL_REJECTED = 2,
  PENDING_FINAL = 3,
  FINAL_REJECTED = 4,
  SUPPLEMENT_REQUIRED = 5,
  APPROVED = 6,
  FROZEN = 7
}

export const AuditStatusMap: Record<number, { label: string; type: TagType }> = {
  [AuditStatus.DRAFT]: { label: '草稿', type: 'info' },
  [AuditStatus.PENDING_INITIAL]: { label: '待初审', type: 'warning' },
  [AuditStatus.INITIAL_REJECTED]: { label: '初审驳回', type: 'danger' },
  [AuditStatus.PENDING_FINAL]: { label: '待复审', type: 'primary' },
  [AuditStatus.FINAL_REJECTED]: { label: '复审驳回', type: 'danger' },
  [AuditStatus.SUPPLEMENT_REQUIRED]: { label: '待补充', type: 'warning' },
  [AuditStatus.APPROVED]: { label: '已通过', type: 'success' },
  [AuditStatus.FROZEN]: { label: '已冻结', type: 'info' }
}

export const RiskLevelMap: Record<RiskLevel, { label: string; type: TagType }> = {
  1: { label: '低风险', type: 'success' },
  2: { label: '中风险', type: 'warning' },
  3: { label: '高风险', type: 'danger' }
}

export interface AuditMainInfo {
  id: number
  goodsId: number
  auditNo: string
  merchantId: number
  riskLevel: RiskLevel
  merchantCreditScore: number
  status: AuditStatus
  initialReviewerId?: number
  initialResult?: string
  initialRemark?: string
  initialReviewedAt?: string
  finalReviewerId?: number
  finalResult?: string
  finalRemark?: string
  finalReviewedAt?: string
  rejectReasons?: string[]
  supplementDeadline?: string
  supplementCount: number
  submitAt: string
  timeoutHours: number
  timeoutFlag: boolean
}

export interface AuditCheckItem {
  id: number
  auditId: number
  category: string
  itemName: string
  itemCode: string
  checkResult: boolean
  required: boolean
  detail?: string
  suggestion?: string
}

export interface AuditFullTrace {
  submitInfo: {
    auditNo: string
    submitterId: number
    submitAt: string
    riskLevel: RiskLevel
    merchantCreditScore: number
  }
  initialReview?: {
    reviewerId: number
    reviewedAt: string
    result: string
    remark?: string
  }
  finalReview?: {
    reviewerId: number
    reviewedAt: string
    result: string
    remark?: string
    rejectReasons?: string[]
  }
  resubmitTimeline: AuditResubmit[]
  timeoutAlerts: AuditTimeout[]
}

export interface AuditResubmit {
  id: number
  auditId: number
  goodsId: number
  resubmitNo: number
  previousStatus: AuditStatus
  changeFields: string[]
  supplementMaterials: string[]
  submitterId: number
  submitAt: string
}

export interface AuditTimeout {
  id: number
  auditId: number
  goodsId: number
  timeoutType: string
  deadline: string
  actualTime?: string
  status: number
  handlerId?: number
  handleRemark?: string
}

export interface BatchAuditScope {
  scope: 'limited' | 'full'
  maxRiskLevel: RiskLevel
  canFreeze: boolean
  canSupplement: boolean
}

export interface AuditAbility {
  canApprove: boolean
  canReject: boolean
  canSupplement: boolean
  canFreeze: boolean
  reason?: string
}

export interface AuditStats {
  total: number
  byStatus: Record<number, number>
  avgReviewHours: number
  rejectRate: number
  timeoutRate: number
  todayPending: number
}

export interface PreSubmitResult {
  canSubmit: boolean
  conditions: AuditCondition[]
}

export interface AuditCondition {
  category: 'info_complete' | 'qualification' | 'category_compliance' | 'image_text_compliance'
  passed: boolean
  items: AuditCheckItem[]
}

import type { User } from '@/api/user'

export enum PermissionGroup {
  BASIC = 'basic',
  MARKETING = 'marketing',
  ORDER = 'order',
  REVIEW = 'review',
  ACTIVITY = 'activity',
  INFO = 'info'
}

export const PermissionGroupMap: Record<string, { label: string; icon: string; color: string }> = {
  [PermissionGroup.BASIC]: { label: '基础权限', icon: 'Key', color: '#409eff' },
  [PermissionGroup.MARKETING]: { label: '营销权限', icon: 'Present', color: '#67c23a' },
  [PermissionGroup.ORDER]: { label: '订单权限', icon: 'ShoppingCart', color: '#e6a23c' },
  [PermissionGroup.REVIEW]: { label: '评价权限', icon: 'ChatDotRound', color: '#f56c6c' },
  [PermissionGroup.ACTIVITY]: { label: '活动权限', icon: 'Promotion', color: '#909399' },
  [PermissionGroup.INFO]: { label: '信息管理', icon: 'Setting', color: '#8e44ad' }
}

export enum GrantType {
  DEFAULT = 1,
  MANUAL = 2,
  LEVEL_UP = 3,
  ACTIVITY = 4
}

export const GrantTypeMap: Record<number, { label: string; type: TagType }> = {
  [GrantType.DEFAULT]: { label: '默认授予', type: 'info' },
  [GrantType.MANUAL]: { label: '手动授予', type: 'primary' },
  [GrantType.LEVEL_UP]: { label: '升级获得', type: 'success' },
  [GrantType.ACTIVITY]: { label: '活动获得', type: 'warning' }
}

export enum PermissionLogType {
  GRANT = 1,
  REVOKE = 2,
  RESET = 3,
  STATUS_CHANGE = 4,
  BATCH = 5
}

export const PermissionLogTypeMap: Record<number, { label: string; type: TagType }> = {
  [PermissionLogType.GRANT]: { label: '权限授予', type: 'success' },
  [PermissionLogType.REVOKE]: { label: '权限回收', type: 'danger' },
  [PermissionLogType.RESET]: { label: '权限重置', type: 'warning' },
  [PermissionLogType.STATUS_CHANGE]: { label: '状态联动', type: 'info' },
  [PermissionLogType.BATCH]: { label: '批量操作', type: 'primary' }
}

export enum FreezeType {
  NONE = 0,
  TEMPORARY = 1,
  PERMANENT = 2
}

export const FreezeTypeMap: Record<number, { label: string; type: TagType }> = {
  [FreezeType.NONE]: { label: '正常', type: 'success' },
  [FreezeType.TEMPORARY]: { label: '临时冻结', type: 'warning' },
  [FreezeType.PERMANENT]: { label: '永久冻结', type: 'danger' }
}

export enum CancelType {
  NONE = 0,
  VOLUNTARY = 1,
  VIOLATION = 2
}

export const CancelTypeMap: Record<number, { label: string; type: TagType }> = {
  [CancelType.NONE]: { label: '正常', type: 'success' },
  [CancelType.VOLUNTARY]: { label: '主动注销', type: 'info' },
  [CancelType.VIOLATION]: { label: '违规注销', type: 'danger' }
}

export interface SystemPermission {
  id: number
  permissionCode: string
  permissionName: string
  permissionGroup: string
  permissionDesc?: string
  requiredLevel: number
  allowedStatus: string
  allowedRiskLevels: string
  isDefault: number
  isSystem: number
  sortOrder: number
  status: number
  createdAt: string
  updatedAt: string
}

export interface UserPermissionItem {
  id: number
  userId: number
  permissionId: number
  permissionCode: string
  permissionName?: string
  permissionGroup?: string
  grantType: number
  grantedBy?: number
  grantedByName?: string
  grantedTime: string
  expireTime?: string
  status: number
  revokeReason?: string
  revokedBy?: number
  revokedByName?: string
  revokedTime?: string
}

export interface PermissionValidateResult {
  valid: boolean
  errors: string[]
  allowedPermissions: SystemPermission[]
  blockedPermissions: { code: string; name: string; reason: string }[]
  duplicateBindings: string[]
  overLimitPermissions: string[]
}

export interface UserPermissionInfo {
  allPermissions: SystemPermission[]
  groupedPermissions: Record<string, SystemPermission[]>
  grantedList: UserPermissionItem[]
  revokedList: UserPermissionItem[]
  grantedCodes: string[]
  revokedCodes: string[]
  grantedCount: number
  totalCount: number
  permissionVersion: number
}

export interface PermissionGrantResult {
  userId: number
  granted: string[]
  skipped: { code: string; reason: string }[]
  permissionVersion: number
}

export interface PermissionRevokeResult {
  userId: number
  revoked: string[]
  skipped: { code: string; reason: string }[]
  permissionVersion: number
}

export interface PermissionResetResult {
  userId: number
  resetCount: number
  grantedCodes: string[]
  revokedCodes: string[]
  permissionVersion: number
}

export interface StatusChangeResult {
  userId: number
  oldStatus: number
  newStatus: number
  freezeType?: number
  cancelType?: number
  revokedPermissions: string[]
  retainedPermissions: string[]
  permissionVersion: number
  user: User
}

export interface PermissionChangeLog {
  id: number
  userId: number
  username?: string
  logType: number
  permissionCodes?: string
  permissionDetails?: any
  operatorId?: number
  operatorName?: string
  operatorRole?: string
  operateIp?: string
  operateTime: string
  operateScope?: string
  reason?: string
  beforeStatus?: number
  afterStatus?: number
  beforePermissions?: string
  afterPermissions?: string
}

export interface PermissionTraceInfo {
  permissionList: UserPermissionItem[]
  grantRecords: PermissionChangeLog[]
  revokeRecords: PermissionChangeLog[]
  changeLogs: PermissionChangeLog[]
  complianceCheck: PermissionComplianceResult
  summary: {
    totalPermissions: number
    grantedCount: number
    revokedCount: number
    grantCount: number
    changeCount: number
    lastOperateTime?: string
    lastOperator?: string
  }
}

export interface PermissionComplianceResult {
  passed: boolean
  score: number
  issues: { type: string; level: 'low' | 'medium' | 'high'; message: string; permissionCode?: string }[]
  duplicatePermissions: string[]
  overLimitPermissions: { code: string; name: string; requiredLevel: number; userLevel: number }[]
  mismatchedPermissions: { code: string; name: string; reason: string }[]
}

export interface PermissionBatchResult {
  successCount: number
  failCount: number
  failDetails: { id: number; username?: string; message: string }[]
  updatedUsers: User[]
}

// =====================================================
// 物流服务商相关类型定义
// =====================================================

export interface LogisticsProvider {
  id: number
  providerCode: string
  providerName: string
  logo?: string
  level: number
  status: number
  cooperationStatus: number
  cooperationEffectiveDate?: string
  cooperationTerminateDate?: string
  contactPerson?: string
  contactPhone?: string
  contactEmail?: string
  registeredAddress?: string
  creditCode?: string
  businessLicenseNo?: string
  legalPerson?: string
  legalIdCard?: string
  businessLicenseUrl?: string
  licenseValidFrom?: string
  licenseValidTo?: string
  roadTransportLicenseUrl?: string
  roadTransportValidTo?: string
  serviceProvince?: string
  serviceCities?: string
  branchCount: number
  crossProvinceTimeliness?: number
  intraProvinceTimeliness?: number
  firstWeightFee: number
  additionalWeightFee: number
  baseServiceFee: number
  dailyOrderLimit: number
  supportCod: number
  supportColdChain: number
  supportOversized: number
  supportPickup: number
  matchPriority: number
  apiUrl?: string
  apiKey?: string
  apiSecret?: string
  serviceScore?: number
  onTimeRate?: number
  damageRate?: number
  lossRate?: number
  totalOrders: number
  totalAmount: number
  qualificationIntro?: string
  remark?: string
  createdBy?: number
  createdByName?: string
  updatedBy?: number
  updatedByName?: string
  createdAt: string
  updatedAt: string
}

export interface LogisticsProviderFullInfo extends LogisticsProvider {
  qualifications: ProviderQualification[]
  branchNetworks: BranchNetwork[]
  feeStandards: FeeStandard[]
  signContracts: SignContract[]
  feeChangeLogs: FeeChangeLog[]
  serviceEvaluations: ServiceEvaluation[]
  operationLogs: ProviderOperationLog[]
}

export interface ValidationResult {
  valid: boolean
  errorCode?: string
  errorMessage?: string
  field?: string
  suggestions?: string[]
}

export interface ProviderStatistics {
  totalCount: number
  enabledCount: number
  disabledCount: number
  pendingReviewCount: number
  archivedCount: number
  cooperatingCount: number
  avgServiceScore: number
  avgOnTimeRate: number
  levelDistribution: Record<number, number>
  cooperationDistribution: Record<number, number>
  monthlyTrend: Array<{ month: string; newCount: number; activeCount: number }>
}

export interface ProviderEditPermission {
  canEdit: boolean
  lockedFields: string[]
  lockedFieldsReason: Record<string, string>
  coreFields: string[]
  needSecondConfirm: boolean
  cooperationStatus: number
}

export interface ProviderPreCheckReport {
  passed: boolean
  score: number
  level: 'excellent' | 'good' | 'pass' | 'danger'
  blockItems: Array<{ field: string; message: string; severity: 'error' | 'warning' }>
  dimensions: {
    qualification: { passed: boolean; score: number; detail: string }
    coverage: { passed: boolean; score: number; detail: string }
    timeliness: { passed: boolean; score: number; detail: string }
    permission: { passed: boolean; score: number; detail: string }
  }
  blockEnabled: boolean
  blockReason?: string
}

export interface ProviderQualification {
  id: number
  providerId: number
  qualificationType: string
  qualificationName?: string
  certificateNo?: string
  certificateHolder?: string
  certificateFileUrl?: string
  validFrom?: string
  expireDate?: string
  status: number
  auditRemark?: string
  auditedBy?: number
  auditedByName?: string
  auditedAt?: string
  description?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export interface BranchNetwork {
  id: number
  branchCode?: string
  providerId: number
  branchName: string
  branchType?: string
  province?: string
  city?: string
  district?: string
  address?: string
  latitude?: number
  longitude?: number
  managerName?: string
  contactPhone?: string
  contactEmail?: string
  businessHours?: string
  dailyCapacity: number
  coverageRadius: number
  status: number
  servicePriority: number
  serviceScope?: string
  remark?: string
  createdBy?: number
  createdByName?: string
  createdAt: string
  updatedAt: string
}

export interface FeeStandard {
  id: number
  providerId: number
  feeType: string
  feeName?: string
  fromProvince?: string
  fromCity?: string
  toProvince?: string
  toCity?: string
  weightUnit: string
  firstWeight: number
  firstWeightFee: number
  additionalWeightStep: number
  additionalWeightFee: number
  baseServiceFee: number
  minFee: number
  maxFee?: number
  volumeWeightRatio?: number
  standardTimeliness: number
  effectiveDate?: string
  expiryDate?: string
  status: number
  isDefault: number
  ruleDescription?: string
  remark?: string
  createdBy?: number
  createdByName?: string
  updatedBy?: number
  updatedByName?: string
  createdAt: string
  updatedAt: string
}

export interface SignContract {
  id: number
  contractNo?: string
  providerId: number
  contractName: string
  contractType: string
  contractFileUrl?: string
  partyASignatory?: string
  partyASignDate?: string
  partyBSignatory?: string
  partyBSignDate?: string
  effectiveDate?: string
  expiryDate?: string
  contractAmount?: number
  slaLevel?: number
  compensationLimit?: number
  status: number
  contractSummary?: string
  terminationReason?: string
  actualTerminationDate?: string
  createdBy?: number
  createdByName?: string
  approvedBy?: number
  approvedByName?: string
  approvedAt?: string
  createdAt: string
  updatedAt: string
}

export interface FeeChangeLog {
  id: number
  logNo?: string
  providerId: number
  feeStandardId?: number
  changeType: string
  feeName?: string
  beforeData?: any
  afterData?: any
  changeReason?: string
  isViolation: number
  violationRemark?: string
  operatorId?: number
  operatorName?: string
  confirmedBy?: number
  confirmedByName?: string
  confirmedAt?: string
  createdAt: string
}

export interface ServiceEvaluation {
  id: number
  evaluationNo?: string
  providerId: number
  orderId?: number
  orderNo?: string
  shipmentId?: number
  evaluationType?: string
  rating: number
  timelinessScore?: number
  hasDamage: number
  hasLoss: number
  compensationAmount?: number
  content?: string
  imageUrls?: string
  evaluatorId?: number
  evaluatorName?: string
  evaluatorType: number
  isAppealed: number
  appealResult?: string
  appealHandledAt?: string
  createdAt: string
}

export interface ProviderOperationLog {
  id: number
  providerId: number
  changeType: string
  changeTitle?: string
  beforeData?: any
  afterData?: any
  changeDetail?: string
  changeReason?: string
  isCoreChange: number
  confirmedBy?: number
  confirmedByName?: string
  confirmedAt?: string
  operatorId?: number
  operatorName?: string
  operatorRole?: string
  createdAt: string
}

export interface ProviderTraceSummary {
  qualificationStats: {
    total: number
    valid: number
    expired: number
    pending: number
    expiringSoon: number
    invalid: number
  }
  contractStats: {
    total: number
    effective: number
    pending: number
    expired: number
    terminated: number
  }
  feeStats: {
    total: number
    active: number
    violations: number
    changeCount: number
  }
  evaluationStats: {
    total: number
    avgRating: number
    avgTimelinessScore: number
    damageCount: number
    lossCount: number
    compensationTotal: number
    qualityScore: number
  }
  complianceReport: {
    totalScore: number
    level: 'excellent' | 'good' | 'pass' | 'danger'
    issues: Array<{ dimension: string; score: number; problem: string; suggestion: string }>
  }
}

export interface FullProviderTrace extends ProviderTraceSummary {
  basicInfo: LogisticsProvider | null
  qualifications: ProviderQualification[]
  contracts: SignContract[]
  feeChangeLogs: FeeChangeLog[]
  evaluations: ServiceEvaluation[]
  operationLogs: ProviderOperationLog[]
  feeStandards: FeeStandard[]
}

// =====================================================
// 物流链路监控相关类型定义
// =====================================================

export interface MatchStep {
  step: string
  name: string
  status: string
  progress: number
  message: string
  started_at?: string
  completed_at?: string
  data?: any
}

export interface MatchProgress {
  steps: MatchStep[]
  status: number
}

export interface AddressInfo {
  province: string
  city: string
  district: string
  address: string
  longitude?: number
  latitude?: number
  is_remote?: boolean
}

export interface ProductInfo {
  product_id: number
  product_name: string
  category_id: number
  category_name: string
  weight: number
  volume: number
  is_forbidden?: boolean
  forbidden_reason?: string
}

export interface MatchedProvider {
  provider_id: number
  provider_name: string
  provider_code: string
  score: number
  estimated_days: number
  cost: number
  coverage_area: string
}

export interface AlternativeSolution {
  type: string
  title: string
  description: string
  extra_cost?: number
  extra_days?: number
}

export interface LinkMatchResult {
  id: number
  match_no: string
  order_id: number
  order_no: string
  status: number
  block_reason?: string
  address_info: AddressInfo
  product_info: ProductInfo[]
  matched_providers: MatchedProvider[]
  alternative_solutions: AlternativeSolution[]
  selected_provider_id?: number
  selected_provider_name?: string
  cost_time_ms?: number
  created_by?: number
  created_by_name?: string
  created_at: string
  updated_at: string
}

export interface AbnormalDetectionRule {
  id: number
  rule_code: string
  rule_name: string
  detection_type: string
  scene: string
  status: number
  priority: number
  alert_level: number
  detection_params?: any
  description?: string
  auto_create_work_order: boolean
  auto_notify_user: boolean
  auto_sync_order_status: boolean
  sla_response_minutes: number
  created_by?: number
  created_by_name?: string
  created_at: string
  updated_at: string
}

export interface AbnormalDetectionResult {
  abnormal_detected: boolean
  abnormal_log?: any
  work_order?: any
}

export interface ProcessAbnormalParams {
  abnormal_log_id: number
  process_type: string
  process_remark: string
}

export interface BatchOperationPermission {
  can_mark_abnormal: boolean
  can_launch_verify: boolean
  can_sync_status: boolean
  can_update_track: boolean
  can_resend_notification: boolean
}

export interface ShipmentQueryParams {
  track_status?: number
  provider_id?: number
  sign_start_time?: string
  sign_end_time?: string
  logistics_no?: string
  order_no?: string
  is_abnormal?: number
  page?: number
  page_size?: number
}

export interface ShipmentListItem {
  id: number
  shipment_no: string
  logistics_no: string
  provider_id: number
  order_id: number
  ship_time?: string
  sign_time?: string
  is_abnormal: number
  created_at: string
  updated_at: string
  latest_track?: {
    id: number
    track_status: number
    track_content: string
    track_time: string
    is_abnormal: number
  }
  abnormal_count: number
  work_order_count: number
  order_info?: {
    id: number
    order_no: string
    user_name: string
    receiver_name: string
    receiver_phone: string
    receiver_address: string
  }
  provider_info?: {
    id: number
    provider_code: string
    company_name: string
    service_phone: string
  }
}

export interface BatchOperationResult {
  total: number
  success: number
  failed: number
  results: Array<{
    id: number
    success: boolean
    error?: string
    data?: any
  }>
}

export interface LinkNodeExtension {
  id: number
  track_id: number
  shipment_id: number
  logistics_no: string
  node_hash: string
  node_time: string
  province?: string
  city?: string
  district?: string
  address?: string
  latitude?: number
  longitude?: number
  operator_name?: string
  operator_phone?: string
  operator_id?: number
  operator_employee_id?: string
  branch_name?: string
  branch_code?: string
  verification_status: number
  verification_remark?: string
  verified_by?: number
  verified_by_name?: string
  verified_at?: string
  is_backfilled: boolean
  is_abnormal: boolean
  abnormal_type?: string
  abnormal_desc?: string
  extra?: any
  remark?: string
  source?: string
  created_at: string
  updated_at: string
}

export interface TrackNodeDetail {
  id: number
  track_id: number
  track_time: string
  track_status: number
  track_content: string
  is_abnormal: boolean
  abnormal_type?: string
  abnormal_desc?: string
  operator_name?: string
  operator_phone?: string
  operator_id?: number
  province?: string
  city?: string
  district?: string
  address?: string
  latitude?: number
  longitude?: number
  branch_name?: string
  branch_code?: string
  verification_status?: number
  created_at: string
  created_by_name?: string
  source?: string
  is_backfilled?: boolean
  hash?: string
  time_gap_hours?: number
  distance_from_last?: number
  is_suspicious?: boolean
  suspicious_reason?: string
}

export interface LinkIntegrityReport {
  total_nodes: number
  expected_nodes: number
  missing_nodes: string[]
  duplicate_nodes: number
  fake_nodes: number
  suspicious_nodes: number
  integrity_score: number
  is_complete: boolean
  issues: string[]
  recommendations: string[]
}

export interface FullLinkTrace {
  shipment_info: any
  order_info: any
  provider_info: any
  track_nodes: TrackNodeDetail[]
  abnormal_records: any[]
  work_orders: any[]
  operation_logs: any[]
  integrity_report: LinkIntegrityReport
}

export interface VerifyNodeParams {
  node_extension_id: number
  verification_status: number
  verification_remark: string
}

export interface AddNodeExtensionParams {
  track_id: number
  province?: string
  city?: string
  district?: string
  address?: string
  latitude?: number
  longitude?: number
  operator_name?: string
  operator_phone?: string
  branch_name?: string
  branch_code?: string
  remark?: string
}

export interface WorkOrderItem {
  id: number
  work_order_no: string
  shipment_id: number
  shipment_no: string
  order_id: number
  order_no: string
  abnormal_log_id?: number
  type: number
  title: string
  description?: string
  priority: number
  status: number
  resolution?: string
  sla_expire_at?: string
  assigned_to?: number
  assigned_to_name?: string
  assigned_at?: string
  handled_by?: number
  handled_by_name?: string
  started_at?: string
  resolved_at?: string
  created_by?: number
  created_by_name?: string
  source?: string
  remark?: string
  created_at: string
  updated_at: string
}

export enum WorkOrderType {
  ABNORMAL = 1,
  VERIFY = 2,
  INTERCEPT = 3,
  MANUAL_SYNC = 4,
  COMPLAINT = 5,
}

export const WorkOrderTypeMap: Record<number, { label: string; type: string }> = {
  [WorkOrderType.ABNORMAL]: { label: '异常处理', type: 'danger' },
  [WorkOrderType.VERIFY]: { label: '物流核查', type: 'warning' },
  [WorkOrderType.INTERCEPT]: { label: '订单拦截', type: 'warning' },
  [WorkOrderType.MANUAL_SYNC]: { label: '手动同步', type: 'primary' },
  [WorkOrderType.COMPLAINT]: { label: '用户投诉', type: 'danger' },
}

export enum WorkOrderPriority {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3,
  URGENT = 4,
}

export const WorkOrderPriorityMap: Record<number, { label: string; type: string }> = {
  [WorkOrderPriority.LOW]: { label: '低', type: 'info' },
  [WorkOrderPriority.MEDIUM]: { label: '中', type: 'warning' },
  [WorkOrderPriority.HIGH]: { label: '高', type: 'danger' },
  [WorkOrderPriority.URGENT]: { label: '紧急', type: 'danger' },
}

export enum WorkOrderStatus {
  PENDING = 0,
  PROCESSING = 1,
  PENDING_USER_CONFIRM = 2,
  RESOLVED = 3,
  CLOSED = 4,
  ESCALATED = 5,
}

export const WorkOrderStatusMap: Record<number, { label: string; type: string }> = {
  [WorkOrderStatus.PENDING]: { label: '待处理', type: 'info' },
  [WorkOrderStatus.PROCESSING]: { label: '处理中', type: 'primary' },
  [WorkOrderStatus.PENDING_USER_CONFIRM]: { label: '待用户确认', type: 'warning' },
  [WorkOrderStatus.RESOLVED]: { label: '已解决', type: 'success' },
  [WorkOrderStatus.CLOSED]: { label: '已关闭', type: 'info' },
  [WorkOrderStatus.ESCALATED]: { label: '已升级', type: 'danger' },
}


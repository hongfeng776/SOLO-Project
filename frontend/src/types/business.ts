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

export enum MarketingStatus {
  PENDING = 0,
  ONGOING = 1,
  ENDED = 2,
  OFFLINE = 3
}

export interface Marketing {
  id: number
  name: string
  type: number
  typeName?: string
  status: number
  startTime: string
  endTime: string
  discountType: number
  discountValue: number
  minAmount: number
  maxDiscount: number
  totalCount: number
  usedCount: number
  perUserLimit: number
  description: string
  categoryIds?: string
  merchantIds?: string
  isViolation?: number
  violationRemark?: string
  auditStatus?: number
  createUserId?: number
  createdAt: string
  updatedAt: string
}

export const MarketingStatusMap: Record<number, { label: string; type: TagType }> = {
  [MarketingStatus.PENDING]: { label: '未开始', type: 'info' },
  [MarketingStatus.ONGOING]: { label: '进行中', type: 'success' },
  [MarketingStatus.ENDED]: { label: '已结束', type: 'warning' },
  [MarketingStatus.OFFLINE]: { label: '已下架', type: 'danger' }
}

export enum DiscountType {
  FULL_REDUCTION = 1,
  DISCOUNT = 2,
  COUPON = 3,
  FIXED = 1,
  RATE = 2
}

export const DiscountTypeMap: Record<number, { label: string; type: TagType }> = {
  [DiscountType.FULL_REDUCTION]: { label: '满减', type: 'danger' },
  [DiscountType.DISCOUNT]: { label: '折扣', type: 'warning' },
  [DiscountType.COUPON]: { label: '优惠券', type: 'success' }
}

export interface MarketingValidateError {
  field?: string
  message: string
  code: string
}

export interface MarketingValidateResult {
  valid: boolean
  errors: MarketingValidateError[]
  warnings: MarketingValidateError[]
}

export interface EditPermissions {
  canEditBasic: boolean
  canEditTime: boolean
  canEditDiscount: boolean
  canEditProducts: boolean
  canEditMerchants: boolean
  canEditCategories: boolean
  canEditStatus: boolean
}

export interface BatchOperationResult {
  success: number
  failed: number
  total: number
  errors: Array<{ id: number; message: string }>
}

export interface MarketingLog {
  id: number
  marketingId: number
  operatorId?: number
  operatorType: number
  operatorName?: string
  action: string
  fieldName?: string
  oldValue?: string
  newValue?: string
  remark?: string
  createdAt: string
}

export interface MarketingProduct {
  id: number
  marketingId: number
  goodsId: number
  goodsName: string
  categoryId?: number
  merchantId?: number
  originalPrice?: number
  activityPrice?: number
  stock?: number
  soldCount?: number
  status?: number
  admissionStatus?: number
  auditUserId?: number
  auditTime?: string
  auditRemark?: string
  applyTime?: string
  complianceRating?: number
  merchantCreditScore?: number
  sortOrder?: number
  createdAt: string
  updatedAt?: string
}

export interface MarketingTraceData {
  basicInfo: any
  createLogs: MarketingLog[]
  updateLogs: MarketingLog[]
  auditLogs: MarketingLog[]
  statusLogs: MarketingLog[]
  products: MarketingProduct[]
  merchantQualifications: any[]
  allLogs: MarketingLog[]
}

export interface DuplicateActivity {
  id: number
  name: string
  startTime: string
  endTime: string
  status: number
  duplicateReason: string
}

export interface DuplicateCheckResult {
  isDuplicate: boolean
  duplicateActivities: DuplicateActivity[]
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

export enum MarketingProductAdmissionStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  OFFLINE = 3
}

export const MarketingProductAdmissionStatusMap: Record<number, { label: string; type: TagType }> = {
  [MarketingProductAdmissionStatus.PENDING]: { label: '审核中', type: 'warning' },
  [MarketingProductAdmissionStatus.APPROVED]: { label: '准入通过', type: 'success' },
  [MarketingProductAdmissionStatus.REJECTED]: { label: '准入驳回', type: 'danger' },
  [MarketingProductAdmissionStatus.OFFLINE]: { label: '活动下架', type: 'info' }
}

export interface AdmissionValidateError {
  field: string
  message: string
  ruleType: string
  level: 'error' | 'warning'
}

export interface AdmissionValidateResult {
  passed: boolean
  errors: AdmissionValidateError[]
  warnings: AdmissionValidateError[]
  matchedRules: number[]
  ruleMatchDetails: AdmissionRuleMatchDetail[]
}

export interface AdmissionRuleMatchDetail {
  ruleId: number
  ruleName: string
  ruleType: string
  passed: boolean
  message: string
}

export interface MarketingProductAdmissionLog {
  id: number
  marketingProductId: number
  marketingId: number
  goodsId: number
  operatorId?: number
  operatorType: number
  operatorName?: string
  action: string
  oldStatus?: number
  newStatus?: number
  fieldName?: string
  oldValue?: string
  newValue?: string
  remark?: string
  ruleMatchDetail?: AdmissionRuleMatchDetail[]
  createdAt: string
}

export interface AdmissionTraceData {
  basicInfo: MarketingProduct | null
  goodsInfo: any
  marketingInfo: any
  merchantInfo: any
  admissionLogs: MarketingProductAdmissionLog[]
  ruleMatchDetails: AdmissionRuleMatchDetail[]
  applyInfo: {
    applyTime?: string
    applySource?: string
    applyOperator?: string
  }
  auditInfo: {
    auditUserId?: number
    auditUserName?: string
    auditTime?: string
    auditRemark?: string
    auditStatus?: number
    auditLogs: MarketingProductAdmissionLog[]
  }
  activityRecords: any[]
  duplicateCheck: DuplicateApplyCheckResult
  crossCategoryCheck: CrossCategoryCheckResult
}

export interface AdmissionRule {
  id: number
  ruleName: string
  ruleType: string
  description: string
  sortOrder: number
}

export interface DuplicateApplyCheckResult {
  isDuplicate: boolean
  duplicateGoods: { goodsId: number; goodsName: string; admissionStatus: number }[]
  message: string
}

export interface CrossCategoryCheckResult {
  isViolation: boolean
  violationGoods: { goodsId: number; goodsName: string; categoryId?: number }[]
  message: string
  marketingCategoryIds?: string
}

export interface ApplyResult {
  goodsId: number
  passed: boolean
  message: string
}

export interface BatchApplyResult {
  success: number
  failed: number
  results: ApplyResult[]
}

export interface BatchImportResult {
  total: number
  success: number
  failed: number
  results: { goodsId: number; goodsName?: string; success: boolean; message: string }[]
}

export enum DiscountEffectiveStatus {
  NOT_ACTIVE = 0,
  ACTIVE = 1,
  EXPIRED = 2,
  DISABLED = 3
}

export const DiscountEffectiveStatusMap: Record<number, { label: string; type: TagType }> = {
  [DiscountEffectiveStatus.NOT_ACTIVE]: { label: '未生效', type: 'info' },
  [DiscountEffectiveStatus.ACTIVE]: { label: '生效中', type: 'success' },
  [DiscountEffectiveStatus.EXPIRED]: { label: '已失效', type: 'info' },
  [DiscountEffectiveStatus.DISABLED]: { label: '已禁用', type: 'danger' }
}

export enum BudgetLedgerType {
  ALLOCATE = 1,
  CONSUME = 2,
  REFUND = 3,
  ADJUST = 4
}

export const BudgetLedgerTypeMap: Record<number, { label: string; type: TagType }> = {
  [BudgetLedgerType.ALLOCATE]: { label: '预算划拨', type: 'primary' },
  [BudgetLedgerType.CONSUME]: { label: '优惠消耗', type: 'danger' },
  [BudgetLedgerType.REFUND]: { label: '预算退回', type: 'success' },
  [BudgetLedgerType.ADJUST]: { label: '预算调整', type: 'warning' }
}

export enum StackConflictType {
  MUTEX_RULE = 1,
  OVER_LIMIT = 2,
  CATEGORY_CONFLICT = 3,
  BUDGET_CONFLICT = 4
}

export const StackConflictTypeMap: Record<number, { label: string; type: TagType }> = {
  [StackConflictType.MUTEX_RULE]: { label: '互斥规则', type: 'danger' },
  [StackConflictType.OVER_LIMIT]: { label: '超限叠加', type: 'warning' },
  [StackConflictType.CATEGORY_CONFLICT]: { label: '类目冲突', type: 'danger' },
  [StackConflictType.BUDGET_CONFLICT]: { label: '预算冲突', type: 'warning' }
}

export interface MarketingDiscountRule {
  id: number
  marketingId: number
  ruleName: string
  discountType: number
  minAmount: number
  discountValue: number
  maxDiscountAmount?: number
  stackable: number
  stackLimit: number
  excludeRuleIds?: string
  userLevelMin: number
  userLevelMax: number
  applicableCategoryIds?: string
  excludeCategoryIds?: string
  applicableGoodsIds?: string
  excludeGoodsIds?: string
  budgetTotal: number
  budgetUsed: number
  quotaTotal: number
  quotaUsed: number
  quotaPerUser: number
  effectiveStatus: number
  startTime: string
  endTime: string
  sortOrder: number
  operatorId?: number
  operatorName?: string
  remark?: string
  createdTime: string
  updatedTime: string
}

export interface DiscountRuleForm {
  id?: number
  marketingId: number
  ruleName: string
  discountType: number
  minAmount: number
  discountValue: number
  maxDiscountAmount?: number
  stackable: number
  stackLimit: number
  excludeRuleIds?: number[]
  userLevelMin: number
  userLevelMax: number
  applicableCategoryIds?: number[]
  excludeCategoryIds?: number[]
  applicableGoodsIds?: number[]
  excludeGoodsIds?: number[]
  budgetTotal: number
  quotaTotal: number
  quotaPerUser: number
  startTime: string
  endTime: string
  sortOrder: number
  remark?: string
}

export interface DiscountValidateError {
  field: string
  message: string
  level: 'error' | 'warning'
}

export interface DiscountRuleCombination {
  ruleIds: number[]
  ruleNames: string[]
  totalDiscount: number
  originalAmount: number
  finalAmount: number
  description: string
}

export interface DiscountValidateResult {
  passed: boolean
  errors: DiscountValidateError[]
  warnings: DiscountValidateError[]
  optimalCombination?: DiscountRuleCombination
  budgetHint?: string
}

export interface MarketingDiscountRuleLog {
  id: number
  ruleId: number
  operatorId: number
  operatorName: string
  operationType: number
  beforeContent?: string
  afterContent?: string
  remark?: string
  createdTime: string
}

export interface MarketingDiscountUsageRecord {
  id: number
  ruleId: number
  userId: number
  userName?: string
  orderId: number
  orderNo: string
  originalAmount: number
  discountAmount: number
  finalAmount: number
  stackRuleIds?: string
  createdTime: string
}

export interface MarketingDiscountStackConflict {
  id: number
  ruleIdA: number
  ruleIdB: number
  conflictType: number
  description: string
  userId?: number
  orderId?: number
  resolved: number
  createdTime: string
}

export interface MarketingDiscountBudgetLedger {
  id: number
  ruleId: number
  marketingId: number
  ledgerType: number
  amount: number
  beforeAmount: number
  afterAmount: number
  orderId?: number
  orderNo?: string
  operatorId?: number
  operatorName?: string
  remark?: string
  createdTime: string
}

export interface DiscountRuleMatchDetail {
  field: string
  ruleValue: string
  passed: boolean
  description: string
}

export interface DiscountRuleTraceData {
  basicInfo: MarketingDiscountRule
  configLogs: MarketingDiscountRuleLog[]
  usageRecords: MarketingDiscountUsageRecord[]
  stackConflicts: MarketingDiscountStackConflict[]
  budgetLedger: MarketingDiscountBudgetLedger[]
  usageStats: {
    totalUsed: number
    totalDiscountAmount: number
    budgetUsageRate: number
    quotaUsageRate: number
  }
  ruleMatchDetails: DiscountRuleMatchDetail[]
}

export interface DiscountBatchResult {
  success: number
  failed: number
  total: number
  results: {
    id: number
    ruleName?: string
    success: boolean
    message: string
  }[]
}


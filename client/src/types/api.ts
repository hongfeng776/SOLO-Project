export interface IApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: string
}

export interface IPaginatedData<T = any> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

export interface ILoginParams {
  username: string
  password: string
}

export interface ILoginResult {
  accessToken: string
  refreshToken: string
}

export interface IUserInfo {
  id: number
  username: string
  realName: string
  phone: string
  email: string
  status: number
  roles: IRole[]
  permissions: string[]
  lastLoginTime: string
  lastLoginIp: string
  createdAt: string
  updatedAt: string
}

export interface IRole {
  id: number
  roleName: string
  roleCode: string
  description: string
  status: number
  createdAt: string
  updatedAt: string
}

export interface IPermission {
  id: number
  permName: string
  permCode: string
  permType: string
  parentId: number | null
  path: string
  icon: string
  sortOrder: number
  status: number
  children?: IPermission[]
  createdAt: string
  updatedAt: string
}

export interface IStockQuote {
  id: number
  stockCode: string
  stockName: string
  market: string
  currentPrice: number
  changeAmount: number
  changeRate: number
  openPrice: number
  closePrice: number
  highPrice: number
  lowPrice: number
  volume: number
  turnover: number
  amplitude: number
  peRatio: number
  pbRatio: number
  totalMarketCap: number
  circulateMarketCap: number
  tradeDate: string
}

export interface IAssetProduct {
  id: number
  productCode: string
  productName: string
  productType: string
  riskLevel: string
  nav: number
  accNav: number
  dailyYield: number
  annualYield: number
  productStatus: string
  minAmount: number
  maxAmount: number
  manager: string
  custodian: string
  raiseStartDate: string
  raiseEndDate: string
  maturityDate: string
  productDesc: string
}

export interface ICustomerAsset {
  id: number
  customerName: string
  idCard: string
  phone: string
  totalAsset: number
  availableAmount: number
  frozenAmount: number
  totalProfit: number
  totalCost: number
  riskLevel: string
  customerType: string
  status: string
  createdAt: string
}

export interface IFundFlow {
  id: number
  flowNo: string
  customerId: number
  assetId: number
  flowType: string
  amount: number
  balanceAfter: number
  flowStatus: string
  channel: string
  remark: string
  tradeTime: string
}

export interface IComplianceAudit {
  id: number
  auditNo: string
  auditType: string
  auditStatus: string
  targetType: string
  targetId: number
  riskScore: number
  auditorId: number | null
  auditOpinion: string
  auditAt: string | null
}

export interface IPageParams {
  page: number
  pageSize: number
}

export interface ITrade {
  id: number
  tradeNo: string
  customerId: number
  customerName?: string
  stockId: number
  stockCode: string
  stockName: string
  tradeType: string
  tradePrice: number
  tradeQuantity: number
  tradeAmount: number
  commission: number
  stampTax: number
  totalFee: number
  tradeStatus: string
  auditRequired: boolean
  auditorId: number | null
  auditOpinion: string
  auditAt: string | null
  orderAt: string
  dealAt: string | null
  remark: string
  createdAt: string
}

export interface ICustomerHolding {
  id: number
  customerId: number
  customerName?: string
  stockId: number
  stockCode: string
  stockName: string
  totalQuantity: number
  availableQuantity: number
  frozenQuantity: number
  costPrice: number
  totalCost: number
  currentPrice: number
  marketValue: number
  floatingProfit: number
  floatingProfitRate: number
  firstBuyDate: string
  lastTradeDate: string | null
}

export interface IRiskAlert {
  id: number
  alertNo: string
  alertType: string
  alertLevel: string
  alertStatus: string
  customerId: number | null
  customerName?: string
  stockId: number | null
  stockCode?: string
  stockName?: string
  tradeId: number | null
  title: string
  content: string
  riskScore: number
  relatedData?: Record<string, any>
  handlerId: number | null
  handleOpinion: string
  handleAt: string | null
  createdAt: string
}

export interface IOperationLog {
  id: number
  logType: string
  userId: number | null
  username: string
  module: string
  action: string
  targetType: string | null
  targetId: number | null
  requestParams?: Record<string, any>
  responseData?: Record<string, any>
  ipAddress: string
  userAgent: string
  status: string
  errorMessage: string
  durationMs: number
  createdAt: string
}

export interface IDashboardStats {
  totalAsset: number
  todayTradeAmount: number
  customerCount: number
  productCount: number
  pendingAuditCount: number
  pendingAlertCount: number
}

export interface IAssetTrend {
  date: string
  totalAsset: number
  tradeAmount: number
  customerCount: number
}

export interface ITradeCreateParams {
  customerId: number
  stockId: number
  tradeType: string
  tradePrice: number
  tradeQuantity: number
  remark?: string
}

export interface ICustomer {
  id: number
  customerName: string
  customerCode?: string
  phone?: string
  status?: string
}

export interface IHoldingDetail {
  id: number
  holdingId: number
  tradeId: number | null
  tradeNo?: string
  tradeType: string
  tradePrice: number
  tradeQuantity: number
  tradeAmount: number
  balanceQuantity: number
  costPriceAfter: number
  tradeAt: string
  createdAt: string
}

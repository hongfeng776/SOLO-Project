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

export interface IApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface IPaginatedData<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface IPaginatedResponse<T = unknown> {
  code: number;
  message: string;
  data: IPaginatedData<T>;
  timestamp: string;
}

export interface IJwtPayload {
  userId: number;
  username: string;
  roles: string[];
}

export interface ILoginParams {
  username: string;
  password: string;
}

export interface IUserInfo {
  id: number;
  username: string;
  realName: string;
  phone: string;
  email: string;
  avatar: string;
  status: number;
  roles: IRole[];
  createdAt: string;
  updatedAt: string;
}

export interface IAssetProduct {
  id: number;
  productCode: string;
  productName: string;
  productType: string;
  riskLevel: string;
  annualizedReturn: string;
  minAmount: string;
  maxAmount: string;
  duration: number;
  durationUnit: string;
  status: number;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICustomerAsset {
  id: number;
  customerId: number;
  productId: number;
  productName: string;
  productType: string;
  holdingAmount: string;
  costPrice: string;
  currentPrice: string;
  profitLoss: string;
  profitLossRate: string;
  purchaseDate: string;
  maturityDate: string;
  status: number;
  createdAt: string;
  updatedAt: string;
}

export interface IFundFlow {
  id: number;
  customerId: number;
  transactionType: string;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  productId: number | null;
  productName: string | null;
  transactionNo: string;
  remark: string;
  status: number;
  createdAt: string;
}

export interface IStockQuote {
  id: number;
  stockCode: string;
  stockName: string;
  currentPrice: string;
  openPrice: string;
  closePrice: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  turnover: string;
  changeAmount: string;
  changeRate: string;
  marketCap: string;
  peRatio: string;
  tradeDate: string;
  createdAt: string;
}

export interface IComplianceAudit {
  id: number;
  auditType: string;
  targetId: number;
  targetType: string;
  auditorId: number;
  auditorName: string;
  result: string;
  riskLevel: string;
  remark: string;
  auditDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPermission {
  id: number;
  permissionCode: string;
  permissionName: string;
  resource: string;
  action: string;
  parentId: number | null;
  type: number;
  sort: number;
  status: number;
}

export interface IRole {
  id: number;
  roleCode: string;
  roleName: string;
  description: string;
  status: number;
  permissions: IPermission[];
}

export interface IRouteMeta {
  title: string;
  permissions?: string[];
  roles?: string[];
  cache?: boolean;
}

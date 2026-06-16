export enum UserStatus {
  DISABLED = 0,
  ENABLED = 1
}

export enum RoleLevel {
  HEADQUARTERS = 1,
  BRANCH = 2,
  SUB_BRANCH = 3,
  OUTLET = 4
}

export enum DataScope {
  ALL = 1,
  CUSTOM = 2,
  CURRENT_ORG = 3,
  CURRENT_ORG_AND_BELOW = 4,
  SELF_ONLY = 5
}

export enum PermissionType {
  DIRECTORY = 1,
  MENU = 2,
  BUTTON = 3
}

export enum OrgType {
  HEADQUARTERS = 1,
  BRANCH = 2,
  SUB_BRANCH = 3,
  OUTLET = 4
}

export enum TransactionStatus {
  PENDING = 0,
  PROCESSING = 1,
  SUCCESS = 2,
  FAILED = 3,
  CANCELLED = 4
}

export enum AuditStatus {
  PENDING = 0,
  AUDITING = 1,
  APPROVED = 2,
  REJECTED = 3,
  REVOKED = 4
}

export enum AuditLevel {
  LEVEL_1 = 1,
  LEVEL_2 = 2,
  LEVEL_3 = 3,
  LEVEL_4 = 4
}

export enum ProductStatus {
  OFFLINE = 0,
  ONLINE = 1,
  SOLD_OUT = 2
}

export enum RiskLevel {
  LOW = 1,
  MEDIUM_LOW = 2,
  MEDIUM = 3,
  MEDIUM_HIGH = 4,
  HIGH = 5
}

export enum BusinessType {
  TRANSFER = 1,
  DEMAND_DEPOSIT = 2,
  FIXED_DEPOSIT = 3,
  FINANCIAL_PRODUCT = 4,
  LOAN = 5,
  CREDIT_CARD = 6,
  FOREIGN_EXCHANGE = 7,
  FUND = 8
}

export enum ChannelType {
  COUNTER = 'counter',
  EBANK = 'ebank',
  MOBILE = 'mobile',
  ATM = 'atm',
  PHONE = 'phone'
}

export enum OperationStatus {
  FAILED = 0,
  SUCCESS = 1
}

export enum ResponseCode {
  SUCCESS = 200,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_ERROR = 500
}

export enum MoneyPrecision {
  FEN = 2,
  LI = 3,
  HAO = 4
}

export enum DateTimeFormat {
  DATE = 'YYYY-MM-DD',
  DATETIME = 'YYYY-MM-DD HH:mm:ss',
  TIME = 'HH:mm:ss',
  YEAR_MONTH = 'YYYY-MM'
}

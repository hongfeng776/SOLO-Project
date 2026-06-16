export enum MarketType { SH = 'SH', SZ = 'SZ', HK = 'HK', US = 'US' }

export enum RiskLevel { R1 = 'R1', R2 = 'R2', R3 = 'R3', R4 = 'R4', R5 = 'R5' }

export enum ProductType { FUND = 'fund', BOND = 'bond', INSURANCE = 'insurance', TRUST = 'trust', DERIVATIVE = 'derivative' }

export enum ProductStatus { RAISING = 'raising', OPERATING = 'operating', MATURED = 'matured', FROZEN = 'frozen' }

export enum CustomerType { INDIVIDUAL = 'individual', INSTITUTION = 'institution' }

export enum CustomerStatus { NORMAL = 'normal', FROZEN = 'frozen', CLOSED = 'closed' }

export enum FlowType { DEPOSIT = 'deposit', WITHDRAW = 'withdraw', BUY = 'buy', SELL = 'sell', DIVIDEND = 'dividend', FEE = 'fee' }

export enum FlowStatus { PENDING = 'pending', SUCCESS = 'success', FAILED = 'failed', CANCELLED = 'cancelled' }

export enum FlowChannel { ONLINE = 'online', OFFLINE = 'offline', API = 'api' }

export enum AuditType { KYC = 'kyc', TRADE = 'trade', RISK = 'risk', COMPLIANCE = 'compliance' }

export enum AuditStatus { PENDING = 'pending', APPROVED = 'approved', REJECTED = 'rejected' }

export enum TargetType { CUSTOMER = 'customer', TRADE = 'trade', PRODUCT = 'product' }

export enum PermType { MENU = 'menu', BUTTON = 'button', API = 'api' }

export enum UserStatus { DISABLED = 0, ENABLED = 1 }

export enum RoleStatus { DISABLED = 0, ENABLED = 1 }

export enum PermissionStatus { DISABLED = 0, ENABLED = 1 }

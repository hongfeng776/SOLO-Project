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

export enum TargetType { CUSTOMER = 'customer', TRADE = 'trade', PRODUCT = 'product', USER = 'user', ROLE = 'role', PERMISSION = 'permission' }

export enum PermType { MENU = 'menu', BUTTON = 'button', API = 'api' }

export enum UserStatus { DISABLED = 0, ENABLED = 1 }

export enum RoleStatus { DISABLED = 0, ENABLED = 1 }

export enum PermissionStatus { DISABLED = 0, ENABLED = 1 }

export enum TradeType { BUY = 'buy', SELL = 'sell' }

export enum TradeStatus { PENDING = 'pending', AUDITING = 'auditing', APPROVED = 'approved', REJECTED = 'rejected', DEALED = 'dealed', CANCELLED = 'cancelled', FAILED = 'failed' }

export enum AlertType { POSITION = 'position', TRADE = 'trade', RISK = 'risk', COMPLIANCE = 'compliance', SYSTEM = 'system' }

export enum AlertLevel { LOW = 'low', MEDIUM = 'medium', HIGH = 'high', CRITICAL = 'critical' }

export enum AlertStatus { PENDING = 'pending', CONFIRMED = 'confirmed', RESOLVED = 'resolved', IGNORED = 'ignored' }

export enum LogStatus { SUCCESS = 'success', FAILED = 'failed' }

export enum LogModule { AUTH = 'auth', USER = 'user', ROLE = 'role', PERMISSION = 'permission', CUSTOMER = 'customer', TRADE = 'trade', PRODUCT = 'product', STOCK = 'stock', SYSTEM = 'system' }

export enum LogAction { LOGIN = 'login', LOGOUT = 'logout', CREATE = 'create', UPDATE = 'update', DELETE = 'delete', EXPORT = 'export', IMPORT = 'import', AUDIT = 'audit' }

export enum StockStatus { TRADING = 'trading', HOLIDAY = 'holiday', SUSPENDED = 'suspended', DELISTED = 'delisted' }

export const HOT_RISE_THRESHOLD = 7

export const RISK_FALL_THRESHOLD = -7

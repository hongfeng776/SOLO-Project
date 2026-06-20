export enum MarketType { SH = 'SH', SZ = 'SZ', HK = 'HK', US = 'US' }

export enum RiskLevel { R1 = 'R1', R2 = 'R2', R3 = 'R3', R4 = 'R4', R5 = 'R5' }

export enum ProductType { FUND = 'fund', BOND = 'bond', INSURANCE = 'insurance', TRUST = 'trust', DERIVATIVE = 'derivative' }

export enum ProductStatus { RAISING = 'raising', OPERATING = 'operating', MATURED = 'matured', FROZEN = 'frozen' }

export enum CustomerType { INDIVIDUAL = 'individual', INSTITUTION = 'institution' }

export enum CustomerStatus { NORMAL = 'normal', FROZEN = 'frozen', CLOSED = 'closed' }

export enum ArchiveStatus { FORMAL = 'formal', TEMPORARY = 'temporary', EXPIRED = 'expired' }

export enum FilingStatus { NOT_FILED = 'not_filed', FILING = 'filing', FILED = 'filed', REJECTED = 'rejected' }

export enum AccountStatus { NOT_OPENED = 'not_opened', OPENING = 'opening', OPENED = 'opened', CLOSED = 'closed' }

export enum Gender { MALE = 'male', FEMALE = 'female' }

export enum Education { PRIMARY = 'primary', JUNIOR = 'junior', SENIOR = 'senior', COLLEGE = 'college', BACHELOR = 'bachelor', MASTER = 'master', DOCTOR = 'doctor' }

export enum MaritalStatus { SINGLE = 'single', MARRIED = 'married', DIVORCED = 'divorced', WIDOWED = 'widowed' }

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

export enum RiskRuleType {
  TRADE_LIMIT = 'trade_limit',
  POSITION_LIMIT = 'position_limit',
  VOLATILITY_RISK = 'volatility_risk',
  FREQUENCY_RISK = 'frequency_risk',
}

export enum RiskRuleStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  PENDING = 'pending',
  EXPIRED = 'expired',
}

export enum EffectMode {
  IMMEDIATE = 'immediate',
  SCHEDULED = 'scheduled',
}

export enum CustomerLevel {
  NORMAL = 'normal',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
  DIAMOND = 'diamond',
}

export enum RiskRuleChangeType {
  CREATE = 'create',
  UPDATE = 'update',
  ENABLE = 'enable',
  DISABLE = 'disable',
  RESET = 'reset',
  EXPIRE = 'expire',
}

export enum BatchOperationType {
  ENABLE = 'enable',
  DISABLE = 'disable',
  RESET = 'reset',
}

export enum InterceptionType {
  LARGE_AMOUNT = 'large_amount',
  CONCENTRATED_TRADE = 'concentrated_trade',
  FREQUENT_CANCEL = 'frequent_cancel',
  ABNORMAL_WAVE = 'abnormal_wave',
  PRICE_MANIPULATION = 'price_manipulation',
  BLACKLIST_STOCK = 'blacklist_stock',
  RISK_CUSTOMER = 'risk_customer',
  OVER_POSITION_LIMIT = 'over_position_limit',
  OVER_TRADE_LIMIT = 'over_trade_limit',
  VOLATILITY_TRIGGER = 'volatility_trigger',
  FREQUENCY_TRIGGER = 'frequency_trigger',
}

export enum InterceptionStatus {
  TEMPORARY = 'temporary',
  PERMANENT = 'permanent',
  MANUAL_REVIEW = 'manual_review',
  APPEALING = 'appealing',
  APPEAL_PASSED = 'appeal_passed',
  APPEAL_REJECTED = 'appeal_rejected',
  AUTO_RELEASED = 'auto_released',
}

export enum InterceptionLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum InterceptionAction {
  BLOCK_TRADE = 'block_trade',
  FREEZE_FUNDS = 'freeze_funds',
  FREEZE_POSITION = 'freeze_position',
  RESTRICT_OPERATION = 'restrict_operation',
  WARN_ONLY = 'warn_only',
}

export enum AppealStatus {
  NOT_SUBMITTED = 'not_submitted',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum CustomerRiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum RiskLevelChangeType {
  UPGRADE = 'upgrade',
  DOWNGRADE = 'downgrade',
  INITIAL = 'initial',
  RESET = 'reset',
  MANUAL = 'manual',
  EXPIRE = 'expire',
}

export enum AssessmentDataSource {
  TRADE_DATA = 'trade_data',
  ASSET_DATA = 'asset_data',
  BEHAVIOR_DATA = 'behavior_data',
  MANUAL_INPUT = 'manual_input',
  ASSESSMENT_SURVEY = 'assessment_survey',
  EXTERNAL_DATA = 'external_data',
}

export enum ReviewPriority {
  NONE = 'none',
  NORMAL = 'normal',
  HIGH = 'high',
  VERY_HIGH = 'very_high',
}

export enum BatchLevelUpdateMode {
  BY_FREQUENCY = 'by_frequency',
  BY_ASSESSMENT = 'by_assessment',
  BY_CUSTOM_LIST = 'by_custom_list',
  BY_LEVEL = 'by_level',
}

export enum DataIntegrityStatus {
  COMPLETE = 'complete',
  PARTIAL = 'partial',
  MISSING = 'missing',
}

export enum ReplayAnalysisDimension {
  EXCEPTION_TYPE = 'exception_type',
  RISK_LEVEL = 'risk_level',
  INTERCEPTION_EFFECT = 'interception_effect',
  RULE_CATEGORY = 'rule_category',
  CUSTOMER_SEGMENT = 'customer_segment',
  TIME_PERIOD = 'time_period',
  HANDLE_OUTCOME = 'handle_outcome',
  REVIEW_CHANNEL = 'review_channel',
}

export enum InterceptionEffectiveness {
  FULLY_EFFECTIVE = 'fully_effective',
  PARTIALLY_EFFECTIVE = 'partially_effective',
  INEFFECTIVE = 'ineffective',
  OVER_INTERCEPTED = 'over_intercepted',
  UNDER_INTERCEPTED = 'under_intercepted',
}

export enum ReplayExportFormat {
  EXCEL = 'excel',
  CSV = 'csv',
  PDF = 'pdf',
  JSON = 'json',
}

export enum HandleChannel {
  SYSTEM_AUTO = 'system_auto',
  MANUAL_FIRST = 'manual_first',
  MANUAL_SECOND = 'manual_second',
  COMPLIANCE_REVIEW = 'compliance_review',
  APPEALS_CLEARED = 'appeals_cleared',
}

export enum RuleValidityStatus {
  FULLY_EFFECTIVE = 'fully_effective',
  PARTIALLY_EFFECTIVE = 'partially_effective',
  INVALID_REDUNDANT = 'invalid_redundant',
  OVERLY_AGGRESSIVE = 'overly_aggressive',
  UNDER_ACTIVE = 'under_active',
  REQUIRES_UPDATE = 'requires_update',
}

export enum VulnerabilitySeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info',
}

export enum ReplayTimeRange {
  LAST_DAY = '1d',
  LAST_WEEK = '7d',
  LAST_MONTH = '30d',
  LAST_QUARTER = '90d',
  LAST_HALF_YEAR = '180d',
  CUSTOM = 'custom',
}

export enum AnomalyRecurrenceStatus {
  NO_RECURRENCE = 'no_recurrence',
  MINOR_RECURRENCE = 'minor_recurrence',
  MODERATE_RECURRENCE = 'moderate_recurrence',
  SEVERE_RECURRENCE = 'severe_recurrence',
}

export enum RuleOptimizationCategory {
  THRESHOLD_ADJUST = 'threshold_adjust',
  RULE_COMBINATION = 'rule_combination',
  TIME_WINDOW_TUNE = 'time_window_tune',
  PARAMETER_SENSITIVITY = 'parameter_sensitivity',
  CUSTOMER_SEGMENT_SPECIFIC = 'customer_segment_specific',
}

export enum TradeComplianceStatus {
  PENDING = 'pending',
  AUTO_APPROVED = 'auto_approved',
  MANUAL_PENDING = 'manual_pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RETURNED = 'returned',
}

export enum TradeReviewType {
  AUTO = 'auto',
  MANUAL = 'manual',
}

export enum TradeRiskCategory {
  NORMAL = 'normal',
  LARGE_AMOUNT = 'large_amount',
  ABNORMAL = 'abnormal',
}

export enum ViolationType {
  OVER_LIMIT = 'over_limit',
  FREQUENT_TRADE = 'frequent_trade',
  SUSPICIOUS_PATTERN = 'suspicious_pattern',
  BLACKLIST_STOCK = 'blacklist_stock',
  RISK_CUSTOMER = 'risk_customer',
  PRICE_MANIPULATION = 'price_manipulation',
  UNAUTHORIZED_TRADE = 'unauthorized_trade',
  OTHER = 'other',
}

export enum AuditLogAction {
  PRE_CHECK = 'pre_check',
  AUTO_APPROVE = 'auto_approve',
  MANUAL_REVIEW = 'manual_review',
  APPROVE = 'approve',
  REJECT = 'reject',
  RETURN = 'return',
  TIMEOUT_REMIND = 'timeout_remind',
  BATCH_APPROVE = 'batch_approve',
  BATCH_REJECT = 'batch_reject',
  CONSISTENCY_CHECK = 'consistency_check',
  VIOLATION_INTERCEPT = 'violation_intercept',
}

export enum QualificationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
  EXPIRE_SOON = 'expire_soon',
  REVOKED = 'revoked',
}

export enum QualificationReviewType {
  NEW_CUSTOMER = 'new_customer',
  RECHECK = 'recheck',
}

export enum QualificationLevel {
  BASIC = 'basic',
  STANDARD = 'standard',
  PREMIUM = 'premium',
  INSTITUTION = 'institution',
}

export enum QualificationDocumentType {
  ID_CARD = 'id_card',
  PASSPORT = 'passport',
  BUSINESS_LICENSE = 'business_license',
  TAX_CERT = 'tax_cert',
  ORG_CODE_CERT = 'org_code_cert',
  LEGAL_REP_ID = 'legal_rep_id',
  BANK_CARD = 'bank_card',
  INVESTOR_PROFILE = 'investor_profile',
  RISK_ASSESSMENT = 'risk_assessment',
  OTHER = 'other',
}

export enum QualificationIssueType {
  EXPIRED = 'expired',
  MISSING = 'missing',
  FAKE = 'fake',
  INVALID = 'invalid',
  MISMATCH = 'mismatch',
  INCOMPLETE = 'incomplete',
}

export enum QualificationLogAction {
  SUBMIT = 'submit',
  PRE_CHECK = 'pre_check',
  APPROVE = 'approve',
  REJECT = 'reject',
  REVOKE = 'revoke',
  EXPIRE_REMIND = 'expire_remind',
  RECHECK_INITIATE = 'recheck_initiate',
  BATCH_RECHECK_INITIATE = 'batch_recheck_initiate',
  BATCH_APPROVE = 'batch_approve',
  BATCH_REJECT = 'batch_reject',
  AUTHENTICITY_CHECK = 'authenticity_check',
  FAKE_INTERCEPT = 'fake_intercept',
  PERMISSION_UPDATE = 'permission_update',
}


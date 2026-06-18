export enum TradeType { BUY = 'buy', SELL = 'sell' }
export enum TradeStatus { PENDING = 'pending', SUCCESS = 'success', FAILED = 'failed', CANCELLED = 'cancelled', AUDITING = 'auditing' }
export enum AlertLevel { LOW = 'low', MEDIUM = 'medium', HIGH = 'high', CRITICAL = 'critical' }
export enum AlertStatus { PENDING = 'pending', CONFIRMED = 'confirmed', RESOLVED = 'resolved', IGNORED = 'ignored' }
export enum AlertType { PRICE_ABNORMAL = 'price_abnormal', TRADE_ABNORMAL = 'trade_abnormal', POSITION_CONCENTRATION = 'position_concentration', RISK_LEVEL_MISMATCH = 'risk_level_mismatch', CAPITAL_ABNORMAL = 'capital_abnormal' }
export enum LogType { LOGIN = 'login', LOGOUT = 'logout', CREATE = 'create', UPDATE = 'update', DELETE = 'delete', AUDIT = 'audit', TRADE = 'trade', EXPORT = 'export' }
export enum StockStatus { TRADING = 'trading', HOLIDAY = 'holiday', SUSPENDED = 'suspended', DELISTED = 'delisted' }
export enum StockSector { FINANCE = '金融', TECH = '科技', MEDICAL = '医药', ENERGY = '能源', CONSUMER = '消费', REAL_ESTATE = '地产', MANUFACTURING = '制造', MATERIALS = '材料' }
export enum RiskLevel { R1 = 'R1', R2 = 'R2', R3 = 'R3', R4 = 'R4', R5 = 'R5' }
export enum CustomerType { INDIVIDUAL = 'individual', INSTITUTION = 'institution' }
export enum CustomerStatus { NORMAL = 'normal', FROZEN = 'frozen', CLOSED = 'closed' }

export enum ArchiveStatus { FORMAL = 'formal', TEMPORARY = 'temporary', EXPIRED = 'expired' }
export enum FilingStatus { NOT_FILED = 'not_filed', FILING = 'filing', FILED = 'filed', REJECTED = 'rejected' }
export enum AccountStatus { NOT_OPENED = 'not_opened', OPENING = 'opening', OPENED = 'opened', CLOSED = 'closed' }

export const TradeStatusLabels: Record<string, string> = { pending: '待处理', success: '成功', failed: '失败', cancelled: '已撤销', auditing: '审核中' }
export const AlertLevelLabels: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' }
export const AlertLevelColors: Record<string, string> = { low: '#909399', medium: '#E8A838', high: '#F56C6C', critical: '#D93025' }
export const STOCK_STATUS_LABELS = { trading: '正常交易', holiday: '休市', suspended: '停牌', delisted: '退市' }
export const STOCK_STATUS_COLORS = { trading: '#67C23A', holiday: '#909399', suspended: '#E6A23C', delisted: '#C0C4CC' }
export const MARKET_SECTOR_LIST = ['金融', '科技', '医药', '能源', '消费', '地产', '制造', '材料']
export const HOT_RISE_THRESHOLD = 7
export const RISK_FALL_THRESHOLD = -7
export const CUSTOMER_TYPE_LABELS: Record<string, string> = { individual: '个人', institution: '机构' }
export const CUSTOMER_STATUS_LABELS: Record<string, string> = { normal: '正常', frozen: '已冻结', closed: '已销户' }
export const CUSTOMER_STATUS_COLORS: Record<string, string> = { normal: 'success', frozen: 'danger', closed: 'info' }
export const RISK_LEVEL_LABELS: Record<string, string> = { R1: 'R1-低风险', R2: 'R2-中低风险', R3: 'R3-中风险', R4: 'R4-中高风险', R5: 'R5-高风险' }
export const RISK_LEVEL_COLORS: Record<string, string> = { R1: '#67C23A', R2: '#95D475', R3: '#E6A23C', R4: '#F56C6C', R5: '#C45656' }

export const ARCHIVE_STATUS_LABELS: Record<string, string> = { formal: '正式建档', temporary: '临时建档', expired: '已失效' }
export const ARCHIVE_STATUS_COLORS: Record<string, string> = { formal: 'success', temporary: 'warning', expired: 'info' }
export const FILING_STATUS_LABELS: Record<string, string> = { not_filed: '未备案', filing: '备案中', filed: '已备案', rejected: '备案驳回' }
export const FILING_STATUS_COLORS: Record<string, string> = { not_filed: 'info', filing: 'warning', filed: 'success', rejected: 'danger' }
export const ACCOUNT_STATUS_LABELS: Record<string, string> = { not_opened: '未开户', opening: '开户中', opened: '已开户', closed: '已销户' }
export const ACCOUNT_STATUS_COLORS: Record<string, string> = { not_opened: 'info', opening: 'warning', opened: 'success', closed: 'danger' }

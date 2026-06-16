export enum TradeType { BUY = 'buy', SELL = 'sell' }
export enum TradeStatus { PENDING = 'pending', SUCCESS = 'success', FAILED = 'failed', CANCELLED = 'cancelled', AUDITING = 'auditing' }
export enum AlertLevel { LOW = 'low', MEDIUM = 'medium', HIGH = 'high', CRITICAL = 'critical' }
export enum AlertStatus { PENDING = 'pending', CONFIRMED = 'confirmed', RESOLVED = 'resolved', IGNORED = 'ignored' }
export enum AlertType { PRICE_ABNORMAL = 'price_abnormal', TRADE_ABNORMAL = 'trade_abnormal', POSITION_CONCENTRATION = 'position_concentration', RISK_LEVEL_MISMATCH = 'risk_level_mismatch', CAPITAL_ABNORMAL = 'capital_abnormal' }
export enum LogType { LOGIN = 'login', LOGOUT = 'logout', CREATE = 'create', UPDATE = 'update', DELETE = 'delete', AUDIT = 'audit', TRADE = 'trade', EXPORT = 'export' }

export const TradeStatusLabels: Record<string, string> = { pending: '待处理', success: '成功', failed: '失败', cancelled: '已撤销', auditing: '审核中' }
export const AlertLevelLabels: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' }
export const AlertLevelColors: Record<string, string> = { low: '#909399', medium: '#E8A838', high: '#F56C6C', critical: '#D93025' }

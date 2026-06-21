import { MarketType, RiskLevel, ProductType, ProductStatus, CustomerType, CustomerStatus, FlowType, FlowStatus, FlowChannel, AuditType, AuditStatus, TargetType, PermType, UserStatus, RoleStatus, PermissionStatus, TradeType, TradeStatus, AlertType, AlertLevel, AlertStatus, LogStatus, LogModule, LogAction, StockStatus, ArchiveStatus, FilingStatus, AccountStatus, Gender, Education, MaritalStatus, HoldingLockStatus } from '@/enums'
import { BoardType, TradeStatus as QuoteTradeStatus } from '@/types/api'

export const MARKET_LABELS: Record<MarketType, string> = {
  [MarketType.SH]: '沪市',
  [MarketType.SZ]: '深市',
  [MarketType.HK]: '港股',
  [MarketType.US]: '美股',
}

export const BOARD_LABELS: Record<BoardType, string> = {
  [BoardType.MAIN]: '主板',
  [BoardType.SME]: '中小板',
  [BoardType.CHINEXT]: '创业板',
  [BoardType.STAR]: '科创板',
  [BoardType.BSE]: '北交所',
  [BoardType.HK_MAIN]: '港股主板',
  [BoardType.US_NASDAQ]: '纳斯达克',
  [BoardType.US_NYSE]: '纽交所',
}

export const QUOTE_TRADE_STATUS_LABELS: Record<QuoteTradeStatus, string> = {
  [QuoteTradeStatus.NORMAL]: '正常交易',
  [QuoteTradeStatus.HOLIDAY]: '休市',
  [QuoteTradeStatus.SUSPENDED]: '停牌',
  [QuoteTradeStatus.DELISTED]: '退市',
}

export const QUOTE_TRADE_STATUS_COLORS: Record<QuoteTradeStatus, string> = {
  [QuoteTradeStatus.NORMAL]: '#67C23A',
  [QuoteTradeStatus.HOLIDAY]: '#909399',
  [QuoteTradeStatus.SUSPENDED]: '#E6A23C',
  [QuoteTradeStatus.DELISTED]: '#F56C6C',
}

export const EXCHANGE_LABELS: Record<MarketType, string> = {
  [MarketType.SH]: '上海证券交易所',
  [MarketType.SZ]: '深圳证券交易所',
  [MarketType.HK]: '香港联合交易所',
  [MarketType.US]: '美国证券交易所',
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  [RiskLevel.R1]: 'R1-低风险',
  [RiskLevel.R2]: 'R2-中低风险',
  [RiskLevel.R3]: 'R3-中风险',
  [RiskLevel.R4]: 'R4-中高风险',
  [RiskLevel.R5]: 'R5-高风险',
}

export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  [RiskLevel.R1]: '#67C23A',
  [RiskLevel.R2]: '#95D475',
  [RiskLevel.R3]: '#E6A23C',
  [RiskLevel.R4]: '#F56C6C',
  [RiskLevel.R5]: '#C45656',
}

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  [ProductType.FUND]: '基金',
  [ProductType.BOND]: '债券',
  [ProductType.INSURANCE]: '保险',
  [ProductType.TRUST]: '信托',
  [ProductType.DERIVATIVE]: '衍生品',
}

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  [ProductStatus.RAISING]: '募集期',
  [ProductStatus.OPERATING]: '运作中',
  [ProductStatus.MATURED]: '已到期',
  [ProductStatus.FROZEN]: '已冻结',
}

export const PRODUCT_STATUS_COLORS: Record<ProductStatus, string> = {
  [ProductStatus.RAISING]: 'warning',
  [ProductStatus.OPERATING]: 'success',
  [ProductStatus.MATURED]: 'info',
  [ProductStatus.FROZEN]: 'danger',
}

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  [CustomerType.INDIVIDUAL]: '个人',
  [CustomerType.INSTITUTION]: '机构',
}

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  [CustomerStatus.NORMAL]: '正常',
  [CustomerStatus.FROZEN]: '已冻结',
  [CustomerStatus.CLOSED]: '已销户',
}

export const CUSTOMER_STATUS_COLORS: Record<CustomerStatus, string> = {
  [CustomerStatus.NORMAL]: 'success',
  [CustomerStatus.FROZEN]: 'danger',
  [CustomerStatus.CLOSED]: 'info',
}

export const ARCHIVE_STATUS_LABELS: Record<ArchiveStatus, string> = {
  [ArchiveStatus.FORMAL]: '正式建档',
  [ArchiveStatus.TEMPORARY]: '临时建档',
  [ArchiveStatus.EXPIRED]: '已失效',
}

export const ARCHIVE_STATUS_COLORS: Record<ArchiveStatus, string> = {
  [ArchiveStatus.FORMAL]: 'success',
  [ArchiveStatus.TEMPORARY]: 'warning',
  [ArchiveStatus.EXPIRED]: 'info',
}

export const FILING_STATUS_LABELS: Record<FilingStatus, string> = {
  [FilingStatus.NOT_FILED]: '未备案',
  [FilingStatus.FILING]: '备案中',
  [FilingStatus.FILED]: '已备案',
  [FilingStatus.REJECTED]: '备案驳回',
}

export const FILING_STATUS_COLORS: Record<FilingStatus, string> = {
  [FilingStatus.NOT_FILED]: 'info',
  [FilingStatus.FILING]: 'warning',
  [FilingStatus.FILED]: 'success',
  [FilingStatus.REJECTED]: 'danger',
}

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  [AccountStatus.NOT_OPENED]: '未开户',
  [AccountStatus.OPENING]: '开户中',
  [AccountStatus.OPENED]: '已开户',
  [AccountStatus.CLOSED]: '已销户',
}

export const ACCOUNT_STATUS_COLORS: Record<AccountStatus, string> = {
  [AccountStatus.NOT_OPENED]: 'info',
  [AccountStatus.OPENING]: 'warning',
  [AccountStatus.OPENED]: 'success',
  [AccountStatus.CLOSED]: 'danger',
}

export const GENDER_LABELS: Record<Gender, string> = {
  [Gender.MALE]: '男',
  [Gender.FEMALE]: '女',
}

export const EDUCATION_LABELS: Record<Education, string> = {
  [Education.PRIMARY]: '小学',
  [Education.JUNIOR]: '初中',
  [Education.SENIOR]: '高中',
  [Education.COLLEGE]: '大专',
  [Education.BACHELOR]: '本科',
  [Education.MASTER]: '硕士',
  [Education.DOCTOR]: '博士',
}

export const MARITAL_STATUS_LABELS: Record<MaritalStatus, string> = {
  [MaritalStatus.SINGLE]: '未婚',
  [MaritalStatus.MARRIED]: '已婚',
  [MaritalStatus.DIVORCED]: '离异',
  [MaritalStatus.WIDOWED]: '丧偶',
}

export const HOLDING_LOCK_STATUS_LABELS: Record<HoldingLockStatus, string> = {
  [HoldingLockStatus.NORMAL]: '正常',
  [HoldingLockStatus.LOCKED]: '已锁定',
}

export const HOLDING_LOCK_STATUS_COLORS: Record<HoldingLockStatus, string> = {
  [HoldingLockStatus.NORMAL]: 'success',
  [HoldingLockStatus.LOCKED]: 'danger',
}

export const FLOW_TYPE_LABELS: Record<FlowType, string> = {
  [FlowType.DEPOSIT]: '充值',
  [FlowType.WITHDRAW]: '提现',
  [FlowType.BUY]: '买入',
  [FlowType.SELL]: '卖出',
  [FlowType.DIVIDEND]: '分红',
  [FlowType.FEE]: '手续费',
}

export const FLOW_STATUS_LABELS: Record<FlowStatus, string> = {
  [FlowStatus.PENDING]: '处理中',
  [FlowStatus.SUCCESS]: '成功',
  [FlowStatus.FAILED]: '失败',
  [FlowStatus.CANCELLED]: '已撤销',
}

export const FLOW_STATUS_COLORS: Record<FlowStatus, string> = {
  [FlowStatus.PENDING]: 'warning',
  [FlowStatus.SUCCESS]: 'success',
  [FlowStatus.FAILED]: 'danger',
  [FlowStatus.CANCELLED]: 'info',
}

export const FLOW_CHANNEL_LABELS: Record<FlowChannel, string> = {
  [FlowChannel.ONLINE]: '线上',
  [FlowChannel.OFFLINE]: '线下',
  [FlowChannel.API]: 'API',
}

export const AUDIT_TYPE_LABELS: Record<AuditType, string> = {
  [AuditType.KYC]: 'KYC审核',
  [AuditType.TRADE]: '交易审核',
  [AuditType.RISK]: '风控审核',
  [AuditType.COMPLIANCE]: '合规审核',
}

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  [AuditStatus.PENDING]: '待审核',
  [AuditStatus.APPROVED]: '已通过',
  [AuditStatus.REJECTED]: '已拒绝',
}

export const AUDIT_STATUS_COLORS: Record<AuditStatus, string> = {
  [AuditStatus.PENDING]: 'warning',
  [AuditStatus.APPROVED]: 'success',
  [AuditStatus.REJECTED]: 'danger',
}

export const TARGET_TYPE_LABELS: Record<TargetType, string> = {
  [TargetType.CUSTOMER]: '客户',
  [TargetType.TRADE]: '交易',
  [TargetType.PRODUCT]: '产品',
  [TargetType.USER]: '用户',
  [TargetType.ROLE]: '角色',
  [TargetType.PERMISSION]: '权限',
}

export const PERM_TYPE_LABELS: Record<PermType, string> = {
  [PermType.MENU]: '菜单',
  [PermType.BUTTON]: '按钮',
  [PermType.API]: '接口',
}

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  [UserStatus.DISABLED]: '禁用',
  [UserStatus.ENABLED]: '启用',
}

export const USER_STATUS_COLORS: Record<UserStatus, string> = {
  [UserStatus.DISABLED]: 'danger',
  [UserStatus.ENABLED]: 'success',
}

export const ROLE_STATUS_LABELS: Record<RoleStatus, string> = {
  [RoleStatus.DISABLED]: '禁用',
  [RoleStatus.ENABLED]: '启用',
}

export const ROLE_STATUS_COLORS: Record<RoleStatus, string> = {
  [RoleStatus.DISABLED]: 'danger',
  [RoleStatus.ENABLED]: 'success',
}

export const PERMISSION_STATUS_LABELS: Record<PermissionStatus, string> = {
  [PermissionStatus.DISABLED]: '禁用',
  [PermissionStatus.ENABLED]: '启用',
}

export const PERMISSION_STATUS_COLORS: Record<PermissionStatus, string> = {
  [PermissionStatus.DISABLED]: 'danger',
  [PermissionStatus.ENABLED]: 'success',
}

export const TRADE_TYPE_LABELS: Record<TradeType, string> = {
  [TradeType.BUY]: '买入',
  [TradeType.SELL]: '卖出',
}

export const TRADE_TYPE_COLORS: Record<TradeType, 'danger' | 'success'> = {
  [TradeType.BUY]: 'danger',
  [TradeType.SELL]: 'success',
}

export const TRADE_STATUS_LABELS: Record<TradeStatus, string> = {
  [TradeStatus.PENDING]: '待处理',
  [TradeStatus.AUDITING]: '审核中',
  [TradeStatus.APPROVED]: '已通过',
  [TradeStatus.REJECTED]: '已拒绝',
  [TradeStatus.DEALED]: '已成交',
  [TradeStatus.CANCELLED]: '已撤销',
  [TradeStatus.FAILED]: '失败',
}

export const TRADE_STATUS_COLORS: Record<TradeStatus, string> = {
  [TradeStatus.PENDING]: 'warning',
  [TradeStatus.AUDITING]: 'primary',
  [TradeStatus.APPROVED]: 'success',
  [TradeStatus.REJECTED]: 'danger',
  [TradeStatus.DEALED]: 'success',
  [TradeStatus.CANCELLED]: 'info',
  [TradeStatus.FAILED]: 'danger',
}

export const ALERT_TYPE_LABELS: Record<AlertType, string> = {
  [AlertType.POSITION]: '持仓告警',
  [AlertType.TRADE]: '交易告警',
  [AlertType.RISK]: '风险告警',
  [AlertType.COMPLIANCE]: '合规告警',
  [AlertType.SYSTEM]: '系统告警',
}

export const ALERT_LEVEL_LABELS: Record<AlertLevel, string> = {
  [AlertLevel.LOW]: '低',
  [AlertLevel.MEDIUM]: '中',
  [AlertLevel.HIGH]: '高',
  [AlertLevel.CRITICAL]: '严重',
}

export const ALERT_LEVEL_COLORS: Record<AlertLevel, string> = {
  [AlertLevel.LOW]: '#909399',
  [AlertLevel.MEDIUM]: '#E6A23C',
  [AlertLevel.HIGH]: '#F56C6C',
  [AlertLevel.CRITICAL]: '#C45656',
}

export const ALERT_STATUS_LABELS: Record<AlertStatus, string> = {
  [AlertStatus.PENDING]: '待处理',
  [AlertStatus.CONFIRMED]: '已确认',
  [AlertStatus.RESOLVED]: '已处理',
  [AlertStatus.IGNORED]: '已忽略',
}

export const ALERT_STATUS_COLORS: Record<AlertStatus, string> = {
  [AlertStatus.PENDING]: 'danger',
  [AlertStatus.CONFIRMED]: 'warning',
  [AlertStatus.RESOLVED]: 'success',
  [AlertStatus.IGNORED]: 'info',
}

export const LOG_STATUS_LABELS: Record<LogStatus, string> = {
  [LogStatus.SUCCESS]: '成功',
  [LogStatus.FAILED]: '失败',
}

export const LOG_STATUS_COLORS: Record<LogStatus, string> = {
  [LogStatus.SUCCESS]: 'success',
  [LogStatus.FAILED]: 'danger',
}

export const LOG_MODULE_LABELS: Record<LogModule, string> = {
  [LogModule.AUTH]: '认证',
  [LogModule.USER]: '用户管理',
  [LogModule.ROLE]: '角色管理',
  [LogModule.PERMISSION]: '权限管理',
  [LogModule.CUSTOMER]: '客户管理',
  [LogModule.TRADE]: '交易管理',
  [LogModule.PRODUCT]: '产品管理',
  [LogModule.STOCK]: '行情管理',
  [LogModule.SYSTEM]: '系统管理',
}

export const LOG_ACTION_LABELS: Record<LogAction, string> = {
  [LogAction.LOGIN]: '登录',
  [LogAction.LOGOUT]: '登出',
  [LogAction.CREATE]: '创建',
  [LogAction.UPDATE]: '更新',
  [LogAction.DELETE]: '删除',
  [LogAction.EXPORT]: '导出',
  [LogAction.IMPORT]: '导入',
  [LogAction.AUDIT]: '审核',
}

export const MARKET_SECTOR_LIST: string[] = ['金融', '科技', '医药', '能源', '消费', '地产', '制造', '材料']

export const SECTOR_COLORS: Record<string, string> = {
  '金融': '#409EFF',
  '科技': '#8E44AD',
  '医药': '#27AE60',
  '能源': '#F39C12',
  '消费': '#E74C3C',
  '地产': '#34495E',
  '制造': '#16A085',
  '材料': '#D35400',
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  [StockStatus.TRADING]: '正常交易',
  [StockStatus.HOLIDAY]: '休市',
  [StockStatus.SUSPENDED]: '停牌',
  [StockStatus.DELISTED]: '退市',
}

export const STOCK_STATUS_COLORS: Record<StockStatus, string> = {
  [StockStatus.TRADING]: '#67C23A',
  [StockStatus.HOLIDAY]: '#909399',
  [StockStatus.SUSPENDED]: '#E6A23C',
  [StockStatus.DELISTED]: '#C0C4CC',
}

export const DATA_SOURCE_LABELS: Record<string, string> = {
  sina: '新浪财经',
  tencent: '腾讯财经',
  eastmoney: '东方财富',
  manual_input: '手动录入',
}

export const DATA_SOURCE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  sina: { bg: '#FFF1F0', text: '#F56C6C', icon: '📡' },
  tencent: { bg: '#ECF5FF', text: '#409EFF', icon: '📊' },
  eastmoney: { bg: '#F0F9EB', text: '#67C23A', icon: '💰' },
  manual_input: { bg: '#FDF6EC', text: '#E6A23C', icon: '✏️' },
}

export const OPERATION_TYPE_LABELS: Record<string, string> = {
  create: '录入',
  update: '修改',
  import: '导入',
  delete: '删除',
}

export const OPERATION_TYPE_TYPES: Record<string, 'primary' | 'success' | 'warning' | 'danger'> = {
  create: 'primary',
  update: 'success',
  import: 'warning',
  delete: 'danger',
}

export const FIELD_LABELS: Record<string, string> = {
  stockCode: '股票代码',
  stockName: '股票名称',
  market: '市场',
  sector: '板块',
  status: '状态',
  tradeDate: '交易日期',
  currentPrice: '现价',
  changeAmount: '涨跌额',
  changeRate: '涨跌幅',
  openPrice: '开盘价',
  closePrice: '收盘价',
  highPrice: '最高价',
  lowPrice: '最低价',
  volume: '成交量',
  turnover: '成交额',
  peRatio: '市盈率',
  pbRatio: '市净率',
  totalMarketCap: '总市值',
  circulateMarketCap: '流通市值',
  amplitude: '振幅',
}

export const TRADING_PERIOD_LABELS: Record<string, { label: string; class: string }> = {
  '09:30': { label: '早盘', class: 'early-morning' },
  '11:30': { label: '早盘', class: 'early-morning' },
  '13:00': { label: '午盘', class: 'midday' },
  '15:00': { label: '午盘', class: 'midday' },
  '15:01': { label: '盘后', class: 'after-close' },
  '23:59': { label: '盘后', class: 'after-close' },
}

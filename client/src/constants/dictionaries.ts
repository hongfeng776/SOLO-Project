import { MarketType, RiskLevel, ProductType, ProductStatus, CustomerType, CustomerStatus, FlowType, FlowStatus, FlowChannel, AuditType, AuditStatus, TargetType, PermType, UserStatus, RoleStatus, PermissionStatus, TradeType, TradeStatus, AlertType, AlertLevel, AlertStatus, LogStatus, LogModule, LogAction, StockStatus, ArchiveStatus, FilingStatus, AccountStatus, Gender, Education, MaritalStatus } from '@/enums'
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

import { RiskRuleType, RiskRuleStatus, EffectMode, CustomerLevel, RiskRuleChangeType } from '@/enums'

export const RISK_RULE_TYPE_LABELS: Record<RiskRuleType, string> = {
  [RiskRuleType.TRADE_LIMIT]: '交易限额',
  [RiskRuleType.POSITION_LIMIT]: '持仓限额',
  [RiskRuleType.VOLATILITY_RISK]: '波动风控',
  [RiskRuleType.FREQUENCY_RISK]: '频次风控',
}

export const RISK_RULE_TYPE_COLORS: Record<RiskRuleType, string> = {
  [RiskRuleType.TRADE_LIMIT]: '#409EFF',
  [RiskRuleType.POSITION_LIMIT]: '#67C23A',
  [RiskRuleType.VOLATILITY_RISK]: '#E6A23C',
  [RiskRuleType.FREQUENCY_RISK]: '#F56C6C',
}

export const RISK_RULE_TYPE_ICONS: Record<RiskRuleType, string> = {
  [RiskRuleType.TRADE_LIMIT]: 'Money',
  [RiskRuleType.POSITION_LIMIT]: 'Goods',
  [RiskRuleType.VOLATILITY_RISK]: 'TrendCharts',
  [RiskRuleType.FREQUENCY_RISK]: 'Timer',
}

export const RISK_RULE_STATUS_LABELS: Record<RiskRuleStatus, string> = {
  [RiskRuleStatus.ENABLED]: '已启用',
  [RiskRuleStatus.DISABLED]: '已禁用',
  [RiskRuleStatus.PENDING]: '待生效',
  [RiskRuleStatus.EXPIRED]: '已过期',
}

export const RISK_RULE_STATUS_COLORS: Record<RiskRuleStatus, string> = {
  [RiskRuleStatus.ENABLED]: 'success',
  [RiskRuleStatus.DISABLED]: 'info',
  [RiskRuleStatus.PENDING]: 'warning',
  [RiskRuleStatus.EXPIRED]: 'danger',
}

export const EFFECT_MODE_LABELS: Record<EffectMode, string> = {
  [EffectMode.IMMEDIATE]: '即时生效',
  [EffectMode.SCHEDULED]: '定时生效',
}

export const CUSTOMER_LEVEL_LABELS: Record<CustomerLevel, string> = {
  [CustomerLevel.NORMAL]: '普通客户',
  [CustomerLevel.SILVER]: '白银客户',
  [CustomerLevel.GOLD]: '黄金客户',
  [CustomerLevel.PLATINUM]: '铂金客户',
  [CustomerLevel.DIAMOND]: '钻石客户',
}

export const CUSTOMER_LEVEL_COLORS: Record<CustomerLevel, string> = {
  [CustomerLevel.NORMAL]: '#909399',
  [CustomerLevel.SILVER]: '#C0C4CC',
  [CustomerLevel.GOLD]: '#E6A23C',
  [CustomerLevel.PLATINUM]: '#409EFF',
  [CustomerLevel.DIAMOND]: '#9B59B6',
}

export const RISK_RULE_CHANGE_TYPE_LABELS: Record<RiskRuleChangeType, string> = {
  [RiskRuleChangeType.CREATE]: '创建规则',
  [RiskRuleChangeType.UPDATE]: '修改规则',
  [RiskRuleChangeType.ENABLE]: '启用规则',
  [RiskRuleChangeType.DISABLE]: '禁用规则',
  [RiskRuleChangeType.RESET]: '重置规则',
  [RiskRuleChangeType.EXPIRE]: '规则过期',
}

export const RISK_RULE_CHANGE_TYPE_COLORS: Record<RiskRuleChangeType, string> = {
  [RiskRuleChangeType.CREATE]: '#409EFF',
  [RiskRuleChangeType.UPDATE]: '#67C23A',
  [RiskRuleChangeType.ENABLE]: '#0F9B58',
  [RiskRuleChangeType.DISABLE]: '#909399',
  [RiskRuleChangeType.RESET]: '#E6A23C',
  [RiskRuleChangeType.EXPIRE]: '#D93025',
}

export const RISK_RULE_STEP_TITLES: Record<number, string> = {
  1: '选择规则类型',
  2: '配置适用客户等级',
  3: '设置规则参数',
  4: '配置生效时段',
  5: '确认提交',
}

import {
  InterceptionType,
  InterceptionStatus,
  InterceptionLevel,
  InterceptionAction,
  AppealStatus,
} from '@/enums'

export const INTERCEPTION_TYPE_LABELS: Record<InterceptionType, string> = {
  [InterceptionType.LARGE_AMOUNT]: '大额交易',
  [InterceptionType.CONCENTRATED_TRADE]: '集中交易',
  [InterceptionType.FREQUENT_CANCEL]: '频繁撤单',
  [InterceptionType.ABNORMAL_WAVE]: '异常波段',
  [InterceptionType.PRICE_MANIPULATION]: '价格操纵',
  [InterceptionType.BLACKLIST_STOCK]: '黑名单股票',
  [InterceptionType.RISK_CUSTOMER]: '风险客户',
  [InterceptionType.OVER_POSITION_LIMIT]: '超限持仓',
  [InterceptionType.OVER_TRADE_LIMIT]: '超限交易',
  [InterceptionType.VOLATILITY_TRIGGER]: '波动触发',
  [InterceptionType.FREQUENCY_TRIGGER]: '频次触发',
}

export const INTERCEPTION_TYPE_COLORS: Record<InterceptionType, string> = {
  [InterceptionType.LARGE_AMOUNT]: '#E6A23C',
  [InterceptionType.CONCENTRATED_TRADE]: '#909399',
  [InterceptionType.FREQUENT_CANCEL]: '#409EFF',
  [InterceptionType.ABNORMAL_WAVE]: '#F56C6C',
  [InterceptionType.PRICE_MANIPULATION]: '#D93025',
  [InterceptionType.BLACKLIST_STOCK]: '#606266',
  [InterceptionType.RISK_CUSTOMER]: '#E6A23C',
  [InterceptionType.OVER_POSITION_LIMIT]: '#67C23A',
  [InterceptionType.OVER_TRADE_LIMIT]: '#67C23A',
  [InterceptionType.VOLATILITY_TRIGGER]: '#E6A23C',
  [InterceptionType.FREQUENCY_TRIGGER]: '#409EFF',
}

export const INTERCEPTION_TYPE_ICONS: Record<InterceptionType, string> = {
  [InterceptionType.LARGE_AMOUNT]: 'Money',
  [InterceptionType.CONCENTRATED_TRADE]: 'Collection',
  [InterceptionType.FREQUENT_CANCEL]: 'Close',
  [InterceptionType.ABNORMAL_WAVE]: 'TrendCharts',
  [InterceptionType.PRICE_MANIPULATION]: 'Warning',
  [InterceptionType.BLACKLIST_STOCK]: 'CircleClose',
  [InterceptionType.RISK_CUSTOMER]: 'UserFilled',
  [InterceptionType.OVER_POSITION_LIMIT]: 'Goods',
  [InterceptionType.OVER_TRADE_LIMIT]: 'Money',
  [InterceptionType.VOLATILITY_TRIGGER]: 'TrendCharts',
  [InterceptionType.FREQUENCY_TRIGGER]: 'Timer',
}

export const INTERCEPTION_STATUS_LABELS: Record<InterceptionStatus, string> = {
  [InterceptionStatus.TEMPORARY]: '临时拦截',
  [InterceptionStatus.PERMANENT]: '永久拦截',
  [InterceptionStatus.MANUAL_REVIEW]: '人工复核中',
  [InterceptionStatus.APPEALING]: '申诉中',
  [InterceptionStatus.APPEAL_PASSED]: '申诉通过',
  [InterceptionStatus.APPEAL_REJECTED]: '申诉驳回',
  [InterceptionStatus.AUTO_RELEASED]: '自动解除',
}

export const INTERCEPTION_STATUS_COLORS: Record<InterceptionStatus, string> = {
  [InterceptionStatus.TEMPORARY]: 'warning',
  [InterceptionStatus.PERMANENT]: 'danger',
  [InterceptionStatus.MANUAL_REVIEW]: 'primary',
  [InterceptionStatus.APPEALING]: 'info',
  [InterceptionStatus.APPEAL_PASSED]: 'success',
  [InterceptionStatus.APPEAL_REJECTED]: 'danger',
  [InterceptionStatus.AUTO_RELEASED]: 'info',
}

export const INTERCEPTION_LEVEL_LABELS: Record<InterceptionLevel, string> = {
  [InterceptionLevel.LOW]: '一般',
  [InterceptionLevel.MEDIUM]: '关注',
  [InterceptionLevel.HIGH]: '严重',
  [InterceptionLevel.CRITICAL]: '紧急',
}

export const INTERCEPTION_LEVEL_COLORS: Record<InterceptionLevel, string> = {
  [InterceptionLevel.LOW]: '#909399',
  [InterceptionLevel.MEDIUM]: '#409EFF',
  [InterceptionLevel.HIGH]: '#E6A23C',
  [InterceptionLevel.CRITICAL]: '#F56C6C',
}

export const INTERCEPTION_LEVEL_BG_COLORS: Record<InterceptionLevel, string> = {
  [InterceptionLevel.LOW]: 'rgba(144, 147, 153, 0.1)',
  [InterceptionLevel.MEDIUM]: 'rgba(64, 158, 255, 0.1)',
  [InterceptionLevel.HIGH]: 'rgba(230, 162, 60, 0.1)',
  [InterceptionLevel.CRITICAL]: 'rgba(245, 108, 108, 0.12)',
}

export const INTERCEPTION_ACTION_LABELS: Record<InterceptionAction, string> = {
  [InterceptionAction.BLOCK_TRADE]: '禁止交易',
  [InterceptionAction.FREEZE_FUNDS]: '冻结资金',
  [InterceptionAction.FREEZE_POSITION]: '冻结持仓',
  [InterceptionAction.RESTRICT_OPERATION]: '限制操作',
  [InterceptionAction.WARN_ONLY]: '仅警告',
}

export const APPEAL_STATUS_LABELS: Record<AppealStatus, string> = {
  [AppealStatus.NOT_SUBMITTED]: '未申诉',
  [AppealStatus.PENDING]: '申诉审核中',
  [AppealStatus.APPROVED]: '申诉通过',
  [AppealStatus.REJECTED]: '申诉驳回',
}

export const APPEAL_STATUS_COLORS: Record<AppealStatus, string> = {
  [AppealStatus.NOT_SUBMITTED]: 'info',
  [AppealStatus.PENDING]: 'warning',
  [AppealStatus.APPROVED]: 'success',
  [AppealStatus.REJECTED]: 'danger',
}

export const INTERCEPTION_TYPE_DESCRIPTIONS: Record<InterceptionType, string> = {
  [InterceptionType.LARGE_AMOUNT]: '单笔交易金额超过客户等级允许的最大限额',
  [InterceptionType.CONCENTRATED_TRADE]: '短时间内集中买入/卖出同一股票',
  [InterceptionType.FREQUENT_CANCEL]: '撤单频次异常，疑似扰乱市场行为',
  [InterceptionType.ABNORMAL_WAVE]: '交易方向与市场波动异常一致',
  [InterceptionType.PRICE_MANIPULATION]: '连续报单/撤单涉嫌操纵股价',
  [InterceptionType.BLACKLIST_STOCK]: '目标股票属于黑名单限制范围',
  [InterceptionType.RISK_CUSTOMER]: '客户账户处于风险监控状态',
  [InterceptionType.OVER_POSITION_LIMIT]: '持仓数量/比例超过限制阈值',
  [InterceptionType.OVER_TRADE_LIMIT]: '日累计交易金额超限',
  [InterceptionType.VOLATILITY_TRIGGER]: '市场波动率触发熔断阈值',
  [InterceptionType.FREQUENCY_TRIGGER]: '交易频率超过允许的最大频次',
}

export const SIDE_LABELS: Record<string, string> = {
  buy: '买入',
  sell: '卖出',
  BUY: '买入',
  SELL: '卖出',
  '1': '买入',
  '2': '卖出',
}

import {
  CustomerRiskLevel,
  RiskLevelChangeType,
  ReviewPriority,
  AssessmentDataSource,
  BatchLevelUpdateMode,
  DataIntegrityStatus,
} from '@/enums'

export const CUSTOMER_RISK_LEVEL_LABELS: Record<CustomerRiskLevel, string> = {
  [CustomerRiskLevel.LOW]: '低风险',
  [CustomerRiskLevel.MEDIUM]: '中风险',
  [CustomerRiskLevel.HIGH]: '较高风险',
  [CustomerRiskLevel.VERY_HIGH]: '高风险',
}

export const CUSTOMER_RISK_LEVEL_SHORT_LABELS: Record<CustomerRiskLevel, string> = {
  [CustomerRiskLevel.LOW]: '低',
  [CustomerRiskLevel.MEDIUM]: '中',
  [CustomerRiskLevel.HIGH]: '较高',
  [CustomerRiskLevel.VERY_HIGH]: '高',
}

export const CUSTOMER_RISK_LEVEL_COLORS: Record<CustomerRiskLevel, string> = {
  [CustomerRiskLevel.LOW]: '#27AE60',
  [CustomerRiskLevel.MEDIUM]: '#2980B9',
  [CustomerRiskLevel.HIGH]: '#E67E22',
  [CustomerRiskLevel.VERY_HIGH]: '#C0392B',
}

export const CUSTOMER_RISK_LEVEL_BG_COLORS: Record<CustomerRiskLevel, string> = {
  [CustomerRiskLevel.LOW]: 'rgba(39, 174, 96, 0.12)',
  [CustomerRiskLevel.MEDIUM]: 'rgba(41, 128, 185, 0.12)',
  [CustomerRiskLevel.HIGH]: 'rgba(230, 126, 34, 0.12)',
  [CustomerRiskLevel.VERY_HIGH]: 'rgba(192, 57, 43, 0.15)',
}

export const CUSTOMER_RISK_LEVEL_GRADIENTS: Record<CustomerRiskLevel, string> = {
  [CustomerRiskLevel.LOW]: 'linear-gradient(135deg, #27AE60 0%, #2ECC71 100%)',
  [CustomerRiskLevel.MEDIUM]: 'linear-gradient(135deg, #2980B9 0%, #3498DB 100%)',
  [CustomerRiskLevel.HIGH]: 'linear-gradient(135deg, #D35400 0%, #E67E22 100%)',
  [CustomerRiskLevel.VERY_HIGH]: 'linear-gradient(135deg, #C0392B 0%, #E74C3C 100%)',
}

export const CUSTOMER_RISK_LEVEL_SCORES: Record<CustomerRiskLevel, [number, number]> = {
  [CustomerRiskLevel.LOW]: [0, 30],
  [CustomerRiskLevel.MEDIUM]: [31, 60],
  [CustomerRiskLevel.HIGH]: [61, 80],
  [CustomerRiskLevel.VERY_HIGH]: [81, 100],
}

export const RISK_LEVEL_CHANGE_TYPE_LABELS: Record<RiskLevelChangeType, string> = {
  [RiskLevelChangeType.UPGRADE]: '等级升级',
  [RiskLevelChangeType.DOWNGRADE]: '等级降级',
  [RiskLevelChangeType.INITIAL]: '初始评定',
  [RiskLevelChangeType.RESET]: '等级重置',
  [RiskLevelChangeType.MANUAL]: '人工调整',
  [RiskLevelChangeType.EXPIRE]: '等级过期',
}

export const RISK_LEVEL_CHANGE_TYPE_COLORS: Record<RiskLevelChangeType, string> = {
  [RiskLevelChangeType.UPGRADE]: '#E74C3C',
  [RiskLevelChangeType.DOWNGRADE]: '#3498DB',
  [RiskLevelChangeType.INITIAL]: '#9B59B6',
  [RiskLevelChangeType.RESET]: '#95A5A6',
  [RiskLevelChangeType.MANUAL]: '#F39C12',
  [RiskLevelChangeType.EXPIRE]: '#7F8C8D',
}

export const REVIEW_PRIORITY_LABELS: Record<ReviewPriority, string> = {
  [ReviewPriority.NONE]: '免审核',
  [ReviewPriority.NORMAL]: '普通审核',
  [ReviewPriority.HIGH]: '优先审核',
  [ReviewPriority.VERY_HIGH]: '特级审核',
}

export const REVIEW_PRIORITY_COLORS: Record<ReviewPriority, string> = {
  [ReviewPriority.NONE]: '#27AE60',
  [ReviewPriority.NORMAL]: '#3498DB',
  [ReviewPriority.HIGH]: '#E67E22',
  [ReviewPriority.VERY_HIGH]: '#C0392B',
}

export const ASSESSMENT_DATA_SOURCE_LABELS: Record<AssessmentDataSource, string> = {
  [AssessmentDataSource.TRADE_DATA]: '交易数据',
  [AssessmentDataSource.ASSET_DATA]: '资产数据',
  [AssessmentDataSource.BEHAVIOR_DATA]: '行为数据',
  [AssessmentDataSource.MANUAL_INPUT]: '人工录入',
  [AssessmentDataSource.ASSESSMENT_SURVEY]: '风险测评',
  [AssessmentDataSource.EXTERNAL_DATA]: '外部数据',
}

export const DATA_INTEGRITY_STATUS_LABELS: Record<DataIntegrityStatus, string> = {
  [DataIntegrityStatus.COMPLETE]: '数据完整',
  [DataIntegrityStatus.PARTIAL]: '数据缺失（部分）',
  [DataIntegrityStatus.MISSING]: '数据严重缺失',
}

export const DATA_INTEGRITY_STATUS_COLORS: Record<DataIntegrityStatus, string> = {
  [DataIntegrityStatus.COMPLETE]: '#27AE60',
  [DataIntegrityStatus.PARTIAL]: '#E67E22',
  [DataIntegrityStatus.MISSING]: '#C0392B',
}

export const BATCH_UPDATE_MODE_LABELS: Record<BatchLevelUpdateMode, string> = {
  [BatchLevelUpdateMode.BY_FREQUENCY]: '按异常交易频次',
  [BatchLevelUpdateMode.BY_ASSESSMENT]: '按周期测评结果',
  [BatchLevelUpdateMode.BY_CUSTOM_LIST]: '按自定义名单',
  [BatchLevelUpdateMode.BY_LEVEL]: '按当前等级批量转换',
}

export const RISK_LEVEL_STRATEGY_TEMPLATES: Record<CustomerRiskLevel, {
  tradeLimit: string
  positionLimit: string
  reviewPriority: ReviewPriority
  specialRestrictions: string[]
}> = {
  [CustomerRiskLevel.LOW]: {
    tradeLimit: '单笔500万 / 日累计2000万',
    positionLimit: '单票40% / 总仓80%',
    reviewPriority: ReviewPriority.NONE,
    specialRestrictions: ['免审核快速交易', '全市场交易权限', '融资融券可用'],
  },
  [CustomerRiskLevel.MEDIUM]: {
    tradeLimit: '单笔200万 / 日累计800万',
    positionLimit: '单票30% / 总仓70%',
    reviewPriority: ReviewPriority.NORMAL,
    specialRestrictions: ['常规审核', 'ST股票限制', '融资融券可用'],
  },
  [CustomerRiskLevel.HIGH]: {
    tradeLimit: '单笔50万 / 日累计300万',
    positionLimit: '单票20% / 总仓60%',
    reviewPriority: ReviewPriority.HIGH,
    specialRestrictions: ['优先审核队列', '禁止高风险板块', '融资融券受限'],
  },
  [CustomerRiskLevel.VERY_HIGH]: {
    tradeLimit: '单笔10万 / 日累计50万',
    positionLimit: '单票10% / 总仓40%',
    reviewPriority: ReviewPriority.VERY_HIGH,
    specialRestrictions: ['全量人工审核', '仅允许主板交易', '暂停融资融券'],
  },
}

export const LEVEL_SWITCH_TABS: Array<{
  key: string
  label: string
  level: CustomerRiskLevel
}> = [
  { key: 'all', label: '全部客户', level: CustomerRiskLevel.LOW },
  { key: CustomerRiskLevel.LOW, label: '低风险', level: CustomerRiskLevel.LOW },
  { key: CustomerRiskLevel.MEDIUM, label: '中风险', level: CustomerRiskLevel.MEDIUM },
  { key: CustomerRiskLevel.HIGH, label: '较高风险', level: CustomerRiskLevel.HIGH },
  { key: CustomerRiskLevel.VERY_HIGH, label: '高风险', level: CustomerRiskLevel.VERY_HIGH },
]

import {
  ReplayAnalysisDimension,
  InterceptionEffectiveness,
  ReplayExportFormat,
  HandleChannel,
  RuleValidityStatus,
  VulnerabilitySeverity,
  ReplayTimeRange,
  AnomalyRecurrenceStatus,
  RuleOptimizationCategory,
} from '@/enums'

export const ASSESSMENT_SOURCE_LABELS: Record<AssessmentDataSource, string> = {
  [AssessmentDataSource.TRADE_DATA]: '交易数据',
  [AssessmentDataSource.ASSET_DATA]: '资产数据',
  [AssessmentDataSource.BEHAVIOR_DATA]: '行为数据',
  [AssessmentDataSource.MANUAL_INPUT]: '人工录入',
  [AssessmentDataSource.ASSESSMENT_SURVEY]: '风险测评',
  [AssessmentDataSource.EXTERNAL_DATA]: '外部数据',
}

export const BATCH_LEVEL_UPDATE_MODE_LABELS: Record<BatchLevelUpdateMode, string> = {
  [BatchLevelUpdateMode.BY_FREQUENCY]: '按异常交易频次',
  [BatchLevelUpdateMode.BY_ASSESSMENT]: '按周期测评结果',
  [BatchLevelUpdateMode.BY_CUSTOM_LIST]: '按已勾选客户',
  [BatchLevelUpdateMode.BY_LEVEL]: '按当前等级转换',
}

export const INTERCEPTION_EFFECT_LABELS: Record<InterceptionEffectiveness, string> = {
  [InterceptionEffectiveness.FULLY_EFFECTIVE]: '完全有效',
  [InterceptionEffectiveness.PARTIALLY_EFFECTIVE]: '部分有效',
  [InterceptionEffectiveness.INEFFECTIVE]: '完全无效',
  [InterceptionEffectiveness.OVER_INTERCEPTED]: '过度拦截',
  [InterceptionEffectiveness.UNDER_INTERCEPTED]: '拦截不足',
}

export const INTERCEPTION_EFFECT_COLORS: Record<InterceptionEffectiveness, string> = {
  [InterceptionEffectiveness.FULLY_EFFECTIVE]: '#27AE60',
  [InterceptionEffectiveness.PARTIALLY_EFFECTIVE]: '#2980B9',
  [InterceptionEffectiveness.INEFFECTIVE]: '#C0392B',
  [InterceptionEffectiveness.OVER_INTERCEPTED]: '#E67E22',
  [InterceptionEffectiveness.UNDER_INTERCEPTED]: '#F39C12',
}

export const INTERCEPTION_EFFECT_BG_COLORS: Record<InterceptionEffectiveness, string> = {
  [InterceptionEffectiveness.FULLY_EFFECTIVE]: 'rgba(39,174,96,0.1)',
  [InterceptionEffectiveness.PARTIALLY_EFFECTIVE]: 'rgba(41,128,185,0.1)',
  [InterceptionEffectiveness.INEFFECTIVE]: 'rgba(192,57,43,0.1)',
  [InterceptionEffectiveness.OVER_INTERCEPTED]: 'rgba(230,126,34,0.1)',
  [InterceptionEffectiveness.UNDER_INTERCEPTED]: 'rgba(243,156,18,0.1)',
}

export const REPLAY_DIMENSION_LABELS: Record<ReplayAnalysisDimension, string> = {
  [ReplayAnalysisDimension.EXCEPTION_TYPE]: '异常类型',
  [ReplayAnalysisDimension.RISK_LEVEL]: '风险等级',
  [ReplayAnalysisDimension.INTERCEPTION_EFFECT]: '拦截效果',
  [ReplayAnalysisDimension.RULE_CATEGORY]: '规则类别',
  [ReplayAnalysisDimension.CUSTOMER_SEGMENT]: '客户分层',
  [ReplayAnalysisDimension.TIME_PERIOD]: '时间区间',
  [ReplayAnalysisDimension.HANDLE_OUTCOME]: '处理结果',
  [ReplayAnalysisDimension.REVIEW_CHANNEL]: '审核通道',
}

export const REPLAY_EXPORT_FORMAT_LABELS: Record<ReplayExportFormat, string> = {
  [ReplayExportFormat.EXCEL]: 'Excel (.xlsx)',
  [ReplayExportFormat.CSV]: 'CSV 文本',
  [ReplayExportFormat.PDF]: 'PDF 报告',
  [ReplayExportFormat.JSON]: 'JSON 原始数据',
}

export const HANDLE_CHANNEL_LABELS: Record<HandleChannel, string> = {
  [HandleChannel.SYSTEM_AUTO]: '系统自动处理',
  [HandleChannel.MANUAL_FIRST]: '一级人工审核',
  [HandleChannel.MANUAL_SECOND]: '二级人工复核',
  [HandleChannel.COMPLIANCE_REVIEW]: '合规审计审定',
  [HandleChannel.APPEALS_CLEARED]: '申诉后解除',
}

export const HANDLE_CHANNEL_COLORS: Record<HandleChannel, string> = {
  [HandleChannel.SYSTEM_AUTO]: '#2980B9',
  [HandleChannel.MANUAL_FIRST]: '#8E44AD',
  [HandleChannel.MANUAL_SECOND]: '#16A085',
  [HandleChannel.COMPLIANCE_REVIEW]: '#C0392B',
  [HandleChannel.APPEALS_CLEARED]: '#7F8C8D',
}

export const RULE_VALIDITY_LABELS: Record<RuleValidityStatus, string> = {
  [RuleValidityStatus.FULLY_EFFECTIVE]: '完全有效',
  [RuleValidityStatus.PARTIALLY_EFFECTIVE]: '部分有效',
  [RuleValidityStatus.INVALID_REDUNDANT]: '无效冗余',
  [RuleValidityStatus.OVERLY_AGGRESSIVE]: '过于激进',
  [RuleValidityStatus.UNDER_ACTIVE]: '启用不足',
  [RuleValidityStatus.REQUIRES_UPDATE]: '需更新',
}

export const RULE_VALIDITY_COLORS: Record<RuleValidityStatus, string> = {
  [RuleValidityStatus.FULLY_EFFECTIVE]: '#27AE60',
  [RuleValidityStatus.PARTIALLY_EFFECTIVE]: '#2980B9',
  [RuleValidityStatus.INVALID_REDUNDANT]: '#95A5A6',
  [RuleValidityStatus.OVERLY_AGGRESSIVE]: '#E67E22',
  [RuleValidityStatus.UNDER_ACTIVE]: '#34495E',
  [RuleValidityStatus.REQUIRES_UPDATE]: '#C0392B',
}

export const VULNERABILITY_SEVERITY_LABELS: Record<VulnerabilitySeverity, string> = {
  [VulnerabilitySeverity.CRITICAL]: '严重',
  [VulnerabilitySeverity.HIGH]: '高危',
  [VulnerabilitySeverity.MEDIUM]: '中危',
  [VulnerabilitySeverity.LOW]: '低危',
  [VulnerabilitySeverity.INFO]: '提示',
}

export const VULNERABILITY_SEVERITY_COLORS: Record<VulnerabilitySeverity, string> = {
  [VulnerabilitySeverity.CRITICAL]: '#C0392B',
  [VulnerabilitySeverity.HIGH]: '#E74C3C',
  [VulnerabilitySeverity.MEDIUM]: '#F39C12',
  [VulnerabilitySeverity.LOW]: '#2980B9',
  [VulnerabilitySeverity.INFO]: '#95A5A6',
}

export const VULNERABILITY_SEVERITY_GLOW: Record<VulnerabilitySeverity, string> = {
  [VulnerabilitySeverity.CRITICAL]: '0 0 18px rgba(192,57,43,0.5)',
  [VulnerabilitySeverity.HIGH]: '0 0 16px rgba(231,76,60,0.45)',
  [VulnerabilitySeverity.MEDIUM]: '0 0 14px rgba(243,156,18,0.4)',
  [VulnerabilitySeverity.LOW]: '0 0 12px rgba(41,128,185,0.35)',
  [VulnerabilitySeverity.INFO]: '0 0 8px rgba(149,165,166,0.25)',
}

export const REPLAY_TIME_RANGE_OPTIONS: Array<{
  value: ReplayTimeRange
  label: string
  days: number
}> = [
  { value: ReplayTimeRange.LAST_DAY, label: '近24小时', days: 1 },
  { value: ReplayTimeRange.LAST_WEEK, label: '近7天', days: 7 },
  { value: ReplayTimeRange.LAST_MONTH, label: '近30天', days: 30 },
  { value: ReplayTimeRange.LAST_QUARTER, label: '近90天', days: 90 },
  { value: ReplayTimeRange.LAST_HALF_YEAR, label: '近半年', days: 180 },
  { value: ReplayTimeRange.CUSTOM, label: '自定义区间', days: 0 },
]

export const RECURRENCE_STATUS_LABELS: Record<AnomalyRecurrenceStatus, string> = {
  [AnomalyRecurrenceStatus.NO_RECURRENCE]: '无复发',
  [AnomalyRecurrenceStatus.MINOR_RECURRENCE]: '轻微复发',
  [AnomalyRecurrenceStatus.MODERATE_RECURRENCE]: '中度复发',
  [AnomalyRecurrenceStatus.SEVERE_RECURRENCE]: '严重复发',
}

export const RECURRENCE_STATUS_COLORS: Record<AnomalyRecurrenceStatus, string> = {
  [AnomalyRecurrenceStatus.NO_RECURRENCE]: '#27AE60',
  [AnomalyRecurrenceStatus.MINOR_RECURRENCE]: '#2980B9',
  [AnomalyRecurrenceStatus.MODERATE_RECURRENCE]: '#E67E22',
  [AnomalyRecurrenceStatus.SEVERE_RECURRENCE]: '#C0392B',
}

export const OPTIMIZATION_CATEGORY_LABELS: Record<RuleOptimizationCategory, string> = {
  [RuleOptimizationCategory.THRESHOLD_ADJUST]: '阈值微调',
  [RuleOptimizationCategory.RULE_COMBINATION]: '规则组合优化',
  [RuleOptimizationCategory.TIME_WINDOW_TUNE]: '时间窗调整',
  [RuleOptimizationCategory.PARAMETER_SENSITIVITY]: '参数灵敏度',
  [RuleOptimizationCategory.CUSTOMER_SEGMENT_SPECIFIC]: '客户分层适配',
}

export const REPLAY_EXPORT_FIELD_OPTIONS: Array<{
  key: string
  label: string
  group: string
  selected: boolean
  sortOrder?: number
}> = [
  { key: 'eventId', label: '事件编号', group: '基础字段', selected: true },
  { key: 'occurredAt', label: '发生时间', group: '基础字段', selected: true, sortOrder: 1 },
  { key: 'customerName', label: '客户姓名', group: '基础字段', selected: true },
  { key: 'customerAccount', label: '资金账号', group: '基础字段', selected: true },
  { key: 'exceptionType', label: '异常类型', group: '风控维度', selected: true },
  { key: 'riskLevel', label: '风险等级', group: '风控维度', selected: true },
  { key: 'triggeredRule', label: '触发规则', group: '风控维度', selected: true },
  { key: 'interceptionEffect', label: '拦截效果', group: '风控维度', selected: true },
  { key: 'handleChannel', label: '处理通道', group: '处理结果', selected: true },
  { key: 'handleOutcome', label: '处理结论', group: '处理结果', selected: true },
  { key: 'handledBy', label: '处理人', group: '处理结果', selected: false },
  { key: 'handledAt', label: '处理时间', group: '处理结果', selected: true },
  { key: 'involvedAmount', label: '涉及金额', group: '交易字段', selected: true },
  { key: 'stockCode', label: '股票代码', group: '交易字段', selected: false },
  { key: 'stockName', label: '股票名称', group: '交易字段', selected: false },
  { key: 'tradeQuantity', label: '数量', group: '交易字段', selected: false },
  { key: 'appealed', label: '是否申诉', group: '扩展字段', selected: false },
  { key: 'appealResult', label: '申诉结果', group: '扩展字段', selected: false },
  { key: 'recurCount', label: '复发次数', group: '扩展字段', selected: true },
  { key: 'remark', label: '备注', group: '扩展字段', selected: false },
]

export const REPLAY_CORE_METRICS: Array<{
  key: 'interceptionRate' | 'recurrenceRate' | 'resolutionRate' | 'avgHandleTime' | 'compliancePassRate' | 'ruleEffectiveness'
  label: string
  unit?: string
  precision: number
  color: string
  icon: string
}> = [
  { key: 'interceptionRate', label: '风控拦截率', unit: '%', precision: 2, color: '#2980B9', icon: 'Shield' },
  { key: 'recurrenceRate', label: '异常复发率', unit: '%', precision: 2, color: '#E67E22', icon: 'RefreshRight' },
  { key: 'resolutionRate', label: '风险化解率', unit: '%', precision: 2, color: '#27AE60', icon: 'CircleCheckFilled' },
  { key: 'avgHandleTime', label: '平均处理时长', unit: '小时', precision: 1, color: '#8E44AD', icon: 'Clock' },
  { key: 'compliancePassRate', label: '合规通过率', unit: '%', precision: 2, color: '#16A085', icon: 'DocumentChecked' },
  { key: 'ruleEffectiveness', label: '规则有效率', unit: '%', precision: 2, color: '#C0392B', icon: 'MagicStick' },
]

export const REPLAY_FILTER_HINTS: string[] = [
  '单次复盘查询时间区间不建议超过180天，否则可能导致查询超时',
  '建议按异常类型或风险等级进行分层筛选，以获得更精准的复盘结论',
  '超过10万条数据建议使用导出功能，在Excel中进行深度分析',
  '如包含客户敏感信息，需合规审批后方可导出PDF报表',
  '可在【筛选条件】弹窗中配置多维度嵌套组合，支持最多4层AND/OR逻辑',
]

import {
  TradeComplianceStatus,
  TradeReviewType,
  TradeRiskCategory,
  ViolationType,
  AuditLogAction,
} from '@/enums'

export const TRADE_COMPLIANCE_STATUS_LABELS: Record<TradeComplianceStatus, string> = {
  [TradeComplianceStatus.PENDING]: '待审核',
  [TradeComplianceStatus.AUTO_APPROVED]: '自动通过',
  [TradeComplianceStatus.MANUAL_PENDING]: '待人工审核',
  [TradeComplianceStatus.APPROVED]: '审核通过',
  [TradeComplianceStatus.REJECTED]: '审核驳回',
  [TradeComplianceStatus.RETURNED]: '退回修正',
}

export const TRADE_COMPLIANCE_STATUS_COLORS: Record<TradeComplianceStatus, string> = {
  [TradeComplianceStatus.PENDING]: '#E6A23C',
  [TradeComplianceStatus.AUTO_APPROVED]: '#67C23A',
  [TradeComplianceStatus.MANUAL_PENDING]: '#409EFF',
  [TradeComplianceStatus.APPROVED]: '#27AE60',
  [TradeComplianceStatus.REJECTED]: '#D93025',
  [TradeComplianceStatus.RETURNED]: '#E67E22',
}

export const TRADE_COMPLIANCE_STATUS_TAG_TYPES: Record<TradeComplianceStatus, string> = {
  [TradeComplianceStatus.PENDING]: 'warning',
  [TradeComplianceStatus.AUTO_APPROVED]: 'success',
  [TradeComplianceStatus.MANUAL_PENDING]: 'primary',
  [TradeComplianceStatus.APPROVED]: 'success',
  [TradeComplianceStatus.REJECTED]: 'danger',
  [TradeComplianceStatus.RETURNED]: 'warning',
}

export const TRADE_REVIEW_TYPE_LABELS: Record<TradeReviewType, string> = {
  [TradeReviewType.AUTO]: '自动审核',
  [TradeReviewType.MANUAL]: '人工审核',
}

export const TRADE_RISK_CATEGORY_LABELS: Record<TradeRiskCategory, string> = {
  [TradeRiskCategory.NORMAL]: '普通交易',
  [TradeRiskCategory.LARGE_AMOUNT]: '大额交易',
  [TradeRiskCategory.ABNORMAL]: '异常交易',
}

export const TRADE_RISK_CATEGORY_COLORS: Record<TradeRiskCategory, string> = {
  [TradeRiskCategory.NORMAL]: '#27AE60',
  [TradeRiskCategory.LARGE_AMOUNT]: '#E67E22',
  [TradeRiskCategory.ABNORMAL]: '#C0392B',
}

export const TRADE_RISK_CATEGORY_BG_COLORS: Record<TradeRiskCategory, string> = {
  [TradeRiskCategory.NORMAL]: 'rgba(39,174,96,0.1)',
  [TradeRiskCategory.LARGE_AMOUNT]: 'rgba(230,126,34,0.1)',
  [TradeRiskCategory.ABNORMAL]: 'rgba(192,57,43,0.12)',
}

export const VIOLATION_TYPE_LABELS: Record<ViolationType, string> = {
  [ViolationType.OVER_LIMIT]: '超限交易',
  [ViolationType.FREQUENT_TRADE]: '频繁交易',
  [ViolationType.SUSPICIOUS_PATTERN]: '可疑模式',
  [ViolationType.BLACKLIST_STOCK]: '黑名单股票',
  [ViolationType.RISK_CUSTOMER]: '风险客户',
  [ViolationType.PRICE_MANIPULATION]: '价格操纵',
  [ViolationType.UNAUTHORIZED_TRADE]: '未授权交易',
  [ViolationType.OTHER]: '其他违规',
}

export const VIOLATION_TYPE_COLORS: Record<ViolationType, string> = {
  [ViolationType.OVER_LIMIT]: '#E67E22',
  [ViolationType.FREQUENT_TRADE]: '#2980B9',
  [ViolationType.SUSPICIOUS_PATTERN]: '#8E44AD',
  [ViolationType.BLACKLIST_STOCK]: '#606266',
  [ViolationType.RISK_CUSTOMER]: '#C0392B',
  [ViolationType.PRICE_MANIPULATION]: '#D93025',
  [ViolationType.UNAUTHORIZED_TRADE]: '#C0392B',
  [ViolationType.OTHER]: '#95A5A6',
}

export const AUDIT_LOG_ACTION_LABELS: Record<AuditLogAction, string> = {
  [AuditLogAction.PRE_CHECK]: '前置校验',
  [AuditLogAction.AUTO_APPROVE]: '自动通过',
  [AuditLogAction.MANUAL_REVIEW]: '人工审核',
  [AuditLogAction.APPROVE]: '审核通过',
  [AuditLogAction.REJECT]: '审核驳回',
  [AuditLogAction.RETURN]: '退回修正',
  [AuditLogAction.TIMEOUT_REMIND]: '超时提醒',
  [AuditLogAction.BATCH_APPROVE]: '批量通过',
  [AuditLogAction.BATCH_REJECT]: '批量驳回',
  [AuditLogAction.CONSISTENCY_CHECK]: '一致性校验',
  [AuditLogAction.VIOLATION_INTERCEPT]: '违规拦截',
}

export const AUDIT_LOG_ACTION_COLORS: Record<AuditLogAction, string> = {
  [AuditLogAction.PRE_CHECK]: '#2980B9',
  [AuditLogAction.AUTO_APPROVE]: '#27AE60',
  [AuditLogAction.MANUAL_REVIEW]: '#8E44AD',
  [AuditLogAction.APPROVE]: '#27AE60',
  [AuditLogAction.REJECT]: '#C0392B',
  [AuditLogAction.RETURN]: '#E67E22',
  [AuditLogAction.TIMEOUT_REMIND]: '#F39C12',
  [AuditLogAction.BATCH_APPROVE]: '#27AE60',
  [AuditLogAction.BATCH_REJECT]: '#C0392B',
  [AuditLogAction.CONSISTENCY_CHECK]: '#16A085',
  [AuditLogAction.VIOLATION_INTERCEPT]: '#D93025',
}

export const TRADE_COMPLIANCE_TIMEOUT_THRESHOLD_MINUTES = 120

export const TRADE_COMPLIANCE_LARGE_AMOUNT_THRESHOLD = 500000

import {
  QualificationStatus,
  QualificationReviewType,
  QualificationLevel,
  QualificationDocumentType,
  QualificationIssueType,
  QualificationLogAction,
} from '@/enums'

export const QUALIFICATION_STATUS_LABELS: Record<QualificationStatus, string> = {
  [QualificationStatus.PENDING]: '待审核',
  [QualificationStatus.APPROVED]: '已通过',
  [QualificationStatus.REJECTED]: '已驳回',
  [QualificationStatus.EXPIRED]: '已过期',
  [QualificationStatus.EXPIRE_SOON]: '即将过期',
  [QualificationStatus.REVOKED]: '已撤销',
}

export const QUALIFICATION_STATUS_COLORS: Record<QualificationStatus, string> = {
  [QualificationStatus.PENDING]: '#F39C12',
  [QualificationStatus.APPROVED]: '#27AE60',
  [QualificationStatus.REJECTED]: '#C0392B',
  [QualificationStatus.EXPIRED]: '#7F8C8D',
  [QualificationStatus.EXPIRE_SOON]: '#E67E22',
  [QualificationStatus.REVOKED]: '#8E44AD',
}

export const QUALIFICATION_STATUS_TAG_TYPES: Record<QualificationStatus, string> = {
  [QualificationStatus.PENDING]: 'warning',
  [QualificationStatus.APPROVED]: 'success',
  [QualificationStatus.REJECTED]: 'danger',
  [QualificationStatus.EXPIRED]: 'info',
  [QualificationStatus.EXPIRE_SOON]: 'warning',
  [QualificationStatus.REVOKED]: 'danger',
}

export const QUALIFICATION_REVIEW_TYPE_LABELS: Record<QualificationReviewType, string> = {
  [QualificationReviewType.NEW_CUSTOMER]: '新客户入网审核',
  [QualificationReviewType.RECHECK]: '存量客户资质复核',
}

export const QUALIFICATION_LEVEL_LABELS: Record<QualificationLevel, string> = {
  [QualificationLevel.BASIC]: '基础级',
  [QualificationLevel.STANDARD]: '标准级',
  [QualificationLevel.PREMIUM]: '尊享级',
  [QualificationLevel.INSTITUTION]: '机构级',
}

export const QUALIFICATION_LEVEL_COLORS: Record<QualificationLevel, string> = {
  [QualificationLevel.BASIC]: '#95A5A6',
  [QualificationLevel.STANDARD]: '#3498DB',
  [QualificationLevel.PREMIUM]: '#9B59B6',
  [QualificationLevel.INSTITUTION]: '#C0392B',
}

export const QUALIFICATION_DOCUMENT_TYPE_LABELS: Record<QualificationDocumentType, string> = {
  [QualificationDocumentType.ID_CARD]: '身份证',
  [QualificationDocumentType.PASSPORT]: '护照',
  [QualificationDocumentType.BUSINESS_LICENSE]: '营业执照',
  [QualificationDocumentType.TAX_CERT]: '税务登记证',
  [QualificationDocumentType.ORG_CODE_CERT]: '组织机构代码证',
  [QualificationDocumentType.LEGAL_REP_ID]: '法人身份证',
  [QualificationDocumentType.BANK_CARD]: '银行卡',
  [QualificationDocumentType.INVESTOR_PROFILE]: '投资者适当性证明',
  [QualificationDocumentType.RISK_ASSESSMENT]: '风险评估报告',
  [QualificationDocumentType.OTHER]: '其他资料',
}

export const QUALIFICATION_ISSUE_TYPE_LABELS: Record<QualificationIssueType, string> = {
  [QualificationIssueType.EXPIRED]: '资料过期',
  [QualificationIssueType.MISSING]: '资料缺失',
  [QualificationIssueType.FAKE]: '资料造假',
  [QualificationIssueType.INVALID]: '资料无效',
  [QualificationIssueType.MISMATCH]: '信息不符',
  [QualificationIssueType.INCOMPLETE]: '信息不完整',
}

export const QUALIFICATION_ISSUE_TYPE_COLORS: Record<QualificationIssueType, string> = {
  [QualificationIssueType.EXPIRED]: '#7F8C8D',
  [QualificationIssueType.MISSING]: '#E67E22',
  [QualificationIssueType.FAKE]: '#C0392B',
  [QualificationIssueType.INVALID]: '#D93025',
  [QualificationIssueType.MISMATCH]: '#F39C12',
  [QualificationIssueType.INCOMPLETE]: '#E67E22',
}

export const QUALIFICATION_LOG_ACTION_LABELS: Record<QualificationLogAction, string> = {
  [QualificationLogAction.SUBMIT]: '提交资质',
  [QualificationLogAction.PRE_CHECK]: '前置校验',
  [QualificationLogAction.APPROVE]: '审核通过',
  [QualificationLogAction.REJECT]: '审核驳回',
  [QualificationLogAction.REVOKE]: '撤销资质',
  [QualificationLogAction.EXPIRE_REMIND]: '到期提醒',
  [QualificationLogAction.RECHECK_INITIATE]: '发起复核',
  [QualificationLogAction.BATCH_RECHECK_INITIATE]: '批量发起复核',
  [QualificationLogAction.BATCH_APPROVE]: '批量通过',
  [QualificationLogAction.BATCH_REJECT]: '批量驳回',
  [QualificationLogAction.AUTHENTICITY_CHECK]: '真实性校验',
  [QualificationLogAction.FAKE_INTERCEPT]: '造假拦截',
  [QualificationLogAction.PERMISSION_UPDATE]: '权限更新',
}

export const QUALIFICATION_LOG_ACTION_COLORS: Record<QualificationLogAction, string> = {
  [QualificationLogAction.SUBMIT]: '#3498DB',
  [QualificationLogAction.PRE_CHECK]: '#2980B9',
  [QualificationLogAction.APPROVE]: '#27AE60',
  [QualificationLogAction.REJECT]: '#C0392B',
  [QualificationLogAction.REVOKE]: '#8E44AD',
  [QualificationLogAction.EXPIRE_REMIND]: '#F39C12',
  [QualificationLogAction.RECHECK_INITIATE]: '#16A085',
  [QualificationLogAction.BATCH_RECHECK_INITIATE]: '#16A085',
  [QualificationLogAction.BATCH_APPROVE]: '#27AE60',
  [QualificationLogAction.BATCH_REJECT]: '#C0392B',
  [QualificationLogAction.AUTHENTICITY_CHECK]: '#2980B9',
  [QualificationLogAction.FAKE_INTERCEPT]: '#D93025',
  [QualificationLogAction.PERMISSION_UPDATE]: '#9B59B6',
}

export const QUALIFICATION_EXPIRE_WARNING_DAYS = 7

export const QUALIFICATION_REQUIRED_DOCS_INDIVIDUAL = [
  QualificationDocumentType.ID_CARD,
  QualificationDocumentType.BANK_CARD,
  QualificationDocumentType.RISK_ASSESSMENT,
]

export const QUALIFICATION_REQUIRED_DOCS_INSTITUTION = [
  QualificationDocumentType.BUSINESS_LICENSE,
  QualificationDocumentType.TAX_CERT,
  QualificationDocumentType.ORG_CODE_CERT,
  QualificationDocumentType.LEGAL_REP_ID,
  QualificationDocumentType.BANK_CARD,
  QualificationDocumentType.INVESTOR_PROFILE,
]

import {
  InspectionCycle,
  InspectionScope,
  InspectionStatus,
  ViolationLevel,
  IssueStatus,
  IssueProcessAction,
  InspectionLogAction,
} from '@/enums'

export const INSPECTION_CYCLE_LABELS: Record<InspectionCycle, string> = {
  [InspectionCycle.DAILY]: '日检',
  [InspectionCycle.WEEKLY]: '周检',
  [InspectionCycle.MONTHLY]: '月检',
}

export const INSPECTION_SCOPE_LABELS: Record<InspectionScope, string> = {
  [InspectionScope.TRADE]: '交易合规',
  [InspectionScope.ASSET]: '资产合规',
  [InspectionScope.RISK]: '风控合规',
}

export const INSPECTION_SCOPE_COLORS: Record<InspectionScope, string> = {
  [InspectionScope.TRADE]: '#3498DB',
  [InspectionScope.ASSET]: '#27AE60',
  [InspectionScope.RISK]: '#E67E22',
}

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  [InspectionStatus.CONFIGURED]: '已配置',
  [InspectionStatus.RUNNING]: '巡检中',
  [InspectionStatus.COMPLETED]: '已完成',
  [InspectionStatus.FAILED]: '巡检失败',
}

export const INSPECTION_STATUS_TAG_TYPES: Record<InspectionStatus, string> = {
  [InspectionStatus.CONFIGURED]: 'info',
  [InspectionStatus.RUNNING]: 'warning',
  [InspectionStatus.COMPLETED]: 'success',
  [InspectionStatus.FAILED]: 'danger',
}

export const VIOLATION_LEVEL_LABELS: Record<ViolationLevel, string> = {
  [ViolationLevel.MINOR]: '轻微',
  [ViolationLevel.NORMAL]: '一般',
  [ViolationLevel.SEVERE]: '严重',
}

export const VIOLATION_LEVEL_COLORS: Record<ViolationLevel, string> = {
  [ViolationLevel.MINOR]: '#F39C12',
  [ViolationLevel.NORMAL]: '#E67E22',
  [ViolationLevel.SEVERE]: '#C0392B',
}

export const VIOLATION_LEVEL_BG_COLORS: Record<ViolationLevel, string> = {
  [ViolationLevel.MINOR]: 'rgba(243,156,18,0.1)',
  [ViolationLevel.NORMAL]: 'rgba(230,126,34,0.1)',
  [ViolationLevel.SEVERE]: 'rgba(192,57,43,0.12)',
}

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  [IssueStatus.PENDING]: '待处理',
  [IssueStatus.RECTIFIED]: '已整改',
  [IssueStatus.IGNORED]: '已忽略',
  [IssueStatus.REPORTED]: '已上报',
}

export const ISSUE_STATUS_TAG_TYPES: Record<IssueStatus, string> = {
  [IssueStatus.PENDING]: 'warning',
  [IssueStatus.RECTIFIED]: 'success',
  [IssueStatus.IGNORED]: 'info',
  [IssueStatus.REPORTED]: 'danger',
}

export const ISSUE_PROCESS_ACTION_LABELS: Record<IssueProcessAction, string> = {
  [IssueProcessAction.RECTIFY]: '整改',
  [IssueProcessAction.IGNORE]: '忽略',
  [IssueProcessAction.REPORT]: '上报',
}

export const INSPECTION_LOG_ACTION_LABELS: Record<InspectionLogAction, string> = {
  [InspectionLogAction.CONFIGURE]: '配置巡检',
  [InspectionLogAction.PRE_CHECK]: '前置校验',
  [InspectionLogAction.START]: '启动巡检',
  [InspectionLogAction.SCAN_TRADE]: '扫描交易',
  [InspectionLogAction.SCAN_ASSET]: '扫描资产',
  [InspectionLogAction.SCAN_RISK]: '扫描风控',
  [InspectionLogAction.COMPLETE]: '巡检完成',
  [InspectionLogAction.FAIL]: '巡检失败',
  [InspectionLogAction.BATCH_RECTIFY]: '批量整改',
  [InspectionLogAction.BATCH_IGNORE]: '批量忽略',
  [InspectionLogAction.BATCH_REPORT]: '批量上报',
  [InspectionLogAction.COVERAGE_CHECK]: '覆盖完整性校验',
  [InspectionLogAction.ACCURACY_CHECK]: '判定准确性校验',
  [InspectionLogAction.MISS_INTERCEPT]: '漏检拦截',
  [InspectionLogAction.FALSE_POSITIVE_INTERCEPT]: '误检拦截',
  [InspectionLogAction.FAKE_RECTIFY_INTERCEPT]: '虚假整改拦截',
  [InspectionLogAction.RULE_OPTIMIZE]: '规则优化',
}

export const INSPECTION_LOG_ACTION_COLORS: Record<InspectionLogAction, string> = {
  [InspectionLogAction.CONFIGURE]: '#3498DB',
  [InspectionLogAction.PRE_CHECK]: '#2980B9',
  [InspectionLogAction.START]: '#16A085',
  [InspectionLogAction.SCAN_TRADE]: '#3498DB',
  [InspectionLogAction.SCAN_ASSET]: '#27AE60',
  [InspectionLogAction.SCAN_RISK]: '#E67E22',
  [InspectionLogAction.COMPLETE]: '#27AE60',
  [InspectionLogAction.FAIL]: '#C0392B',
  [InspectionLogAction.BATCH_RECTIFY]: '#27AE60',
  [InspectionLogAction.BATCH_IGNORE]: '#95A5A6',
  [InspectionLogAction.BATCH_REPORT]: '#E67E22',
  [InspectionLogAction.COVERAGE_CHECK]: '#16A085',
  [InspectionLogAction.ACCURACY_CHECK]: '#16A085',
  [InspectionLogAction.MISS_INTERCEPT]: '#D93025',
  [InspectionLogAction.FALSE_POSITIVE_INTERCEPT]: '#D93025',
  [InspectionLogAction.FAKE_RECTIFY_INTERCEPT]: '#D93025',
  [InspectionLogAction.RULE_OPTIMIZE]: '#9B59B6',
}


import { MarketType, RiskLevel, ProductType, ProductStatus, CustomerType, CustomerStatus, FlowType, FlowStatus, FlowChannel, AuditType, AuditStatus, TargetType, PermType, UserStatus, RoleStatus, PermissionStatus, TradeType, TradeStatus, AlertType, AlertLevel, AlertStatus, LogStatus, LogModule, LogAction, StockStatus, ArchiveStatus, FilingStatus, AccountStatus, Gender, Education, MaritalStatus, HoldingLockStatus, StockProductType, StockProductStatus, StockProductArchiveStatus, StockProductFilingStatus, StockClassLevel, StockClassStatus, StockClassOperationType, StockFeeRateType, StockFeeRateStatus, StockFeeCustomerLevel, StockFeeTradeScene, StockFeeScopeType, StockFeeConflictLevel, StockStatusChangeType, StockStatusSyncSource, StockStatusRiskLevel, StockStatusAuditStatus } from '@/enums'
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

export const STOCK_PRODUCT_TYPE_LABELS: Record<StockProductType, string> = {
  [StockProductType.A_SHARE]: 'A股',
  [StockProductType.B_SHARE]: 'B股',
  [StockProductType.FUND]: '基金',
  [StockProductType.ETF]: 'ETF',
  [StockProductType.BOND]: '债券',
  [StockProductType.INDEX]: '指数',
  [StockProductType.WARRANT]: '权证',
  [StockProductType.REPO]: '回购',
}

export const STOCK_PRODUCT_TYPE_COLORS: Record<StockProductType, string> = {
  [StockProductType.A_SHARE]: '#409EFF',
  [StockProductType.B_SHARE]: '#E6A23C',
  [StockProductType.FUND]: '#67C23A',
  [StockProductType.ETF]: '#F56C6C',
  [StockProductType.BOND]: '#909399',
  [StockProductType.INDEX]: '#8E44AD',
  [StockProductType.WARRANT]: '#F39C12',
  [StockProductType.REPO]: '#34495E',
}

export const STOCK_PRODUCT_STATUS_LABELS: Record<StockProductStatus, string> = {
  [StockProductStatus.NORMAL]: '正常',
  [StockProductStatus.SUSPENDED]: '停牌',
  [StockProductStatus.DELISTED]: '退市',
  [StockProductStatus.PAUSED]: '暂停交易',
}

export const STOCK_PRODUCT_STATUS_COLORS: Record<StockProductStatus, string> = {
  [StockProductStatus.NORMAL]: '#67C23A',
  [StockProductStatus.SUSPENDED]: '#E6A23C',
  [StockProductStatus.DELISTED]: '#F56C6C',
  [StockProductStatus.PAUSED]: '#909399',
}

export const STOCK_PRODUCT_STATUS_TAG_TYPES: Record<StockProductStatus, 'success' | 'warning' | 'danger' | 'info'> = {
  [StockProductStatus.NORMAL]: 'success',
  [StockProductStatus.SUSPENDED]: 'warning',
  [StockProductStatus.DELISTED]: 'danger',
  [StockProductStatus.PAUSED]: 'info',
}

export const STOCK_PRODUCT_ARCHIVE_STATUS_LABELS: Record<StockProductArchiveStatus, string> = {
  [StockProductArchiveStatus.DRAFT]: '草稿',
  [StockProductArchiveStatus.ARCHIVED]: '已建档',
  [StockProductArchiveStatus.INVALID]: '已失效',
}

export const STOCK_PRODUCT_ARCHIVE_STATUS_COLORS: Record<StockProductArchiveStatus, string> = {
  [StockProductArchiveStatus.DRAFT]: 'info',
  [StockProductArchiveStatus.ARCHIVED]: 'success',
  [StockProductArchiveStatus.INVALID]: 'danger',
}

export const STOCK_PRODUCT_FILING_STATUS_LABELS: Record<StockProductFilingStatus, string> = {
  [StockProductFilingStatus.NOT_FILED]: '未备案',
  [StockProductFilingStatus.FILING]: '备案中',
  [StockProductFilingStatus.FILED]: '已备案',
  [StockProductFilingStatus.REJECTED]: '备案驳回',
}

export const STOCK_PRODUCT_FILING_STATUS_COLORS: Record<StockProductFilingStatus, string> = {
  [StockProductFilingStatus.NOT_FILED]: 'info',
  [StockProductFilingStatus.FILING]: 'warning',
  [StockProductFilingStatus.FILED]: 'success',
  [StockProductFilingStatus.REJECTED]: 'danger',
}

export const STOCK_PRODUCT_BOARD_LIST: string[] = ['主板', '中小板', '创业板', '科创板', '北交所']

export const STOCK_PRODUCT_TRADING_RULE_LIST: string[] = ['T+1', 'T+0', 'T+2']

export const STOCK_PRODUCT_FIELD_LABELS: Record<string, string> = {
  stockCode: '股票代码',
  stockName: '股票名称',
  productType: '产品类型',
  market: '市场',
  sector: '板块',
  board: '板块类型',
  productStatus: '产品状态',
  archiveStatus: '建档状态',
  filingStatus: '备案状态',
  exchangeCode: '交易所代码',
  listingDate: '上市日期',
  delistingDate: '退市日期',
  suspendDate: '停牌日期',
  resumeDate: '复牌日期',
  faceValue: '面值',
  totalShares: '总股本',
  circulatingShares: '流通股本',
  tradingRule: '交易规则',
  feeStandard: '费率标准',
  settlementRule: '结算规则',
  minTradeUnit: '最小交易单位',
  priceLimit: '涨跌停限制(%)',
  tickSize: '最小价格变动',
  filingNo: '备案编号',
  filingDate: '备案日期',
  filingInstitution: '备案机构',
  remark: '备注',
  productCode: '产品编码',
}

export const STOCK_CLASS_LEVEL_LABELS: Record<StockClassLevel, string> = {
  [StockClassLevel.BOARD]: '板块分类',
  [StockClassLevel.INDUSTRY]: '行业分类',
  [StockClassLevel.RISK_LEVEL]: '风险等级分类',
  [StockClassLevel.MARKET_CAP]: '市值规模分类',
}

export const STOCK_CLASS_LEVEL_COLORS: Record<StockClassLevel, string> = {
  [StockClassLevel.BOARD]: '#409EFF',
  [StockClassLevel.INDUSTRY]: '#67C23A',
  [StockClassLevel.RISK_LEVEL]: '#F56C6C',
  [StockClassLevel.MARKET_CAP]: '#E6A23C',
}

export const STOCK_CLASS_LEVEL_ICONS: Record<StockClassLevel, string> = {
  [StockClassLevel.BOARD]: 'Grid',
  [StockClassLevel.INDUSTRY]: 'OfficeBuilding',
  [StockClassLevel.RISK_LEVEL]: 'Warning',
  [StockClassLevel.MARKET_CAP]: 'Coin',
}

export const STOCK_CLASS_STATUS_LABELS: Record<StockClassStatus, string> = {
  [StockClassStatus.ACTIVE]: '生效',
  [StockClassStatus.INACTIVE]: '未生效',
  [StockClassStatus.MERGED]: '已合并',
  [StockClassStatus.INVALID]: '已作废',
}

export const STOCK_CLASS_STATUS_COLORS: Record<StockClassStatus, string> = {
  [StockClassStatus.ACTIVE]: '#67C23A',
  [StockClassStatus.INACTIVE]: '#909399',
  [StockClassStatus.MERGED]: '#409EFF',
  [StockClassStatus.INVALID]: '#F56C6C',
}

export const STOCK_CLASS_STATUS_TAG_TYPES: Record<StockClassStatus, 'success' | 'info' | 'primary' | 'danger'> = {
  [StockClassStatus.ACTIVE]: 'success',
  [StockClassStatus.INACTIVE]: 'info',
  [StockClassStatus.MERGED]: 'primary',
  [StockClassStatus.INVALID]: 'danger',
}

export const STOCK_CLASS_OP_TYPE_LABELS: Record<StockClassOperationType, string> = {
  [StockClassOperationType.CREATE]: '新建分类',
  [StockClassOperationType.UPDATE]: '修改分类',
  [StockClassOperationType.DELETE]: '删除分类',
  [StockClassOperationType.MERGE]: '合并分类',
  [StockClassOperationType.MIGRATE]: '迁移产品',
  [StockClassOperationType.INVALIDATE]: '作废分类',
}

export const STOCK_CLASS_OP_TYPE_TAG_TYPES: Record<StockClassOperationType, 'primary' | 'success' | 'danger' | 'warning' | 'info'> = {
  [StockClassOperationType.CREATE]: 'primary',
  [StockClassOperationType.UPDATE]: 'success',
  [StockClassOperationType.DELETE]: 'danger',
  [StockClassOperationType.MERGE]: 'warning',
  [StockClassOperationType.MIGRATE]: 'info',
  [StockClassOperationType.INVALIDATE]: 'danger',
}

export const STOCK_CLASS_INDUSTRY_LIST: string[] = [
  '银行', '证券', '保险', '房地产', '信息技术', '医药生物',
  '食品饮料', '汽车', '电子', '机械设备', '化工', '钢铁',
  '传媒', '通信', '电力设备', '建筑材料', '国防军工', '农林牧渔',
]

export const STOCK_CLASS_RISK_TAG_LIST: string[] = ['低风险', '中低风险', '中风险', '中高风险', '高风险']

export const STOCK_CLASS_MARKET_CAP_LIST: string[] = ['超大盘(>2000亿)', '大盘(500-2000亿)', '中盘(100-500亿)', '小盘(30-100亿)', '微盘(<30亿)']

export const STOCK_CLASS_FIELD_LABELS: Record<string, string> = {
  classCode: '分类编码',
  className: '分类名称',
  classLevel: '分类层级',
  parentId: '上级分类',
  classStatus: '分类状态',
  sortOrder: '排序号',
  productCount: '关联产品数',
  riskTag: '风险标签',
  marketCapRange: '市值区间',
  industryCode: '行业代码',
  description: '描述',
}

export const STOCK_FEE_RATE_TYPE_LABELS: Record<StockFeeRateType, string> = {
  [StockFeeRateType.COMMISSION]: '交易佣金',
  [StockFeeRateType.STAMP_DUTY]: '印花税',
  [StockFeeRateType.TRANSFER_FEE]: '过户费',
  [StockFeeRateType.SETTLEMENT_FEE]: '结算费',
  [StockFeeRateType.MANAGEMENT_FEE]: '管理费',
  [StockFeeRateType.CUSTODY_FEE]: '托管费',
}

export const STOCK_FEE_RATE_TYPE_COLORS: Record<StockFeeRateType, string> = {
  [StockFeeRateType.COMMISSION]: '#409EFF',
  [StockFeeRateType.STAMP_DUTY]: '#F56C6C',
  [StockFeeRateType.TRANSFER_FEE]: '#67C23A',
  [StockFeeRateType.SETTLEMENT_FEE]: '#E6A23C',
  [StockFeeRateType.MANAGEMENT_FEE]: '#909399',
  [StockFeeRateType.CUSTODY_FEE]: '#9254de',
}

export const STOCK_FEE_RATE_STATUS_LABELS: Record<StockFeeRateStatus, string> = {
  [StockFeeRateStatus.DRAFT]: '草稿',
  [StockFeeRateStatus.PENDING]: '待生效',
  [StockFeeRateStatus.ACTIVE]: '已生效',
  [StockFeeRateStatus.EXPIRED]: '已过期',
  [StockFeeRateStatus.INVALID]: '已作废',
}

export const STOCK_FEE_RATE_STATUS_COLORS: Record<StockFeeRateStatus, string> = {
  [StockFeeRateStatus.DRAFT]: '#909399',
  [StockFeeRateStatus.PENDING]: '#E6A23C',
  [StockFeeRateStatus.ACTIVE]: '#67C23A',
  [StockFeeRateStatus.EXPIRED]: '#C0C4CC',
  [StockFeeRateStatus.INVALID]: '#F56C6C',
}

export const STOCK_FEE_RATE_STATUS_TAG_TYPES: Record<StockFeeRateStatus, 'info' | 'warning' | 'success' | 'info' | 'danger'> = {
  [StockFeeRateStatus.DRAFT]: 'info',
  [StockFeeRateStatus.PENDING]: 'warning',
  [StockFeeRateStatus.ACTIVE]: 'success',
  [StockFeeRateStatus.EXPIRED]: 'info',
  [StockFeeRateStatus.INVALID]: 'danger',
}

export const STOCK_FEE_CUSTOMER_LEVEL_LABELS: Record<StockFeeCustomerLevel, string> = {
  [StockFeeCustomerLevel.NORMAL]: '普通客户',
  [StockFeeCustomerLevel.VIP]: 'VIP客户',
  [StockFeeCustomerLevel.INSTITUTION]: '机构客户',
}

export const STOCK_FEE_CUSTOMER_LEVEL_COLORS: Record<StockFeeCustomerLevel, string> = {
  [StockFeeCustomerLevel.NORMAL]: '#909399',
  [StockFeeCustomerLevel.VIP]: '#E6A23C',
  [StockFeeCustomerLevel.INSTITUTION]: '#409EFF',
}

export const STOCK_FEE_TRADE_SCENE_LABELS: Record<StockFeeTradeScene, string> = {
  [StockFeeTradeScene.BUY]: '买入',
  [StockFeeTradeScene.SELL]: '卖出',
  [StockFeeTradeScene.SUBSCRIBE]: '申购',
  [StockFeeTradeScene.REDEEM]: '赎回',
}

export const STOCK_FEE_SCOPE_TYPE_LABELS: Record<StockFeeScopeType, string> = {
  [StockFeeScopeType.GLOBAL]: '全局生效',
  [StockFeeScopeType.LOCAL]: '局部生效',
}

export const STOCK_FEE_CONFLICT_LEVEL_LABELS: Record<StockFeeConflictLevel, string> = {
  [StockFeeConflictLevel.NONE]: '无冲突',
  [StockFeeConflictLevel.WARNING]: '警告',
  [StockFeeConflictLevel.ERROR]: '严重冲突',
}

export const STOCK_FEE_CONFLICT_LEVEL_TAG_TYPES: Record<StockFeeConflictLevel, 'success' | 'warning' | 'danger'> = {
  [StockFeeConflictLevel.NONE]: 'success',
  [StockFeeConflictLevel.WARNING]: 'warning',
  [StockFeeConflictLevel.ERROR]: 'danger',
}

export const STOCK_FEE_RATE_UNIT_LIST: string[] = ['‰', '%', '元/笔', '元/股']

export const STOCK_FEE_RATE_RANGE_CONFIG: Record<string, { min: number; max: number; defaultMin?: number; defaultMax?: number }> = {
  [StockFeeRateType.COMMISSION]: { min: 0.0001, max: 0.003, defaultMin: 5 },
  [StockFeeRateType.STAMP_DUTY]: { min: 0, max: 0.001 },
  [StockFeeRateType.TRANSFER_FEE]: { min: 0, max: 0.0001 },
  [StockFeeRateType.SETTLEMENT_FEE]: { min: 0, max: 0.0005 },
  [StockFeeRateType.MANAGEMENT_FEE]: { min: 0.0001, max: 0.02 },
  [StockFeeRateType.CUSTODY_FEE]: { min: 0, max: 0.005 },
}

export const STOCK_FEE_FIELD_LABELS: Record<string, string> = {
  feeCode: '费率编码',
  feeName: '费率名称',
  feeRateType: '费率类型',
  feeRateValue: '费率值',
  feeRateUnit: '费率单位',
  minFee: '最低费用',
  maxFee: '最高费用',
  customerLevel: '客户等级',
  tradeScene: '交易场景',
  productType: '产品类型',
  productCodes: '产品代码',
  scopeType: '生效范围',
  feeRateStatus: '费率状态',
  effectiveStartTime: '生效开始时间',
  effectiveEndTime: '生效结束时间',
  conflictLevel: '冲突等级',
  description: '描述',
}

export const STOCK_STATUS_CHANGE_TYPE_LABELS: Record<StockStatusChangeType, string> = {
  [StockStatusChangeType.AUTO_SYNC]: '自动同步',
  [StockStatusChangeType.MANUAL_UPDATE]: '手动更新',
  [StockStatusChangeType.ANNOUNCEMENT_TRIGGER]: '公告触发',
  [StockStatusChangeType.BATCH_SYNC]: '批量同步',
}

export const STOCK_STATUS_CHANGE_TYPE_COLORS: Record<StockStatusChangeType, string> = {
  [StockStatusChangeType.AUTO_SYNC]: '#67C23A',
  [StockStatusChangeType.MANUAL_UPDATE]: '#409EFF',
  [StockStatusChangeType.ANNOUNCEMENT_TRIGGER]: '#E6A23C',
  [StockStatusChangeType.BATCH_SYNC]: '#9254de',
}

export const STOCK_STATUS_CHANGE_TYPE_TAG_TYPES: Record<StockStatusChangeType, 'success' | 'primary' | 'warning' | 'info'> = {
  [StockStatusChangeType.AUTO_SYNC]: 'success',
  [StockStatusChangeType.MANUAL_UPDATE]: 'primary',
  [StockStatusChangeType.ANNOUNCEMENT_TRIGGER]: 'warning',
  [StockStatusChangeType.BATCH_SYNC]: 'info',
}

export const STOCK_STATUS_SYNC_SOURCE_LABELS: Record<StockStatusSyncSource, string> = {
  [StockStatusSyncSource.SSE]: '上交所',
  [StockStatusSyncSource.SZSE]: '深交所',
  [StockStatusSyncSource.HKEX]: '港交所',
  [StockStatusSyncSource.NASDAQ]: '纳斯达克',
  [StockStatusSyncSource.NYSE]: '纽交所',
  [StockStatusSyncSource.MANUAL]: '手动录入',
}

export const STOCK_STATUS_SYNC_SOURCE_COLORS: Record<StockStatusSyncSource, string> = {
  [StockStatusSyncSource.SSE]: '#F56C6C',
  [StockStatusSyncSource.SZSE]: '#409EFF',
  [StockStatusSyncSource.HKEX]: '#67C23A',
  [StockStatusSyncSource.NASDAQ]: '#9254de',
  [StockStatusSyncSource.NYSE]: '#E6A23C',
  [StockStatusSyncSource.MANUAL]: '#909399',
}

export const STOCK_STATUS_RISK_LEVEL_LABELS: Record<StockStatusRiskLevel, string> = {
  [StockStatusRiskLevel.NO_RISK]: '无风险',
  [StockStatusRiskLevel.LOW_RISK]: '低风险',
  [StockStatusRiskLevel.MEDIUM_RISK]: '中风险',
  [StockStatusRiskLevel.HIGH_RISK]: '高风险',
  [StockStatusRiskLevel.CRITICAL]: '极高风险',
}

export const STOCK_STATUS_RISK_LEVEL_COLORS: Record<StockStatusRiskLevel, string> = {
  [StockStatusRiskLevel.NO_RISK]: '#67C23A',
  [StockStatusRiskLevel.LOW_RISK]: '#909399',
  [StockStatusRiskLevel.MEDIUM_RISK]: '#E6A23C',
  [StockStatusRiskLevel.HIGH_RISK]: '#F56C6C',
  [StockStatusRiskLevel.CRITICAL]: '#9254de',
}

export const STOCK_STATUS_RISK_LEVEL_TAG_TYPES: Record<StockStatusRiskLevel, 'success' | 'info' | 'warning' | 'danger'> = {
  [StockStatusRiskLevel.NO_RISK]: 'success',
  [StockStatusRiskLevel.LOW_RISK]: 'info',
  [StockStatusRiskLevel.MEDIUM_RISK]: 'warning',
  [StockStatusRiskLevel.HIGH_RISK]: 'danger',
  [StockStatusRiskLevel.CRITICAL]: 'danger',
}

export const STOCK_STATUS_AUDIT_STATUS_LABELS: Record<StockStatusAuditStatus, string> = {
  [StockStatusAuditStatus.PENDING]: '待审核',
  [StockStatusAuditStatus.APPROVED]: '审核通过',
  [StockStatusAuditStatus.REJECTED]: '审核驳回',
  [StockStatusAuditStatus.SKIPPED]: '免审',
}

export const STOCK_STATUS_AUDIT_STATUS_TAG_TYPES: Record<StockStatusAuditStatus, 'warning' | 'success' | 'danger' | 'info'> = {
  [StockStatusAuditStatus.PENDING]: 'warning',
  [StockStatusAuditStatus.APPROVED]: 'success',
  [StockStatusAuditStatus.REJECTED]: 'danger',
  [StockStatusAuditStatus.SKIPPED]: 'info',
}

export const STOCK_STATUS_TRANSITION_RULES: Record<string, string[]> = {
  normal: ['suspended', 'delisted', 'paused'],
  suspended: ['normal', 'delisted', 'paused'],
  paused: ['normal', 'suspended', 'delisted'],
  delisted: [],
}

export const STOCK_STATUS_FIELD_LABELS: Record<string, string> = {
  syncCode: '同步编码',
  stockCode: '股票代码',
  stockName: '股票名称',
  fromStatus: '原状态',
  toStatus: '目标状态',
  changeType: '变更类型',
  syncSource: '数据来源',
  announcementId: '公告编号',
  announcementTitle: '公告标题',
  effectiveTime: '生效时间',
  riskLevel: '风险等级',
  auditStatus: '审核状态',
  tradingLocked: '交易锁定',
  holdingCleared: '持仓清空',
  pushedToClient: '客户推送',
  operatorName: '操作人',
  operationTime: '操作时间',
}

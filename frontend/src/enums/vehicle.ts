export enum VehicleStatus {
  IDLE = 0,
  IN_SERVICE = 1,
  MAINTENANCE = 2,
  SCRAPPED = 3,
  LOCKED = 4
}

export const VehicleStatusMap: Record<number, string> = {
  [VehicleStatus.IDLE]: '空闲',
  [VehicleStatus.IN_SERVICE]: '运营中',
  [VehicleStatus.MAINTENANCE]: '维修中',
  [VehicleStatus.SCRAPPED]: '已报废',
  [VehicleStatus.LOCKED]: '已锁定'
}

export const VehicleStatusColorMap: Record<number, string> = {
  [VehicleStatus.IDLE]: '#67c23a',
  [VehicleStatus.IN_SERVICE]: '#409eff',
  [VehicleStatus.MAINTENANCE]: '#e6a23c',
  [VehicleStatus.SCRAPPED]: '#909399',
  [VehicleStatus.LOCKED]: '#f56c6c'
}

export enum VehicleAuditStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
  EXPIRED = 3
}

export const VehicleAuditStatusMap: Record<number, string> = {
  [VehicleAuditStatus.PENDING]: '待审核',
  [VehicleAuditStatus.APPROVED]: '已备案',
  [VehicleAuditStatus.REJECTED]: '已驳回',
  [VehicleAuditStatus.EXPIRED]: '已过期'
}

export const VehicleAuditStatusTypeMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
  [VehicleAuditStatus.PENDING]: 'warning',
  [VehicleAuditStatus.APPROVED]: 'success',
  [VehicleAuditStatus.REJECTED]: 'danger',
  [VehicleAuditStatus.EXPIRED]: 'info'
}

export enum OperationLevel {
  S = 1,
  A = 2,
  B = 3,
  C = 4
}

export const OperationLevelMap: Record<number, string> = {
  [OperationLevel.S]: 'S级',
  [OperationLevel.A]: 'A级',
  [OperationLevel.B]: 'B级',
  [OperationLevel.C]: 'C级'
}

export const OperationLevelColorMap: Record<number, string> = {
  [OperationLevel.S]: '#ffd700',
  [OperationLevel.A]: '#409eff',
  [OperationLevel.B]: '#67c23a',
  [OperationLevel.C]: '#909399'
}

export enum EmissionStandard {
  I = 1,
  II = 2,
  III = 3,
  IV = 4,
  V = 5,
  VI = 6
}

export const EmissionStandardMap: Record<number, string> = {
  [EmissionStandard.I]: '国一',
  [EmissionStandard.II]: '国二',
  [EmissionStandard.III]: '国三',
  [EmissionStandard.IV]: '国四',
  [EmissionStandard.V]: '国五',
  [EmissionStandard.VI]: '国六'
}

export const EmissionStandardColorMap: Record<number, string> = {
  [EmissionStandard.I]: '#f56c6c',
  [EmissionStandard.II]: '#f56c6c',
  [EmissionStandard.III]: '#e6a23c',
  [EmissionStandard.IV]: '#e6a23c',
  [EmissionStandard.V]: '#67c23a',
  [EmissionStandard.VI]: '#67c23a'
}

export enum VehicleType {
  SEDAN = 1,
  SUV = 2,
  VAN = 3,
  TRUCK = 4,
  MPV = 5
}

export const VehicleTypeMap: Record<number, string> = {
  [VehicleType.SEDAN]: '轿车',
  [VehicleType.SUV]: 'SUV',
  [VehicleType.VAN]: '面包车',
  [VehicleType.TRUCK]: '货车',
  [VehicleType.MPV]: 'MPV'
}

export enum RiskLevel {
  LOW = 1,
  MEDIUM = 2,
  HIGH = 3
}

export const RiskLevelMap: Record<number, string> = {
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.HIGH]: '高风险'
}

export const RiskLevelColorMap: Record<number, string> = {
  [RiskLevel.LOW]: '#67c23a',
  [RiskLevel.MEDIUM]: '#e6a23c',
  [RiskLevel.HIGH]: '#f56c6c'
}

export enum OperationType {
  CREATE = 1,
  UPDATE = 2,
  APPROVE = 3,
  REJECT = 4,
  BATCH_REVIEW = 5,
  MARK_EXPIRED = 6,
  LOCK = 7,
  UNLOCK = 8,
  REVIEW = 9,
  FRAUD_BLOCK = 10,
  DUPLICATE_BLOCK = 11,
  DOCUMENT_FORGERY_BLOCK = 12,
  OPERATION_STATUS_CHANGE = 13,
  INITIATE_MAINTENANCE = 14,
  VIOLATION_RECORD = 15,
  BATCH_RESTORE = 16,
  BATCH_MAINTENANCE = 17,
  BATCH_REMIND_RENEWAL = 18,
  ANOMALY_INTERCEPT = 19,
  AUTO_DETERMINE = 20,
  COMPLIANCE_CHECK = 21,
  BATCH_COMPLIANCE_CHECK = 22,
  COMPLIANCE_RECTIFICATION = 23,
  COMPLIANCE_REPORT_EXPORT = 24,
  FAKE_COMPLIANCE_INTERCEPT = 25,
  MISSED_CHECK_DETECTION = 26
}

export const OperationTypeMap: Record<number, string> = {
  [OperationType.CREATE]: '新增备案',
  [OperationType.UPDATE]: '修改备案',
  [OperationType.APPROVE]: '审核通过',
  [OperationType.REJECT]: '审核驳回',
  [OperationType.BATCH_REVIEW]: '批量复核',
  [OperationType.MARK_EXPIRED]: '标记过期',
  [OperationType.LOCK]: '车辆锁定',
  [OperationType.UNLOCK]: '车辆解锁',
  [OperationType.REVIEW]: '资料复核',
  [OperationType.FRAUD_BLOCK]: '虚假备案拦截',
  [OperationType.DUPLICATE_BLOCK]: '重复备案拦截',
  [OperationType.DOCUMENT_FORGERY_BLOCK]: '证件造假拦截',
  [OperationType.OPERATION_STATUS_CHANGE]: '运营状态变更',
  [OperationType.INITIATE_MAINTENANCE]: '发起检修',
  [OperationType.VIOLATION_RECORD]: '违规记录',
  [OperationType.BATCH_RESTORE]: '批量恢复运营',
  [OperationType.BATCH_MAINTENANCE]: '批量发起检修',
  [OperationType.BATCH_REMIND_RENEWAL]: '批量提醒换证',
  [OperationType.ANOMALY_INTERCEPT]: '异常拦截',
  [OperationType.AUTO_DETERMINE]: '自动状态判定',
  [OperationType.COMPLIANCE_CHECK]: '合规校验',
  [OperationType.BATCH_COMPLIANCE_CHECK]: '批量合规校验',
  [OperationType.COMPLIANCE_RECTIFICATION]: '合规整改',
  [OperationType.COMPLIANCE_REPORT_EXPORT]: '合规报告导出',
  [OperationType.FAKE_COMPLIANCE_INTERCEPT]: '虚假合规拦截',
  [OperationType.MISSED_CHECK_DETECTION]: '漏审检测'
}

export const OperationTypeColorMap: Record<number, string> = {
  [OperationType.CREATE]: '#409eff',
  [OperationType.UPDATE]: '#e6a23c',
  [OperationType.APPROVE]: '#67c23a',
  [OperationType.REJECT]: '#f56c6c',
  [OperationType.BATCH_REVIEW]: '#909399',
  [OperationType.MARK_EXPIRED]: '#909399',
  [OperationType.LOCK]: '#f56c6c',
  [OperationType.UNLOCK]: '#67c23a',
  [OperationType.REVIEW]: '#e6a23c',
  [OperationType.FRAUD_BLOCK]: '#f56c6c',
  [OperationType.DUPLICATE_BLOCK]: '#f56c6c',
  [OperationType.DOCUMENT_FORGERY_BLOCK]: '#f56c6c',
  [OperationType.OPERATION_STATUS_CHANGE]: '#409eff',
  [OperationType.INITIATE_MAINTENANCE]: '#e6a23c',
  [OperationType.VIOLATION_RECORD]: '#f56c6c',
  [OperationType.BATCH_RESTORE]: '#67c23a',
  [OperationType.BATCH_MAINTENANCE]: '#e6a23c',
  [OperationType.BATCH_REMIND_RENEWAL]: '#409eff',
  [OperationType.ANOMALY_INTERCEPT]: '#f56c6c',
  [OperationType.AUTO_DETERMINE]: '#909399',
  [OperationType.COMPLIANCE_CHECK]: '#409eff',
  [OperationType.BATCH_COMPLIANCE_CHECK]: '#67c23a',
  [OperationType.COMPLIANCE_RECTIFICATION]: '#e6a23c',
  [OperationType.COMPLIANCE_REPORT_EXPORT]: '#909399',
  [OperationType.FAKE_COMPLIANCE_INTERCEPT]: '#f56c6c',
  [OperationType.MISSED_CHECK_DETECTION]: '#e6a23c'
}

export enum OperationStatus {
  NORMAL = 1,
  MAINTENANCE = 2,
  DOCUMENT_EXPIRED = 3,
  BANNED = 4
}

export const OperationStatusMap: Record<number, string> = {
  [OperationStatus.NORMAL]: '正常运营',
  [OperationStatus.MAINTENANCE]: '停运检修',
  [OperationStatus.DOCUMENT_EXPIRED]: '证件过期',
  [OperationStatus.BANNED]: '违规封禁'
}

export const OperationStatusColorMap: Record<number, string> = {
  [OperationStatus.NORMAL]: '#67c23a',
  [OperationStatus.MAINTENANCE]: '#e6a23c',
  [OperationStatus.DOCUMENT_EXPIRED]: '#f56c6c',
  [OperationStatus.BANNED]: '#909399'
}

export const OperationStatusTypeMap: Record<number, 'success' | 'warning' | 'danger' | 'info'> = {
  [OperationStatus.NORMAL]: 'success',
  [OperationStatus.MAINTENANCE]: 'warning',
  [OperationStatus.DOCUMENT_EXPIRED]: 'danger',
  [OperationStatus.BANNED]: 'info'
}

export enum MaintenanceType {
  ROUTINE = 1,
  ANNUAL_INSPECTION = 2,
  MAJOR_REPAIR = 3,
  ACCIDENT_REPAIR = 4,
  PART_REPLACEMENT = 5
}

export const MaintenanceTypeMap: Record<number, string> = {
  [MaintenanceType.ROUTINE]: '常规保养',
  [MaintenanceType.ANNUAL_INSPECTION]: '年检',
  [MaintenanceType.MAJOR_REPAIR]: '大修',
  [MaintenanceType.ACCIDENT_REPAIR]: '事故维修',
  [MaintenanceType.PART_REPLACEMENT]: '更换零件'
}

export enum MaintenanceStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  COMPLETED = 2,
  CANCELLED = 3
}

export const MaintenanceStatusMap: Record<number, string> = {
  [MaintenanceStatus.PENDING]: '待检修',
  [MaintenanceStatus.IN_PROGRESS]: '检修中',
  [MaintenanceStatus.COMPLETED]: '已完成',
  [MaintenanceStatus.CANCELLED]: '已取消'
}

export enum ViolationType {
  SPEEDING = 1,
  ILLEGAL_ORDER = 2,
  FAKE_OPERATION = 3,
  REFUSAL = 4,
  DETOUR = 5,
  OTHER = 6
}

export const ViolationTypeMap: Record<number, string> = {
  [ViolationType.SPEEDING]: '超速',
  [ViolationType.ILLEGAL_ORDER]: '违规接单',
  [ViolationType.FAKE_OPERATION]: '虚假运营',
  [ViolationType.REFUSAL]: '拒载',
  [ViolationType.DETOUR]: '绕路',
  [ViolationType.OTHER]: '其他'
}

export enum ViolationLevel {
  MINOR = 1,
  MODERATE = 2,
  SEVERE = 3
}

export const ViolationLevelMap: Record<number, string> = {
  [ViolationLevel.MINOR]: '轻微',
  [ViolationLevel.MODERATE]: '一般',
  [ViolationLevel.SEVERE]: '严重'
}

export const ViolationLevelColorMap: Record<number, string> = {
  [ViolationLevel.MINOR]: '#e6a23c',
  [ViolationLevel.MODERATE]: '#f56c6c',
  [ViolationLevel.SEVERE]: '#f56c6c'
}

export enum ViolationStatus {
  PENDING = 0,
  PROCESSING = 1,
  RESOLVED = 2,
  APPEALED = 3
}

export const ViolationStatusMap: Record<number, string> = {
  [ViolationStatus.PENDING]: '待处理',
  [ViolationStatus.PROCESSING]: '处理中',
  [ViolationStatus.RESOLVED]: '已处理',
  [ViolationStatus.APPEALED]: '已申诉'
}

export enum PenaltyType {
  WARNING = 1,
  FINE = 2,
  SUSPEND = 3,
  TEMP_BAN = 4,
  PERM_BAN = 5
}

export const PenaltyTypeMap: Record<number, string> = {
  [PenaltyType.WARNING]: '警告',
  [PenaltyType.FINE]: '罚款',
  [PenaltyType.SUSPEND]: '暂停运营',
  [PenaltyType.TEMP_BAN]: '临时封禁',
  [PenaltyType.PERM_BAN]: '永久封禁'
}

export enum BannedType {
  NONE = 0,
  TEMPORARY = 1,
  PERMANENT = 2
}

export const BannedTypeMap: Record<number, string> = {
  [BannedType.NONE]: '未封禁',
  [BannedType.TEMPORARY]: '临时封禁',
  [BannedType.PERMANENT]: '永久封禁'
}

export enum MaintenanceWarningLevel {
  NONE = 0,
  APPROACHING = 1,
  URGENT = 2,
  OVERDUE = 3
}

export const MaintenanceWarningLevelMap: Record<number, string> = {
  [MaintenanceWarningLevel.NONE]: '无预警',
  [MaintenanceWarningLevel.APPROACHING]: '临近检修',
  [MaintenanceWarningLevel.URGENT]: '紧急检修',
  [MaintenanceWarningLevel.OVERDUE]: '已过期'
}

export const MaintenanceWarningColorMap: Record<number, string> = {
  [MaintenanceWarningLevel.NONE]: '#67c23a',
  [MaintenanceWarningLevel.APPROACHING]: '#e6a23c',
  [MaintenanceWarningLevel.URGENT]: '#f56c6c',
  [MaintenanceWarningLevel.OVERDUE]: '#f56c6c'
}

export enum StatusChangeType {
  OPERATION_STATUS = 1,
  MAINTENANCE_STATUS = 2,
  VIOLATION_STATUS = 3,
  BAN_STATUS = 4,
  WARNING_TRIGGER = 5,
  ANOMALY_INTERCEPT = 6,
  AUTO_DETERMINE = 7
}

export const StatusChangeTypeMap: Record<number, string> = {
  [StatusChangeType.OPERATION_STATUS]: '运营状态变更',
  [StatusChangeType.MAINTENANCE_STATUS]: '检修状态变更',
  [StatusChangeType.VIOLATION_STATUS]: '违规状态变更',
  [StatusChangeType.BAN_STATUS]: '封禁状态变更',
  [StatusChangeType.WARNING_TRIGGER]: '预警触发',
  [StatusChangeType.ANOMALY_INTERCEPT]: '异常拦截',
  [StatusChangeType.AUTO_DETERMINE]: '自动状态判定'
}

export enum TriggerType {
  MANUAL = 1,
  SYSTEM = 2,
  SCHEDULED = 3,
  THRESHOLD = 4
}

export const TriggerTypeMap: Record<number, string> = {
  [TriggerType.MANUAL]: '手动操作',
  [TriggerType.SYSTEM]: '系统自动',
  [TriggerType.SCHEDULED]: '定时任务',
  [TriggerType.THRESHOLD]: '阈值触发'
}

export enum ComplianceLevel {
  UNRATED = 0,
  A = 1,
  B = 2,
  C = 3,
  D = 4
}

export const ComplianceLevelMap: Record<number, string> = {
  [ComplianceLevel.UNRATED]: '未评定',
  [ComplianceLevel.A]: 'A级',
  [ComplianceLevel.B]: 'B级',
  [ComplianceLevel.C]: 'C级',
  [ComplianceLevel.D]: 'D级'
}

export const ComplianceLevelColorMap: Record<number, string> = {
  [ComplianceLevel.UNRATED]: '#909399',
  [ComplianceLevel.A]: '#ffd700',
  [ComplianceLevel.B]: '#67c23a',
  [ComplianceLevel.C]: '#e6a23c',
  [ComplianceLevel.D]: '#f56c6c'
}

export enum ComplianceStatus {
  COMPLIANT = 1,
  PENDING_CHECK = 2,
  WARNING = 3,
  LOCKED = 4
}

export const ComplianceStatusMap: Record<number, string> = {
  [ComplianceStatus.COMPLIANT]: '合规',
  [ComplianceStatus.PENDING_CHECK]: '待校验',
  [ComplianceStatus.WARNING]: '已预警',
  [ComplianceStatus.LOCKED]: '已锁定'
}

export const ComplianceStatusColorMap: Record<number, string> = {
  [ComplianceStatus.COMPLIANT]: '#67c23a',
  [ComplianceStatus.PENDING_CHECK]: '#909399',
  [ComplianceStatus.WARNING]: '#e6a23c',
  [ComplianceStatus.LOCKED]: '#f56c6c'
}

export enum ComplianceCheckType {
  INSURANCE = 1,
  INSPECTION = 2,
  VIOLATION = 3,
  COMPREHENSIVE = 4
}

export const ComplianceCheckTypeMap: Record<number, string> = {
  [ComplianceCheckType.INSURANCE]: '保险校验',
  [ComplianceCheckType.INSPECTION]: '年检校验',
  [ComplianceCheckType.VIOLATION]: '违章校验',
  [ComplianceCheckType.COMPREHENSIVE]: '综合校验'
}

export enum ComplianceCheckStatus {
  PENDING = 0,
  CHECKING = 1,
  PASSED = 2,
  FAILED = 3,
  ABNORMAL = 4
}

export const ComplianceCheckStatusMap: Record<number, string> = {
  [ComplianceCheckStatus.PENDING]: '待校验',
  [ComplianceCheckStatus.CHECKING]: '校验中',
  [ComplianceCheckStatus.PASSED]: '校验通过',
  [ComplianceCheckStatus.FAILED]: '校验不通过',
  [ComplianceCheckStatus.ABNORMAL]: '校验异常'
}

export enum RectificationType {
  INSURANCE = 1,
  INSPECTION = 2,
  VIOLATION = 3,
  PARAMETER = 4,
  COMPREHENSIVE = 5
}

export const RectificationTypeMap: Record<number, string> = {
  [RectificationType.INSURANCE]: '保险整改',
  [RectificationType.INSPECTION]: '年检整改',
  [RectificationType.VIOLATION]: '违章整改',
  [RectificationType.PARAMETER]: '参数整改',
  [RectificationType.COMPREHENSIVE]: '综合整改'
}

export enum RectificationStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  SUBMITTED = 2,
  REVIEWED = 3,
  REJECTED = 4
}

export const RectificationStatusMap: Record<number, string> = {
  [RectificationStatus.PENDING]: '待整改',
  [RectificationStatus.IN_PROGRESS]: '整改中',
  [RectificationStatus.SUBMITTED]: '已提交',
  [RectificationStatus.REVIEWED]: '已复核',
  [RectificationStatus.REJECTED]: '已驳回'
}

export enum CheckLevel {
  NORMAL = 1,
  STRICT = 2,
  DEEP = 3
}

export const CheckLevelMap: Record<number, string> = {
  [CheckLevel.NORMAL]: '常规校验',
  [CheckLevel.STRICT]: '严格校验',
  [CheckLevel.DEEP]: '深度校验'
}

export enum CityTier {
  TIER1 = 1,
  TIER2 = 2,
  TIER3 = 3
}

export const CityTierMap: Record<number, string> = {
  [CityTier.TIER1]: '一线城市',
  [CityTier.TIER2]: '二线城市',
  [CityTier.TIER3]: '三线及以下'
}

export enum ComplianceWarning {
  NONE = 0,
  APPROACHING = 1,
  OVERDUE = 2,
  RISK = 3
}

export const ComplianceWarningMap: Record<number, string> = {
  [ComplianceWarning.NONE]: '无预警',
  [ComplianceWarning.APPROACHING]: '临近校验',
  [ComplianceWarning.OVERDUE]: '校验超期',
  [ComplianceWarning.RISK]: '合规风险'
}

export enum FakeComplianceStatus {
  NOT_DETECTED = 0,
  SUSPECTED = 1,
  CONFIRMED = 2
}

export const FakeComplianceStatusMap: Record<number, string> = {
  [FakeComplianceStatus.NOT_DETECTED]: '未检测',
  [FakeComplianceStatus.SUSPECTED]: '疑似虚假',
  [FakeComplianceStatus.CONFIRMED]: '已确认虚假'
}

export enum CheckType {
  INSURANCE = 1,
  INSPECTION = 2,
  VIOLATION = 3,
  COMPREHENSIVE = 4,
  RECHECK = 5
}

export const CheckTypeMap: Record<number, string> = {
  [CheckType.INSURANCE]: '保险校验',
  [CheckType.INSPECTION]: '年检校验',
  [CheckType.VIOLATION]: '违章校验',
  [CheckType.COMPREHENSIVE]: '综合校验',
  [CheckType.RECHECK]: '合规复查'
}

export enum CheckMode {
  MANUAL = 1,
  AUTO = 2,
  BATCH = 3
}

export const CheckModeMap: Record<number, string> = {
  [CheckMode.MANUAL]: '手动校验',
  [CheckMode.AUTO]: '自动校验',
  [CheckMode.BATCH]: '批量校验'
}

export enum CheckStatus {
  IN_PROGRESS = 0,
  PASSED = 1,
  FAILED = 2,
  PARTIAL = 3
}

export const CheckStatusMap: Record<number, string> = {
  [CheckStatus.IN_PROGRESS]: '校验中',
  [CheckStatus.PASSED]: '校验通过',
  [CheckStatus.FAILED]: '校验失败',
  [CheckStatus.PARTIAL]: '部分通过'
}

export const CheckStatusColorMap: Record<number, string> = {
  [CheckStatus.IN_PROGRESS]: '#e6a23c',
  [CheckStatus.PASSED]: '#67c23a',
  [CheckStatus.FAILED]: '#f56c6c',
  [CheckStatus.PARTIAL]: '#409eff'
}

export enum ComplianceViolationType {
  INSURANCE_EXPIRED = 1,
  INSPECTION_EXPIRED = 2,
  UNRESOLVED_VIOLATION = 3,
  PARAM_MISMATCH = 4,
  FALSE_DECLARATION = 5,
  MISSED_CHECK = 6,
  OTHER = 7
}

export const ComplianceViolationTypeMap: Record<number, string> = {
  [ComplianceViolationType.INSURANCE_EXPIRED]: '保险过期',
  [ComplianceViolationType.INSPECTION_EXPIRED]: '年检过期',
  [ComplianceViolationType.UNRESOLVED_VIOLATION]: '违章未处理',
  [ComplianceViolationType.PARAM_MISMATCH]: '参数不符',
  [ComplianceViolationType.FALSE_DECLARATION]: '虚假申报',
  [ComplianceViolationType.MISSED_CHECK]: '漏审',
  [ComplianceViolationType.OTHER]: '其他'
}

export enum ComplianceViolationLevel {
  MINOR = 1,
  MODERATE = 2,
  SEVERE = 3,
  CRITICAL = 4
}

export const ComplianceViolationLevelMap: Record<number, string> = {
  [ComplianceViolationLevel.MINOR]: '轻微',
  [ComplianceViolationLevel.MODERATE]: '一般',
  [ComplianceViolationLevel.SEVERE]: '严重',
  [ComplianceViolationLevel.CRITICAL]: '重大'
}

export enum ComplianceViolationStatus {
  PENDING = 0,
  IN_PROGRESS = 1,
  RESOLVED = 2,
  IGNORED = 3,
  OVERDUE = 4
}

export const ComplianceViolationStatusMap: Record<number, string> = {
  [ComplianceViolationStatus.PENDING]: '待处理',
  [ComplianceViolationStatus.IN_PROGRESS]: '整改中',
  [ComplianceViolationStatus.RESOLVED]: '已整改',
  [ComplianceViolationStatus.IGNORED]: '已忽略',
  [ComplianceViolationStatus.OVERDUE]: '逾期未改'
}

export enum AlertType {
  MISSED_CHECK = 1,
  FALSE_COMPLIANCE = 2,
  DATA_INCONSISTENCY = 3,
  COMPLIANCE_RISK = 4,
  RECTIFICATION_OVERDUE = 5,
  CHECK_OVERDUE = 6
}

export const AlertTypeMap: Record<number, string> = {
  [AlertType.MISSED_CHECK]: '漏审预警',
  [AlertType.FALSE_COMPLIANCE]: '虚假合规',
  [AlertType.DATA_INCONSISTENCY]: '数据不一致',
  [AlertType.COMPLIANCE_RISK]: '合规风险',
  [AlertType.RECTIFICATION_OVERDUE]: '整改逾期',
  [AlertType.CHECK_OVERDUE]: '校验超期'
}

export enum AlertLevel {
  INFO = 1,
  WARNING = 2,
  SEVERE = 3
}

export const AlertLevelMap: Record<number, string> = {
  [AlertLevel.INFO]: '提示',
  [AlertLevel.WARNING]: '警告',
  [AlertLevel.SEVERE]: '严重'
}

export const AlertLevelColorMap: Record<number, string> = {
  [AlertLevel.INFO]: '#409eff',
  [AlertLevel.WARNING]: '#e6a23c',
  [AlertLevel.SEVERE]: '#f56c6c'
}

export enum AlertStatus {
  UNHANDLED = 0,
  HANDLING = 1,
  RESOLVED = 2,
  IGNORED = 3
}

export const AlertStatusMap: Record<number, string> = {
  [AlertStatus.UNHANDLED]: '未处理',
  [AlertStatus.HANDLING]: '处理中',
  [AlertStatus.RESOLVED]: '已解决',
  [AlertStatus.IGNORED]: '已忽略'
}

export enum DiscoverySource {
  COMPLIANCE_CHECK = 1,
  OPERATION_INSPECTION = 2,
  COMPLAINT = 3,
  TRAFFIC_NOTICE = 4,
  OTHER = 5
}

export const DiscoverySourceMap: Record<number, string> = {
  [DiscoverySource.COMPLIANCE_CHECK]: '合规校验',
  [DiscoverySource.OPERATION_INSPECTION]: '运营巡检',
  [DiscoverySource.COMPLAINT]: '投诉举报',
  [DiscoverySource.TRAFFIC_NOTICE]: '交管通报',
  [DiscoverySource.OTHER]: '其他'
}

export enum MaintenancePriority {
  URGENT = 1,
  NORMAL = 2,
  LOW = 3
}

export const MaintenancePriorityMap: Record<number, string> = {
  [MaintenancePriority.URGENT]: '紧急',
  [MaintenancePriority.NORMAL]: '一般',
  [MaintenancePriority.LOW]: '低优先'
}

export const MaintenancePriorityColorMap: Record<number, string> = {
  [MaintenancePriority.URGENT]: '#f56c6c',
  [MaintenancePriority.NORMAL]: '#e6a23c',
  [MaintenancePriority.LOW]: '#67c23a'
}

export enum FaultCategory {
  ENGINE = 1,
  GEARBOX = 2,
  BRAKE = 3,
  ELECTRICAL = 4,
  SUSPENSION = 5,
  BODY = 6,
  OTHER = 7
}

export const FaultCategoryMap: Record<number, string> = {
  [FaultCategory.ENGINE]: '发动机',
  [FaultCategory.GEARBOX]: '变速箱',
  [FaultCategory.BRAKE]: '制动系统',
  [FaultCategory.ELECTRICAL]: '电气系统',
  [FaultCategory.SUSPENSION]: '悬挂系统',
  [FaultCategory.BODY]: '车身',
  [FaultCategory.OTHER]: '其他'
}

export enum MaintenanceAnomalyType {
  NONE = 0,
  FAKE_MAINTENANCE = 1,
  MISSED_INSPECTION = 2,
  WRONG_INSPECTION = 3
}

export const MaintenanceAnomalyTypeMap: Record<number, string> = {
  [MaintenanceAnomalyType.NONE]: '无异常',
  [MaintenanceAnomalyType.FAKE_MAINTENANCE]: '疑似虚假检修',
  [MaintenanceAnomalyType.MISSED_INSPECTION]: '漏检',
  [MaintenanceAnomalyType.WRONG_INSPECTION]: '错检'
}

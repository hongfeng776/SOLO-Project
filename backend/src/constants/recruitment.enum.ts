export enum JobStatus {
  DRAFT = 'draft',
  PENDING_AUDIT = 'pending_audit',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
  CLOSED = 'closed',
  PAUSED = 'paused',
}

export const JobStatusLabel: Record<JobStatus, string> = {
  [JobStatus.DRAFT]: '草稿',
  [JobStatus.PENDING_AUDIT]: '待审核',
  [JobStatus.PUBLISHED]: '已发布',
  [JobStatus.REJECTED]: '发布驳回',
  [JobStatus.CLOSED]: '已关闭',
  [JobStatus.PAUSED]: '已暂停',
};

export enum ResumeStatus {
  NEW = 'new',
  SCREENING = 'screening',
  INTERVIEW = 'interview',
  OFFER = 'offer',
  HIRED = 'hired',
  REJECTED = 'rejected',
}

export const ResumeStatusLabel: Record<ResumeStatus, string> = {
  [ResumeStatus.NEW]: '新投递',
  [ResumeStatus.SCREENING]: '初筛中',
  [ResumeStatus.INTERVIEW]: '面试中',
  [ResumeStatus.OFFER]: '已发Offer',
  [ResumeStatus.HIRED]: '已入职',
  [ResumeStatus.REJECTED]: '已淘汰',
};

export enum InterviewStage {
  PHONE = 'phone',
  FIRST = 'first',
  SECOND = 'second',
  THIRD = 'third',
  HR = 'hr',
  FINAL = 'final',
}

export const InterviewStageLabel: Record<InterviewStage, string> = {
  [InterviewStage.PHONE]: '电话面试',
  [InterviewStage.FIRST]: '一面',
  [InterviewStage.SECOND]: '二面',
  [InterviewStage.THIRD]: '三面',
  [InterviewStage.HR]: 'HR面',
  [InterviewStage.FINAL]: '终面',
};

export enum InterviewResult {
  PENDING = 'pending',
  PASS = 'pass',
  FAIL = 'fail',
  PENDING_DECISION = 'pending_decision',
}

export const InterviewResultLabel: Record<InterviewResult, string> = {
  [InterviewResult.PENDING]: '待评价',
  [InterviewResult.PASS]: '通过',
  [InterviewResult.FAIL]: '不通过',
  [InterviewResult.PENDING_DECISION]: '待定',
};

export const InterviewResultType: Record<InterviewResult, string> = {
  [InterviewResult.PENDING]: 'warning',
  [InterviewResult.PASS]: 'success',
  [InterviewResult.FAIL]: 'danger',
  [InterviewResult.PENDING_DECISION]: 'primary',
};

export enum OnboardStatus {
  PENDING_AUDIT = 'pending_audit',
  AUDIT_PASSED = 'audit_passed',
  AUDIT_REJECTED = 'audit_rejected',
  ONBOARDED = 'onboarded',
}

export const OnboardStatusLabel: Record<OnboardStatus, string> = {
  [OnboardStatus.PENDING_AUDIT]: '待审核',
  [OnboardStatus.AUDIT_PASSED]: '审核通过',
  [OnboardStatus.AUDIT_REJECTED]: '审核驳回',
  [OnboardStatus.ONBOARDED]: '已入职',
};

export const OnboardStatusType: Record<OnboardStatus, string> = {
  [OnboardStatus.PENDING_AUDIT]: 'warning',
  [OnboardStatus.AUDIT_PASSED]: 'success',
  [OnboardStatus.AUDIT_REJECTED]: 'danger',
  [OnboardStatus.ONBOARDED]: 'primary',
};

export enum OnboardOperationAction {
  CREATE = 'create',
  UPDATE = 'update',
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  RESUBMIT = 'resubmit',
  MARK_ONBOARDED = 'mark_onboarded',
  BATCH_CREATE = 'batch_create',
  BATCH_SUBMIT = 'batch_submit',
  BATCH_APPROVE = 'batch_approve',
}

export const OnboardOperationActionLabel: Record<OnboardOperationAction, string> = {
  [OnboardOperationAction.CREATE]: '创建入职登记',
  [OnboardOperationAction.UPDATE]: '修改入职信息',
  [OnboardOperationAction.SUBMIT]: '提交审核',
  [OnboardOperationAction.APPROVE]: '审核通过',
  [OnboardOperationAction.REJECT]: '审核驳回',
  [OnboardOperationAction.RESUBMIT]: '重新提交审核',
  [OnboardOperationAction.MARK_ONBOARDED]: '标记已入职',
  [OnboardOperationAction.BATCH_CREATE]: '批量创建入职登记',
  [OnboardOperationAction.BATCH_SUBMIT]: '批量提交审核',
  [OnboardOperationAction.BATCH_APPROVE]: '批量审核通过',
};

export const JOB_LEVEL_SALARY_RANGE: Record<string, { min: number; max: number }> = {
  'P1': { min: 5, max: 8 },
  'P2': { min: 8, max: 12 },
  'P3': { min: 12, max: 18 },
  'P4': { min: 18, max: 25 },
  'P5': { min: 25, max: 35 },
  'P6': { min: 35, max: 50 },
  'P7': { min: 50, max: 70 },
  'M1': { min: 15, max: 22 },
  'M2': { min: 22, max: 32 },
  'M3': { min: 32, max: 45 },
  'M4': { min: 45, max: 65 },
};

export const ONBOARD_LOCKED_STATUSES: OnboardStatus[] = [
  OnboardStatus.AUDIT_PASSED,
  OnboardStatus.ONBOARDED,
];

export enum UserRole {
  ADMIN = 'admin',
  HR = 'hr',
  INTERVIEWER = 'interviewer',
}

export const UserRoleLabel: Record<UserRole, string> = {
  [UserRole.ADMIN]: '超级管理员',
  [UserRole.HR]: 'HR专员',
  [UserRole.INTERVIEWER]: '面试官',
};

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export const GenderLabel: Record<Gender, string> = {
  [Gender.MALE]: '男',
  [Gender.FEMALE]: '女',
  [Gender.OTHER]: '其他',
};

export enum QualificationAuditStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export const QualificationAuditStatusLabel: Record<QualificationAuditStatus, string> = {
  [QualificationAuditStatus.PENDING]: '待审核',
  [QualificationAuditStatus.APPROVED]: '审核通过',
  [QualificationAuditStatus.REJECTED]: '审核驳回',
  [QualificationAuditStatus.EXPIRED]: '资质过期',
};

export enum QualificationAuditAction {
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  INVALIDATE = 'invalidate',
  RESUBMIT = 'resubmit',
}

export enum BusinessStatus {
  ACTIVE = 'active',
  REVOKED = 'revoked',
  CANCELLED = 'cancelled',
  RELOCATED = 'relocated',
}

export const BusinessStatusLabel: Record<BusinessStatus, string> = {
  [BusinessStatus.ACTIVE]: '存续',
  [BusinessStatus.REVOKED]: '吊销',
  [BusinessStatus.CANCELLED]: '注销',
  [BusinessStatus.RELOCATED]: '迁出',
};

export enum IndustryCategory {
  IT = '信息技术',
  FINANCE = '金融',
  MANUFACTURING = '制造业',
  EDUCATION = '教育',
  HEALTHCARE = '医疗健康',
  REAL_ESTATE = '房地产',
  TRADE = '贸易',
  SERVICES = '服务业',
  AGRICULTURE = '农业',
  OTHER = '其他',
}

export enum Education {
  HIGH_SCHOOL = 'high_school',
  COLLEGE = 'college',
  BACHELOR = 'bachelor',
  MASTER = 'master',
  DOCTOR = 'doctor',
}

export const EducationLabel: Record<Education, string> = {
  [Education.HIGH_SCHOOL]: '高中',
  [Education.COLLEGE]: '大专',
  [Education.BACHELOR]: '本科',
  [Education.MASTER]: '硕士',
  [Education.DOCTOR]: '博士',
};

export enum RecruitStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

export const RecruitStatusLabel: Record<RecruitStatus, string> = {
  [RecruitStatus.ACTIVE]: '招聘中',
  [RecruitStatus.PAUSED]: '暂停招聘',
  [RecruitStatus.STOPPED]: '停止招聘',
};

export enum CompanyChangeAction {
  CREATE = 'create',
  UPDATE = 'update',
  BATCH_UPDATE = 'batch_update',
  UPDATE_APPROVE = 'update_approve',
  UPDATE_REJECT = 'update_reject',
}

export const CompanyChangeActionLabel: Record<CompanyChangeAction, string> = {
  [CompanyChangeAction.CREATE]: '创建',
  [CompanyChangeAction.UPDATE]: '更新',
  [CompanyChangeAction.BATCH_UPDATE]: '批量更新',
  [CompanyChangeAction.UPDATE_APPROVE]: '审核通过',
  [CompanyChangeAction.UPDATE_REJECT]: '审核驳回',
};

export enum JobCategory {
  TECH = 'tech',
  PRODUCT = 'product',
  DESIGN = 'design',
  OPERATIONS = 'operations',
  MARKETING = 'marketing',
  HR = 'hr',
  FINANCE = 'finance',
  ADMIN = 'admin',
  SALES = 'sales',
  OTHER = 'other',
}

export const JobCategoryLabel: Record<JobCategory, string> = {
  [JobCategory.TECH]: '技术',
  [JobCategory.PRODUCT]: '产品',
  [JobCategory.DESIGN]: '设计',
  [JobCategory.OPERATIONS]: '运营',
  [JobCategory.MARKETING]: '市场',
  [JobCategory.HR]: '人事',
  [JobCategory.FINANCE]: '财务',
  [JobCategory.ADMIN]: '行政',
  [JobCategory.SALES]: '销售',
  [JobCategory.OTHER]: '其他',
};

export const IndustryJobCategoryMap: Record<string, string[]> = {
  '信息技术': [JobCategory.TECH, JobCategory.PRODUCT, JobCategory.DESIGN, JobCategory.OPERATIONS],
  '金融': [JobCategory.TECH, JobCategory.FINANCE, JobCategory.OPERATIONS, JobCategory.ADMIN],
  '制造业': [JobCategory.TECH, JobCategory.SALES, JobCategory.OPERATIONS, JobCategory.ADMIN],
  '教育': [JobCategory.TECH, JobCategory.OPERATIONS, JobCategory.MARKETING, JobCategory.ADMIN],
  '医疗健康': [JobCategory.SALES, JobCategory.OPERATIONS, JobCategory.ADMIN, JobCategory.OTHER],
  '房地产': [JobCategory.SALES, JobCategory.MARKETING, JobCategory.ADMIN, JobCategory.OTHER],
  '贸易': [JobCategory.SALES, JobCategory.MARKETING, JobCategory.OPERATIONS, JobCategory.ADMIN],
  '服务业': [JobCategory.OPERATIONS, JobCategory.SALES, JobCategory.ADMIN, JobCategory.OTHER],
  '农业': [JobCategory.OPERATIONS, JobCategory.SALES, JobCategory.ADMIN, JobCategory.OTHER],
  '其他': [JobCategory.OTHER, JobCategory.ADMIN, JobCategory.OPERATIONS, JobCategory.SALES],
};

export const ScaleRecruitRangeMap: Record<string, string[]> = {
  '少于50人': ['1-50人规模'],
  '50-100人': ['50-100人规模'],
  '100-500人': ['100-500人规模'],
  '500-1000人': ['500-1000人规模'],
  '1000人以上': ['1000人以上规模'],
};

export enum ConfigStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

export const ConfigStatusLabel: Record<ConfigStatus, string> = {
  [ConfigStatus.ENABLED]: '已启用',
  [ConfigStatus.DISABLED]: '已停用',
};

export enum ConfigLogAction {
  CREATE = 'create',
  UPDATE = 'update',
  ENABLE = 'enable',
  DISABLE = 'disable',
  BATCH_REPLACE = 'batch_replace',
}

export const ConfigLogActionLabel: Record<ConfigLogAction, string> = {
  [ConfigLogAction.CREATE]: '创建配置',
  [ConfigLogAction.UPDATE]: '修改配置',
  [ConfigLogAction.ENABLE]: '启用配置',
  [ConfigLogAction.DISABLE]: '停用配置',
  [ConfigLogAction.BATCH_REPLACE]: '批量替换',
};

export enum WorkType {
  FULL_TIME = 'full_time',
  PART_TIME = 'part_time',
  CONTRACT = 'contract',
  INTERNSHIP = 'internship',
  REMOTE = 'remote',
}

export const WorkTypeLabel: Record<WorkType, string> = {
  [WorkType.FULL_TIME]: '全职',
  [WorkType.PART_TIME]: '兼职',
  [WorkType.CONTRACT]: '合同制',
  [WorkType.INTERNSHIP]: '实习',
  [WorkType.REMOTE]: '远程办公',
};

export const DISPLAY_TAGS = [
  '明星企业', '高新企业', '独角兽', '国企', '外企', '上市公司',
  '创业公司', '500强', '行业TOP10', '发展前景好',
];

export const WELFARE_TAGS: Record<string, string[]> = {
  tech: ['技术分享', '学习补贴', '技术培训', '设备补贴', '开源贡献奖励', '黑客松'],
  product: ['产品培训', '用户研究支持', '数据分析工具', '原型工具补贴', '行业峰会'],
  design: ['设计软件授权', '设计交流', '设计培训', '创意空间', '作品集指导'],
  operations: ['运营培训', '数据工具', '项目奖金', '绩效奖金', '晋升通道'],
  marketing: ['市场活动预算', '品牌推广', '绩效提成', '渠道资源', '行业交流'],
  hr: ['HR培训', '人才发展', '员工关系', '企业文化', '团建预算'],
  finance: ['财务培训', '证书补贴', '年终奖金', '稳定福利', '专业发展'],
  admin: ['行政福利', '节日礼品', '员工关怀', '后勤保障', '下午茶'],
  sales: ['高提成', '销售奖金', '客户资源', '销售培训', '晋升空间'],
  other: ['弹性工作', '扁平管理', '团队氛围好', '公司福利好', '年度旅游'],
};

export const GENERAL_WELFARE_TAGS = [
  '五险一金', '补充医疗', '年终奖', '股票期权', '带薪年假',
  '节日福利', '生日福利', '定期体检', '团队建设', '员工宿舍',
  '交通补贴', '餐补', '通讯补贴', '住房补贴', '弹性工作',
  '远程办公', '扁平管理', '氛围轻松', '下午茶', '健身房',
];

export const VIOLATION_KEYWORDS = [
  '传销', '刷单', '网贷', '博彩', '色情', '暴力', '毒品',
  '枪支', '诈骗', '非法集资', '高利', '担保贷款',
  '日结高薪', '月入过万', '轻松过万', '包赚不赔',
  '包分配', '包就业', '包过', '保过',
];

export const FALSE_RECRUITMENT_KEYWORDS = [
  '无需经验', '零基础上岗', '人人都能做', '月薪3万',
  '年薪百万', '不用干活', '躺着赚钱', '轻松赚钱',
];

export const COMPANY_INFO_FIELDS: { key: string; label: string; weight: number }[] = [
  { key: 'name', label: '企业名称', weight: 10 },
  { key: 'creditCode', label: '统一社会信用代码', weight: 10 },
  { key: 'legalPerson', label: '法人代表', weight: 5 },
  { key: 'registeredCapital', label: '注册资本', weight: 5 },
  { key: 'industry', label: '所属行业', weight: 10 },
  { key: 'scale', label: '企业规模', weight: 10 },
  { key: 'nature', label: '企业性质', weight: 5 },
  { key: 'officeAddress', label: '办公地址', weight: 10 },
  { key: 'contactPhone', label: '联系电话', weight: 10 },
  { key: 'contactEmail', label: '联系邮箱', weight: 5 },
  { key: 'companyProfile', label: '公司简介', weight: 10 },
  { key: 'jobCategories', label: '招聘岗位分类', weight: 10 },
];

export const INFO_COMPLETENESS_THRESHOLD = 80;

export enum AccountStatus {
  NORMAL = 'normal',
  FROZEN = 'frozen',
  EXPIRED = 'expired',
}

export const AccountStatusLabel: Record<AccountStatus, string> = {
  [AccountStatus.NORMAL]: '正常',
  [AccountStatus.FROZEN]: '冻结',
  [AccountStatus.EXPIRED]: '过期',
};

export const AccountStatusType: Record<AccountStatus, string> = {
  [AccountStatus.NORMAL]: 'success',
  [AccountStatus.FROZEN]: 'warning',
  [AccountStatus.EXPIRED]: 'info',
};

export enum PermissionLogAction {
  CREATE = 'create',
  UPDATE = 'update',
  FREEZE = 'freeze',
  UNFREEZE = 'unfreeze',
  EXPIRE = 'expire',
  PERMISSION_CHANGE = 'permission_change',
  STATUS_CHANGE = 'status_change',
  BATCH_ASSIGN = 'batch_assign',
}

export const PermissionLogActionLabel: Record<PermissionLogAction, string> = {
  [PermissionLogAction.CREATE]: '创建账号',
  [PermissionLogAction.UPDATE]: '更新信息',
  [PermissionLogAction.FREEZE]: '冻结账号',
  [PermissionLogAction.UNFREEZE]: '解冻账号',
  [PermissionLogAction.EXPIRE]: '账号过期',
  [PermissionLogAction.PERMISSION_CHANGE]: '权限变更',
  [PermissionLogAction.STATUS_CHANGE]: '状态变更',
  [PermissionLogAction.BATCH_ASSIGN]: '批量分配',
};

export enum LoginStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
  ANOMALY = 'anomaly',
}

export const LoginStatusLabel: Record<LoginStatus, string> = {
  [LoginStatus.SUCCESS]: '成功',
  [LoginStatus.FAILED]: '失败',
  [LoginStatus.ANOMALY]: '异常',
};

export enum DataScope {
  ALL = 'all',
  DEPT = 'dept',
  SELF = 'self',
}

export const DataScopeLabel: Record<DataScope, string> = {
  [DataScope.ALL]: '全部数据',
  [DataScope.DEPT]: '本部门数据',
  [DataScope.SELF]: '仅自己数据',
};

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['*'],
  hr: [
    'company:view', 'company:edit',
    'job:view', 'job:create', 'job:edit', 'job:delete',
    'resume:view', 'resume:review',
    'interview:view', 'interview:arrange',
    'onboard:view', 'onboard:manage',
    'qualification:view',
    'recruitment_config:view', 'recruitment_config:edit',
  ],
  interviewer: [
    'job:view',
    'resume:view',
    'interview:view', 'interview:evaluate',
    'onboard:view',
  ],
};

export const PASSWORD_COMPLEXITY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
};

export const ANOMALY_LOGIN_THRESHOLDS = {
  maxFailedAttempts: 5,
  maxLoginLocations: 3,
  maxDailyLogins: 20,
  maxConsecutiveLogins: 10,
  maxDifferentDevices: 3,
  frequentLoginInterval: 60000,
};

export enum LoginAnomalyType {
  ABNORMAL_LOCATION = 'abnormal_location',
  ABNORMAL_DEVICE = 'abnormal_device',
  ABNORMAL_TIME = 'abnormal_time',
  ABNORMAL_FREQUENCY = 'abnormal_frequency',
  ABNORMAL_MULTI_DEVICE = 'abnormal_multi_device',
  SUSPICIOUS_SCRIPT = 'suspicious_script',
  FORGED_LOGIN = 'forged_login',
  CREDENTIAL_STUFFING = 'credential_stuffing',
  VIOLATION_IP = 'violation_ip',
  HIGH_RISK_DEVICE = 'high_risk_device',
}

export const LoginAnomalyTypeLabel: Record<LoginAnomalyType, string> = {
  [LoginAnomalyType.ABNORMAL_LOCATION]: '异地登录',
  [LoginAnomalyType.ABNORMAL_DEVICE]: '异常设备',
  [LoginAnomalyType.ABNORMAL_TIME]: '异常时间',
  [LoginAnomalyType.ABNORMAL_FREQUENCY]: '高频登录',
  [LoginAnomalyType.ABNORMAL_MULTI_DEVICE]: '多设备同时在线',
  [LoginAnomalyType.SUSPICIOUS_SCRIPT]: '可疑脚本登录',
  [LoginAnomalyType.FORGED_LOGIN]: '伪造登录',
  [LoginAnomalyType.CREDENTIAL_STUFFING]: '撞库攻击',
  [LoginAnomalyType.VIOLATION_IP]: '违规IP',
  [LoginAnomalyType.HIGH_RISK_DEVICE]: '高风险设备',
};

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export const RiskLevelLabel: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: '低风险',
  [RiskLevel.MEDIUM]: '中风险',
  [RiskLevel.HIGH]: '高风险',
  [RiskLevel.CRITICAL]: '极高风险',
};

export const RiskLevelColor: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: '#909399',
  [RiskLevel.MEDIUM]: '#e6a23c',
  [RiskLevel.HIGH]: '#f56c6c',
  [RiskLevel.CRITICAL]: '#c0392b',
};

export enum LoginRiskAction {
  ALLOW = 'allow',
  REQUIRE_VERIFY = 'require_verify',
  BLOCK = 'block',
  LOCK_DEVICE = 'lock_device',
  LOCK_ACCOUNT = 'lock_account',
}

export enum TwoFactorType {
  SMS = 'sms',
  EMAIL = 'email',
  TOTP = 'totp',
  QUESTION = 'question',
}

export const TwoFactorTypeLabel: Record<TwoFactorType, string> = {
  [TwoFactorType.SMS]: '短信验证码',
  [TwoFactorType.EMAIL]: '邮箱验证码',
  [TwoFactorType.TOTP]: '动态口令',
  [TwoFactorType.QUESTION]: '安全问题',
};

export enum OnlineStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  BUSY = 'busy',
  AWAY = 'away',
}

export const OnlineStatusLabel: Record<OnlineStatus, string> = {
  [OnlineStatus.ONLINE]: '在线',
  [OnlineStatus.OFFLINE]: '离线',
  [OnlineStatus.BUSY]: '忙碌',
  [OnlineStatus.AWAY]: '离开',
};

export enum ParseStatus {
  PENDING = 'pending',
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

export const ParseStatusLabel: Record<ParseStatus, string> = {
  [ParseStatus.PENDING]: '待解析',
  [ParseStatus.SUCCESS]: '解析成功',
  [ParseStatus.PARTIAL]: '部分解析',
  [ParseStatus.FAILED]: '解析失败',
};

export const ParseStatusType: Record<ParseStatus, string> = {
  [ParseStatus.PENDING]: 'info',
  [ParseStatus.SUCCESS]: 'success',
  [ParseStatus.PARTIAL]: 'warning',
  [ParseStatus.FAILED]: 'danger',
};

export enum ResumeSource {
  MANUAL = 'manual',
  ZHILIAN = 'zhilian',
  BOSS = 'boss',
  LAGOU = 'lagou',
  WUYI = '51job',
  LIEPIN = 'liepin',
  INTERNAL = 'internal',
  RECOMMEND = 'recommend',
  OTHER = 'other',
}

export const ResumeSourceLabel: Record<ResumeSource, string> = {
  [ResumeSource.MANUAL]: '手动上传',
  [ResumeSource.ZHILIAN]: '智联招聘',
  [ResumeSource.BOSS]: 'BOSS直聘',
  [ResumeSource.LAGOU]: '拉勾网',
  [ResumeSource.WUYI]: '前程无忧',
  [ResumeSource.LIEPIN]: '猎聘网',
  [ResumeSource.INTERNAL]: '内部推荐',
  [ResumeSource.RECOMMEND]: '猎头推荐',
  [ResumeSource.OTHER]: '其他渠道',
};

export enum ResumeCollectMode {
  AUTO = 'auto',
  MANUAL = 'manual',
}

export const ResumeCollectModeLabel: Record<ResumeCollectMode, string> = {
  [ResumeCollectMode.AUTO]: '自动收录',
  [ResumeCollectMode.MANUAL]: '手动上传',
};

export const ALLOWED_RESUME_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png'];
export const MAX_RESUME_FILE_SIZE = 10 * 1024 * 1024;

export const CORE_PARSE_FIELDS = [
  'name',
  'phone',
  'education',
  'experience',
  'expectedSalary',
  'currentPosition',
  'city',
];

export enum MatchLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  NONE = 'none',
}

export const MatchLevelLabel: Record<MatchLevel, string> = {
  [MatchLevel.HIGH]: '高匹配',
  [MatchLevel.MEDIUM]: '中匹配',
  [MatchLevel.LOW]: '低匹配',
  [MatchLevel.NONE]: '不匹配',
};

export const MatchLevelType: Record<MatchLevel, string> = {
  [MatchLevel.HIGH]: 'success',
  [MatchLevel.MEDIUM]: 'primary',
  [MatchLevel.LOW]: 'warning',
  [MatchLevel.NONE]: 'danger',
};

export const MATCH_SCORE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 40,
  NONE: 0,
};

export enum ResumeTag {
  QUALITY = 'quality',
  FOLLOW_UP = 'follow_up',
  INVALID = 'invalid',
}

export const ResumeTagLabel: Record<ResumeTag, string> = {
  [ResumeTag.QUALITY]: '优质',
  [ResumeTag.FOLLOW_UP]: '待跟进',
  [ResumeTag.INVALID]: '无效',
};

export const ResumeTagType: Record<ResumeTag, string> = {
  [ResumeTag.QUALITY]: 'success',
  [ResumeTag.FOLLOW_UP]: 'warning',
  [ResumeTag.INVALID]: 'danger',
};

export enum ScreenAction {
  SCREEN = 'screen',
  MATCH = 'match',
  TAG = 'tag',
  BATCH_SCREEN = 'batch_screen',
  BATCH_TAG = 'batch_tag',
  REFRESH_MATCH = 'refresh_match',
}

export const ScreenActionLabel: Record<ScreenAction, string> = {
  [ScreenAction.SCREEN]: '筛选',
  [ScreenAction.MATCH]: '匹配',
  [ScreenAction.TAG]: '标记',
  [ScreenAction.BATCH_SCREEN]: '批量筛选',
  [ScreenAction.BATCH_TAG]: '批量标记',
  [ScreenAction.REFRESH_MATCH]: '刷新匹配',
};

export enum InterviewSessionStatus {
  PENDING_APPOINT = 'pending_appoint',
  APPOINTED = 'appointed',
  PENDING_INTERVIEW = 'pending_interview',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export const InterviewSessionStatusLabel: Record<InterviewSessionStatus, string> = {
  [InterviewSessionStatus.PENDING_APPOINT]: '待预约',
  [InterviewSessionStatus.APPOINTED]: '预约成功',
  [InterviewSessionStatus.PENDING_INTERVIEW]: '待面试',
  [InterviewSessionStatus.COMPLETED]: '面试完成',
  [InterviewSessionStatus.CANCELLED]: '面试取消',
};

export enum InterviewAction {
  CREATE = 'create',
  APPOINT = 'appoint',
  CONFIRM = 'confirm',
  COMPLETE = 'complete',
  CANCEL = 'cancel',
  UPDATE = 'update',
  BATCH_APPOINT = 'batch_appoint',
  BATCH_CANCEL = 'batch_cancel',
  BATCH_SORT = 'batch_sort',
}

export const InterviewActionLabel: Record<InterviewAction, string> = {
  [InterviewAction.CREATE]: '创建面试预约',
  [InterviewAction.APPOINT]: '确认预约',
  [InterviewAction.CONFIRM]: '面试官确认',
  [InterviewAction.COMPLETE]: '面试完成',
  [InterviewAction.CANCEL]: '取消面试',
  [InterviewAction.UPDATE]: '修改场次信息',
  [InterviewAction.BATCH_APPOINT]: '批量预约',
  [InterviewAction.BATCH_CANCEL]: '批量取消',
  [InterviewAction.BATCH_SORT]: '批量排序',
};

export enum InterviewCancelReasonType {
  CANDIDATE = 'candidate',
  INTERVIEWER = 'interviewer',
  COMPANY = 'company',
  OTHER = 'other',
}

export const InterviewCancelReasonTypeLabel: Record<InterviewCancelReasonType, string> = {
  [InterviewCancelReasonType.CANDIDATE]: '候选人原因',
  [InterviewCancelReasonType.INTERVIEWER]: '面试官原因',
  [InterviewCancelReasonType.COMPANY]: '公司调整',
  [InterviewCancelReasonType.OTHER]: '其他原因',
};

export enum InterviewBatchSortType {
  MATCH_SCORE_DESC = 'match_score_desc',
  JOB_URGENCY_DESC = 'job_urgency_desc',
  MATCH_AND_URGENCY = 'match_and_urgency',
}

export const InterviewBatchSortTypeLabel: Record<InterviewBatchSortType, string> = {
  [InterviewBatchSortType.MATCH_SCORE_DESC]: '按匹配度降序',
  [InterviewBatchSortType.JOB_URGENCY_DESC]: '按岗位紧急程度降序',
  [InterviewBatchSortType.MATCH_AND_URGENCY]: '匹配度+紧急程度综合',
};

export const INTERVIEW_STATUS_FLOW: Record<InterviewSessionStatus, InterviewSessionStatus[]> = {
  [InterviewSessionStatus.PENDING_APPOINT]: [InterviewSessionStatus.APPOINTED, InterviewSessionStatus.CANCELLED],
  [InterviewSessionStatus.APPOINTED]: [InterviewSessionStatus.PENDING_INTERVIEW, InterviewSessionStatus.CANCELLED],
  [InterviewSessionStatus.PENDING_INTERVIEW]: [InterviewSessionStatus.COMPLETED, InterviewSessionStatus.CANCELLED],
  [InterviewSessionStatus.COMPLETED]: [],
  [InterviewSessionStatus.CANCELLED]: [],
};

export const LOCKED_INTERVIEW_STATUSES: InterviewSessionStatus[] = [
  InterviewSessionStatus.APPOINTED,
  InterviewSessionStatus.PENDING_INTERVIEW,
  InterviewSessionStatus.COMPLETED,
];

export const MUTEX_SCREEN_CONDITIONS: string[][] = [
  ['isFreshGraduate', 'minExperience'],
  ['isFreshGraduate', 'experienceRange'],
];

export const SCREEN_CONDITION_FIELDS = [
  'education',
  'minEducation',
  'minExperience',
  'maxExperience',
  'experienceRange',
  'minSalary',
  'maxSalary',
  'skillTags',
  'city',
  'isFreshGraduate',
  'matchLevel',
  'resumeTag',
];

export enum InterviewScoreDimension {
  PROFESSIONAL_SKILL = 'professional_skill',
  WORK_EXPERIENCE = 'work_experience',
  COMMUNICATION = 'communication',
  LEARNING_ABILITY = 'learning_ability',
  TEAMWORK = 'teamwork',
  CULTURE_FIT = 'culture_fit',
  STABILITY = 'stability',
  COMPREHENSIVE = 'comprehensive',
}

export const InterviewScoreDimensionLabel: Record<InterviewScoreDimension, string> = {
  [InterviewScoreDimension.PROFESSIONAL_SKILL]: '专业技能',
  [InterviewScoreDimension.WORK_EXPERIENCE]: '工作经验',
  [InterviewScoreDimension.COMMUNICATION]: '沟通表达',
  [InterviewScoreDimension.LEARNING_ABILITY]: '学习能力',
  [InterviewScoreDimension.TEAMWORK]: '团队协作',
  [InterviewScoreDimension.CULTURE_FIT]: '文化契合',
  [InterviewScoreDimension.STABILITY]: '稳定性',
  [InterviewScoreDimension.COMPREHENSIVE]: '综合印象',
};

export const INTERVIEW_SCORE_RANGE = {
  MIN: 0,
  MAX: 100,
  PASS_THRESHOLD: 60,
  EXCELLENT_THRESHOLD: 80,
  FAIL_THRESHOLD: 40,
};

export const SCORE_RESULT_MATCH_RULES: Array<{
  minScore: number;
  maxScore: number;
  allowedResults: InterviewResult[];
  defaultResult: InterviewResult;
}> = [
  { minScore: 0, maxScore: 40, allowedResults: [InterviewResult.FAIL], defaultResult: InterviewResult.FAIL },
  { minScore: 41, maxScore: 59, allowedResults: [InterviewResult.FAIL, InterviewResult.PENDING_DECISION], defaultResult: InterviewResult.PENDING_DECISION },
  { minScore: 60, maxScore: 79, allowedResults: [InterviewResult.PASS, InterviewResult.PENDING_DECISION], defaultResult: InterviewResult.PENDING_DECISION },
  { minScore: 80, maxScore: 100, allowedResults: [InterviewResult.PASS, InterviewResult.PENDING_DECISION], defaultResult: InterviewResult.PASS },
];

export const INTERVIEW_RECORD_VALIDATION_RULES = {
  MIN_EVALUATION_LENGTH: 10,
  MIN_FEEDBACK_LENGTH: 5,
  ANTI_DUPLICATE_SUBMIT_MS: 300,
  ABNORMAL_SCORE_DEVIATION: 20,
  OVERDUE_SUPPLEMENT_DAYS: 7,
};

export enum InterviewBatchOperationType {
  SUPPLEMENT_OVERDUE = 'supplement_overdue',
  UPDATE_PENDING_RESULTS = 'update_pending_results',
}

export const InterviewBatchOperationTypeLabel: Record<InterviewBatchOperationType, string> = {
  [InterviewBatchOperationType.SUPPLEMENT_OVERDUE]: '批量补录逾期记录',
  [InterviewBatchOperationType.UPDATE_PENDING_RESULTS]: '批量修改待定结果',
};

export enum InterviewAbnormalScoreType {
  NONE = 'none',
  TOO_HIGH = 'too_high',
  TOO_LOW = 'too_low',
  DEVIATION = 'deviation',
}

export const InterviewAbnormalScoreTypeLabel: Record<InterviewAbnormalScoreType, string> = {
  [InterviewAbnormalScoreType.NONE]: '正常',
  [InterviewAbnormalScoreType.TOO_HIGH]: '异常偏高',
  [InterviewAbnormalScoreType.TOO_LOW]: '异常偏低',
  [InterviewAbnormalScoreType.DEVIATION]: '偏离标准',
};

export enum InterviewerStatus {
  IDLE = 'idle',
  INTERVIEWING = 'interviewing',
  BUSY = 'busy',
  ON_LEAVE = 'on_leave',
}

export const InterviewerStatusLabel: Record<InterviewerStatus, string> = {
  [InterviewerStatus.IDLE]: '空闲',
  [InterviewerStatus.INTERVIEWING]: '面试中',
  [InterviewerStatus.BUSY]: '忙碌',
  [InterviewerStatus.ON_LEAVE]: '休假',
};

export const InterviewerStatusType: Record<InterviewerStatus, string> = {
  [InterviewerStatus.IDLE]: 'success',
  [InterviewerStatus.INTERVIEWING]: 'primary',
  [InterviewerStatus.BUSY]: 'warning',
  [InterviewerStatus.ON_LEAVE]: 'info',
};

export const BUSY_STATUS_CANNOT_ALLOCATE: InterviewerStatus[] = [
  InterviewerStatus.BUSY,
  InterviewerStatus.ON_LEAVE,
];

export enum InterviewerDomain {
  TECH = 'tech',
  PRODUCT = 'product',
  DESIGN = 'design',
  HR = 'hr',
  FINANCE = 'finance',
  OPERATIONS = 'operations',
  MARKETING = 'marketing',
  ADMIN = 'admin',
  OTHER = 'other',
}

export const InterviewerDomainLabel: Record<InterviewerDomain, string> = {
  [InterviewerDomain.TECH]: '技术类',
  [InterviewerDomain.PRODUCT]: '产品类',
  [InterviewerDomain.DESIGN]: '设计类',
  [InterviewerDomain.HR]: '人事类',
  [InterviewerDomain.FINANCE]: '财务类',
  [InterviewerDomain.OPERATIONS]: '运营类',
  [InterviewerDomain.MARKETING]: '市场类',
  [InterviewerDomain.ADMIN]: '行政类',
  [InterviewerDomain.OTHER]: '其他',
};

export const JOB_CATEGORY_DOMAIN_MAP: Record<string, InterviewerDomain> = {
  [JobCategory.TECH]: InterviewerDomain.TECH,
  [JobCategory.PRODUCT]: InterviewerDomain.PRODUCT,
  [JobCategory.DESIGN]: InterviewerDomain.DESIGN,
  [JobCategory.HR]: InterviewerDomain.HR,
  [JobCategory.FINANCE]: InterviewerDomain.FINANCE,
  [JobCategory.OPERATIONS]: InterviewerDomain.OPERATIONS,
  [JobCategory.MARKETING]: InterviewerDomain.MARKETING,
  [JobCategory.ADMIN]: InterviewerDomain.ADMIN,
  [JobCategory.SALES]: InterviewerDomain.MARKETING,
  [JobCategory.OTHER]: InterviewerDomain.OTHER,
};

export const DOMAIN_CROSS_MATCH: Record<InterviewerDomain, InterviewerDomain[]> = {
  [InterviewerDomain.TECH]: [InterviewerDomain.TECH, InterviewerDomain.PRODUCT],
  [InterviewerDomain.PRODUCT]: [InterviewerDomain.PRODUCT, InterviewerDomain.TECH, InterviewerDomain.DESIGN],
  [InterviewerDomain.DESIGN]: [InterviewerDomain.DESIGN, InterviewerDomain.PRODUCT],
  [InterviewerDomain.HR]: [InterviewerDomain.HR, InterviewerDomain.ADMIN],
  [InterviewerDomain.FINANCE]: [InterviewerDomain.FINANCE, InterviewerDomain.ADMIN],
  [InterviewerDomain.OPERATIONS]: [InterviewerDomain.OPERATIONS, InterviewerDomain.MARKETING],
  [InterviewerDomain.MARKETING]: [InterviewerDomain.MARKETING, InterviewerDomain.OPERATIONS],
  [InterviewerDomain.ADMIN]: [InterviewerDomain.ADMIN, InterviewerDomain.HR],
  [InterviewerDomain.OTHER]: [InterviewerDomain.OTHER],
};

export enum AllocationAction {
  ALLOCATE = 'allocate',
  REPLACE = 'replace',
  BATCH_REPLACE = 'batch_replace',
  BATCH_SCHEDULE = 'batch_schedule',
  STATUS_CHANGE = 'status_change',
}

export const AllocationActionLabel: Record<AllocationAction, string> = {
  [AllocationAction.ALLOCATE]: '调配面试官',
  [AllocationAction.REPLACE]: '替换面试官',
  [AllocationAction.BATCH_REPLACE]: '批量替换面试官',
  [AllocationAction.BATCH_SCHEDULE]: '批量调整排班',
  [AllocationAction.STATUS_CHANGE]: '面试官状态变更',
};

export enum AllocationValidationType {
  OVERLOAD = 'overload',
  CROSS_DOMAIN = 'cross_domain',
  NO_PERMISSION = 'no_permission',
  STATUS_BLOCKED = 'status_blocked',
  TIME_CONFLICT = 'time_conflict',
}

export const INTERVIEWER_ALLOCATION_RULES = {
  MAX_DAILY_INTERVIEWS: 6,
  MAX_WEEKLY_INTERVIEWS: 25,
  MAX_MONTHLY_INTERVIEWS: 80,
  CROSS_DOMAIN_CONFIRM_REQUIRED: true,
  OVERLOAD_THRESHOLD: 0.8,
};

export enum WarningStatus {
  NORMAL = 'normal',
  APPROACHING = 'approaching',
  OVERDUE = 'overdue',
  HANDLED = 'handled',
}

export const WarningStatusLabel: Record<WarningStatus, string> = {
  [WarningStatus.NORMAL]: '正常',
  [WarningStatus.APPROACHING]: '即将逾期',
  [WarningStatus.OVERDUE]: '已逾期',
  [WarningStatus.HANDLED]: '已处理',
};

export const WarningStatusType: Record<WarningStatus, string> = {
  [WarningStatus.NORMAL]: 'success',
  [WarningStatus.APPROACHING]: 'warning',
  [WarningStatus.OVERDUE]: 'danger',
  [WarningStatus.HANDLED]: 'info',
};

export enum WarningLevel {
  NORMAL = 'normal',
  APPROACHING_24H = 'approaching_24h',
  APPROACHING_1H = 'approaching_1h',
  OVERDUE = 'overdue',
}

export const WarningLevelLabel: Record<WarningLevel, string> = {
  [WarningLevel.NORMAL]: '正常',
  [WarningLevel.APPROACHING_24H]: '临近24小时',
  [WarningLevel.APPROACHING_1H]: '临近1小时',
  [WarningLevel.OVERDUE]: '已逾期',
};

export const WarningLevelType: Record<WarningLevel, string> = {
  [WarningLevel.NORMAL]: 'success',
  [WarningLevel.APPROACHING_24H]: 'warning',
  [WarningLevel.APPROACHING_1H]: 'danger',
  [WarningLevel.OVERDUE]: 'danger',
};

export const WARNING_LEVEL_ORDER: Record<WarningLevel, number> = {
  [WarningLevel.NORMAL]: 0,
  [WarningLevel.APPROACHING_24H]: 1,
  [WarningLevel.APPROACHING_1H]: 2,
  [WarningLevel.OVERDUE]: 3,
};

export enum OverdueReasonType {
  INTERVIEWER_ABSENT = 'interviewer_absent',
  CANDIDATE_ABSENT = 'candidate_absent',
  SCHEDULE_CONFLICT = 'schedule_conflict',
  SYSTEM_ERROR = 'system_error',
  FORCE_MAJEURE = 'force_majeure',
  OTHER = 'other',
}

export const OverdueReasonTypeLabel: Record<OverdueReasonType, string> = {
  [OverdueReasonType.INTERVIEWER_ABSENT]: '面试官缺席',
  [OverdueReasonType.CANDIDATE_ABSENT]: '候选人缺席',
  [OverdueReasonType.SCHEDULE_CONFLICT]: '日程冲突',
  [OverdueReasonType.SYSTEM_ERROR]: '系统故障',
  [OverdueReasonType.FORCE_MAJEURE]: '不可抗力',
  [OverdueReasonType.OTHER]: '其他原因',
};

export enum WarningAction {
  AUTO_TRIGGER = 'auto_trigger',
  HANDLE_OVERDUE = 'handle_overdue',
  BATCH_HANDLE = 'batch_handle',
  BATCH_POSTPONE = 'batch_postpone',
  DISMISS_WARNING = 'dismiss_warning',
  FALSE_ALARM = 'false_alarm',
}

export const WarningActionLabel: Record<WarningAction, string> = {
  [WarningAction.AUTO_TRIGGER]: '系统自动触发预警',
  [WarningAction.HANDLE_OVERDUE]: '处理逾期面试',
  [WarningAction.BATCH_HANDLE]: '批量处理逾期',
  [WarningAction.BATCH_POSTPONE]: '批量延后面试时间',
  [WarningAction.DISMISS_WARNING]: '解除预警',
  [WarningAction.FALSE_ALARM]: '标记误预警',
};

export const INTERVIEW_WARNING_RULES = {
  APPROACHING_24H_MS: 24 * 60 * 60 * 1000,
  APPROACHING_1H_MS: 60 * 60 * 1000,
  OVERDUE_CHECK_INTERVAL_MS: 5 * 60 * 1000,
  MAX_OVERDUE_DAYS: 30,
  BATCH_HANDLE_LIMIT: 50,
};

export const WARNING_SORT_STRATEGIES = {
  JOB_URGENCY: 'job_urgency',
  CANDIDATE_PRIORITY: 'candidate_priority',
  WARNING_LEVEL: 'warning_level',
  INTERVIEW_TIME: 'interview_time',
};

export enum ProbationStatus {
  IN_PROBATION = 'in_probation',
  EXPIRING_SOON = 'expiring_soon',
  REVIEWING = 'reviewing',
  PASSED = 'passed',
  FAILED = 'failed',
  EXTENDED = 'extended',
}

export const ProbationStatusLabel: Record<ProbationStatus, string> = {
  [ProbationStatus.IN_PROBATION]: '试用期内',
  [ProbationStatus.EXPIRING_SOON]: '即将到期',
  [ProbationStatus.REVIEWING]: '考核中',
  [ProbationStatus.PASSED]: '试用通过',
  [ProbationStatus.FAILED]: '试用不通过',
  [ProbationStatus.EXTENDED]: '已延长',
};

export const ProbationStatusType: Record<ProbationStatus, string> = {
  [ProbationStatus.IN_PROBATION]: 'primary',
  [ProbationStatus.EXPIRING_SOON]: 'warning',
  [ProbationStatus.REVIEWING]: 'info',
  [ProbationStatus.PASSED]: 'success',
  [ProbationStatus.FAILED]: 'danger',
  [ProbationStatus.EXTENDED]: 'warning',
};

export enum ProbationOperationAction {
  CREATE = 'create',
  UPDATE = 'update',
  UPDATE_DURATION = 'update_duration',
  EXTEND = 'extend',
  PASS = 'pass',
  FAIL = 'fail',
  SET_ASSESSMENT = 'set_assessment',
  SET_ASSESSMENTS = 'set_assessments',
  BATCH_SET_ASSESSMENT = 'batch_set_assessment',
  BATCH_UPDATE_STATUS = 'batch_update_status',
  STATUS_SYNC = 'status_sync',
  SYNC_EXPIRING = 'sync_expiring',
  REFRESH_STATUS = 'refresh_status',
}

export const ProbationOperationActionLabel: Record<ProbationOperationAction, string> = {
  [ProbationOperationAction.CREATE]: '创建试用期记录',
  [ProbationOperationAction.UPDATE]: '修改试用期信息',
  [ProbationOperationAction.UPDATE_DURATION]: '调整试用期时长',
  [ProbationOperationAction.EXTEND]: '延长试用期',
  [ProbationOperationAction.PASS]: '试用通过',
  [ProbationOperationAction.FAIL]: '试用不通过',
  [ProbationOperationAction.SET_ASSESSMENT]: '设置考核指标',
  [ProbationOperationAction.SET_ASSESSMENTS]: '设置考核指标(批量)',
  [ProbationOperationAction.BATCH_SET_ASSESSMENT]: '批量设置考核指标',
  [ProbationOperationAction.BATCH_UPDATE_STATUS]: '批量更新状态',
  [ProbationOperationAction.STATUS_SYNC]: '系统状态同步',
  [ProbationOperationAction.SYNC_EXPIRING]: '同步即将到期状态',
  [ProbationOperationAction.REFRESH_STATUS]: '自动刷新状态',
};

export const PROBATION_DURATION_BY_CATEGORY: Record<string, number> = {
  full_time: 3,
  internship: 2,
  part_time: 0,
  tech: 6,
  management: 6,
  support: 3,
  tech_senior: 6,
};

export const PROBATION_ADJUST_MIN = 1;

export const PROBATION_ADJUST_MAX = 6;

export const PROBATION_WARNING_DAYS = 7;

export const PROBATION_ASSESSMENT_REQUIRED_FIELDS: string[] = [
  'workAttitude',
  'taskCompletion',
  'teamWork',
  'learningAbility',
  'professionalSkill',
];

export const PROBATION_LOCKED_STATUSES: ProbationStatus[] = [
  ProbationStatus.PASSED,
  ProbationStatus.FAILED,
];

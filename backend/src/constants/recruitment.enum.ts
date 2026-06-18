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
}

export const InterviewResultLabel: Record<InterviewResult, string> = {
  [InterviewResult.PENDING]: '待评价',
  [InterviewResult.PASS]: '通过',
  [InterviewResult.FAIL]: '不通过',
};

export enum OnboardStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  ONBOARDED = 'onboarded',
  CANCELLED = 'cancelled',
}

export const OnboardStatusLabel: Record<OnboardStatus, string> = {
  [OnboardStatus.PENDING]: '待确认',
  [OnboardStatus.CONFIRMED]: '已确认',
  [OnboardStatus.ONBOARDED]: '已入职',
  [OnboardStatus.CANCELLED]: '已取消',
};

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

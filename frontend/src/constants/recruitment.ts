export enum JobStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  PAUSED = 'paused',
}

export const JobStatusLabel: Record<JobStatus, string> = {
  [JobStatus.DRAFT]: '草稿',
  [JobStatus.PUBLISHED]: '招聘中',
  [JobStatus.CLOSED]: '已关闭',
  [JobStatus.PAUSED]: '已暂停',
};

export const JobStatusType: Record<JobStatus, string> = {
  [JobStatus.DRAFT]: 'info',
  [JobStatus.PUBLISHED]: 'success',
  [JobStatus.CLOSED]: 'danger',
  [JobStatus.PAUSED]: 'warning',
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

export const ResumeStatusType: Record<ResumeStatus, string> = {
  [ResumeStatus.NEW]: 'primary',
  [ResumeStatus.SCREENING]: 'warning',
  [ResumeStatus.INTERVIEW]: 'success',
  [ResumeStatus.OFFER]: 'success',
  [ResumeStatus.HIRED]: 'success',
  [ResumeStatus.REJECTED]: 'danger',
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

export const InterviewResultType: Record<InterviewResult, string> = {
  [InterviewResult.PENDING]: 'warning',
  [InterviewResult.PASS]: 'success',
  [InterviewResult.FAIL]: 'danger',
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

export const OnboardStatusType: Record<OnboardStatus, string> = {
  [OnboardStatus.PENDING]: 'warning',
  [OnboardStatus.CONFIRMED]: 'primary',
  [OnboardStatus.ONBOARDED]: 'success',
  [OnboardStatus.CANCELLED]: 'danger',
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

export const QualificationAuditStatusType: Record<QualificationAuditStatus, string> = {
  [QualificationAuditStatus.PENDING]: 'warning',
  [QualificationAuditStatus.APPROVED]: 'success',
  [QualificationAuditStatus.REJECTED]: 'danger',
  [QualificationAuditStatus.EXPIRED]: 'info',
};

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

export const INDUSTRY_OPTIONS = [
  { label: '信息技术', value: '信息技术' },
  { label: '金融', value: '金融' },
  { label: '制造业', value: '制造业' },
  { label: '教育', value: '教育' },
  { label: '医疗健康', value: '医疗健康' },
  { label: '房地产', value: '房地产' },
  { label: '贸易', value: '贸易' },
  { label: '服务业', value: '服务业' },
  { label: '农业', value: '农业' },
  { label: '其他', value: '其他' },
];

export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

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

export const RecruitStatusType: Record<RecruitStatus, string> = {
  [RecruitStatus.ACTIVE]: 'success',
  [RecruitStatus.PAUSED]: 'warning',
  [RecruitStatus.STOPPED]: 'danger',
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

export const AuditStatusLabel: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
};

export const AuditStatusType: Record<string, string> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
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

export const SCALE_OPTIONS = [
  { label: '少于50人', value: '少于50人' },
  { label: '50-100人', value: '50-100人' },
  { label: '100-500人', value: '100-500人' },
  { label: '500-1000人', value: '500-1000人' },
  { label: '1000人以上', value: '1000人以上' },
];

export const NATURE_OPTIONS = [
  { label: '国企', value: '国企' },
  { label: '民营企业', value: '民营企业' },
  { label: '外资企业', value: '外资企业' },
  { label: '合资企业', value: '合资企业' },
  { label: '上市公司', value: '上市公司' },
  { label: '创业公司', value: '创业公司' },
];

export const RECRUIT_STATUS_OPTIONS = [
  { label: '招聘中', value: 'active' },
  { label: '暂停招聘', value: 'paused' },
  { label: '停止招聘', value: 'stopped' },
];

export const INDUSTRY_JOB_CATEGORY_MAP: Record<string, string[]> = {
  '信息技术': ['tech', 'product', 'design', 'operations'],
  '金融': ['tech', 'finance', 'operations', 'admin'],
  '制造业': ['tech', 'sales', 'operations', 'admin'],
  '教育': ['tech', 'operations', 'marketing', 'admin'],
  '医疗健康': ['sales', 'operations', 'admin', 'other'],
  '房地产': ['sales', 'marketing', 'admin', 'other'],
  '贸易': ['sales', 'marketing', 'operations', 'admin'],
  '服务业': ['operations', 'sales', 'admin', 'other'],
  '农业': ['operations', 'sales', 'admin', 'other'],
  '其他': ['other', 'admin', 'operations', 'sales'],
};

export enum ConfigStatus {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
}

export const ConfigStatusLabel: Record<ConfigStatus, string> = {
  [ConfigStatus.ENABLED]: '已启用',
  [ConfigStatus.DISABLED]: '已停用',
};

export const ConfigStatusType: Record<ConfigStatus, string> = {
  [ConfigStatus.ENABLED]: 'success',
  [ConfigStatus.DISABLED]: 'info',
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

export const INFO_COMPLETENESS_THRESHOLD = 80;

export const ACTIVITY_LEVEL_OPTIONS = [
  { label: '高活跃度（70分以上）', value: 70 },
  { label: '中活跃度（40分以上）', value: 40 },
  { label: '低活跃度（20分以上）', value: 20 },
];

export const POSITION_GAP_OPTIONS = [
  { label: '10人以上缺口', value: 10 },
  { label: '50人以上缺口', value: 50 },
  { label: '100人以上缺口', value: 100 },
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

export const LoginStatusType: Record<LoginStatus, string> = {
  [LoginStatus.SUCCESS]: 'success',
  [LoginStatus.FAILED]: 'danger',
  [LoginStatus.ANOMALY]: 'warning',
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

export const ROLE_OPTIONS = [
  { label: '超级管理员', value: 'admin' },
  { label: 'HR专员', value: 'hr' },
  { label: '面试官', value: 'interviewer' },
];

export const ACCOUNT_STATUS_OPTIONS = [
  { label: '正常', value: 'normal' },
  { label: '冻结', value: 'frozen' },
  { label: '过期', value: 'expired' },
];

export const DATA_SCOPE_OPTIONS = [
  { label: '全部数据', value: 'all' },
  { label: '本部门数据', value: 'dept' },
  { label: '仅自己数据', value: 'self' },
];

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

export const OPERATION_FREQUENCY_OPTIONS = [
  { label: '高频（100次以上）', value: 100 },
  { label: '中频（50次以上）', value: 50 },
  { label: '低频（10次以上）', value: 10 },
];

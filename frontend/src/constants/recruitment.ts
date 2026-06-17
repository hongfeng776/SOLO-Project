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

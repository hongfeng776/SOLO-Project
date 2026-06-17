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

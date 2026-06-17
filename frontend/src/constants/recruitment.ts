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

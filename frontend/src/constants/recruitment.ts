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

export const JobStatusType: Record<JobStatus, string> = {
  [JobStatus.DRAFT]: 'info',
  [JobStatus.PENDING_AUDIT]: 'warning',
  [JobStatus.PUBLISHED]: 'success',
  [JobStatus.REJECTED]: 'danger',
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

export interface ScoreResultRule {
  minScore: number;
  maxScore: number;
  allowedResults: InterviewResult[];
  defaultResult: InterviewResult;
}

export const SCORE_RESULT_MATCH_RULES: ScoreResultRule[] = [
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

export const InterviewAbnormalScoreColor: Record<InterviewAbnormalScoreType, string> = {
  [InterviewAbnormalScoreType.NONE]: '',
  [InterviewAbnormalScoreType.TOO_HIGH]: '#f56c6c',
  [InterviewAbnormalScoreType.TOO_LOW]: '#e6a23c',
  [InterviewAbnormalScoreType.DEVIATION]: '#909399',
};

export const INTERVIEW_RESULT_OPTIONS = [
  { value: InterviewResult.PASS, label: '通过', type: 'success' as const },
  { value: InterviewResult.PENDING_DECISION, label: '待定', type: 'primary' as const },
  { value: InterviewResult.FAIL, label: '不通过', type: 'danger' as const },
];

export const INTERVIEW_ERROR_CODE_MAP: Record<string, string> = {
  INVALID_SESSION_STATUS: '场次状态不允许录入记录',
  DUPLICATE_SUBMIT: '操作过于频繁，请稍候再试',
  VALIDATION_ERROR: '填写内容不合规，请检查',
  CANDIDATE_RESULT_CONFLICT: '候选人多场次结果存在冲突',
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
  [OnboardOperationAction.CREATE]: '创建',
  [OnboardOperationAction.UPDATE]: '更新',
  [OnboardOperationAction.SUBMIT]: '提交审核',
  [OnboardOperationAction.APPROVE]: '审核通过',
  [OnboardOperationAction.REJECT]: '审核驳回',
  [OnboardOperationAction.RESUBMIT]: '重新提交',
  [OnboardOperationAction.MARK_ONBOARDED]: '标记已入职',
  [OnboardOperationAction.BATCH_CREATE]: '批量创建',
  [OnboardOperationAction.BATCH_SUBMIT]: '批量提交',
  [OnboardOperationAction.BATCH_APPROVE]: '批量审核通过',
};

export const JOB_LEVEL_OPTIONS = [
  { label: 'P1', value: 'P1' },
  { label: 'P2', value: 'P2' },
  { label: 'P3', value: 'P3' },
  { label: 'P4', value: 'P4' },
  { label: 'P5', value: 'P5' },
  { label: 'P6', value: 'P6' },
  { label: 'P7', value: 'P7' },
  { label: 'M1', value: 'M1' },
  { label: 'M2', value: 'M2' },
  { label: 'M3', value: 'M3' },
  { label: 'M4', value: 'M4' },
];

export const JOB_LEVEL_SALARY_RANGE: Record<string, { min: number; max: number }> = {
  P1: { min: 5, max: 8 },
  P2: { min: 8, max: 12 },
  P3: { min: 12, max: 18 },
  P4: { min: 18, max: 25 },
  P5: { min: 25, max: 35 },
  P6: { min: 35, max: 50 },
  P7: { min: 50, max: 70 },
  M1: { min: 18, max: 25 },
  M2: { min: 25, max: 40 },
  M3: { min: 40, max: 60 },
  M4: { min: 60, max: 100 },
};

export const ONBOARD_LOCKED_STATUSES = [
  OnboardStatus.AUDIT_PASSED,
  OnboardStatus.ONBOARDED,
];

export const WORK_TYPE_OPTIONS = [
  { label: '全职', value: 'full_time' },
  { label: '兼职', value: 'part_time' },
  { label: '实习', value: 'internship' },
  { label: '合同制', value: 'contract' },
];

export const CONTRACT_TYPE_OPTIONS = [
  { label: '固定期限', value: 'fixed_term' },
  { label: '无固定期限', value: 'open_term' },
  { label: '以完成一定工作任务为期限', value: 'task_based' },
];

export interface OnboardRequiredField {
  key: string;
  label: string;
  type: 'input' | 'select' | 'number' | 'date' | 'email' | 'phone';
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  min?: number;
  max?: number;
  pattern?: RegExp;
  message?: string;
}

export const ONBOARD_REQUIRED_FIELDS: OnboardRequiredField[] = [
  { key: 'name', label: '姓名', type: 'input', required: true, placeholder: '请输入姓名' },
  { key: 'gender', label: '性别', type: 'select', required: true, options: [
    { label: '男', value: 'male' },
    { label: '女', value: 'female' },
    { label: '其他', value: 'other' },
  ] },
  { key: 'phone', label: '手机号', type: 'phone', required: true, placeholder: '请输入手机号',
    pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号' },
  { key: 'email', label: '邮箱', type: 'email', required: true, placeholder: '请输入邮箱',
    pattern: /^[\w.-]+@[\w.-]+\.\w+$/, message: '请输入正确的邮箱格式' },
  { key: 'idCard', label: '身份证号', type: 'input', required: true, placeholder: '请输入身份证号',
    pattern: /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/, message: '请输入正确的身份证号' },
  { key: 'education', label: '学历', type: 'select', required: true, options: [
    { label: '高中', value: 'high_school' },
    { label: '大专', value: 'college' },
    { label: '本科', value: 'bachelor' },
    { label: '硕士', value: 'master' },
    { label: '博士', value: 'doctor' },
  ] },
  { key: 'department', label: '部门', type: 'input', required: true, placeholder: '请输入部门' },
  { key: 'position', label: '职位', type: 'input', required: true, placeholder: '请输入职位' },
  { key: 'jobLevel', label: '职级', type: 'select', required: true, options: JOB_LEVEL_OPTIONS },
  { key: 'onboardDate', label: '入职日期', type: 'date', required: true, placeholder: '请选择入职日期' },
  { key: 'salaryBase', label: '基本工资', type: 'number', required: true, min: 0, placeholder: '请输入基本工资' },
  { key: 'workLocation', label: '工作地点', type: 'input', required: true, placeholder: '请输入工作地点' },
  { key: 'workType', label: '工作性质', type: 'select', required: true, options: WORK_TYPE_OPTIONS },
  { key: 'contractType', label: '合同类型', type: 'select', required: true, options: CONTRACT_TYPE_OPTIONS },
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

export const CORE_PARSE_FIELDS: { key: string; label: string }[] = [
  { key: 'name', label: '姓名' },
  { key: 'phone', label: '手机号' },
  { key: 'education', label: '学历' },
  { key: 'experience', label: '工作经验' },
  { key: 'expectedSalary', label: '期望薪资' },
  { key: 'currentPosition', label: '当前职位' },
  { key: 'city', label: '所在城市' },
];

export const RESUME_SOURCE_OPTIONS = Object.entries(ResumeSourceLabel).map(([value, label]) => ({ label, value }));

export const PARSE_STATUS_OPTIONS = Object.entries(ParseStatusLabel).map(([value, label]) => ({ label, value }));

export const COLLECT_MODE_OPTIONS = Object.entries(ResumeCollectModeLabel).map(([value, label]) => ({ label, value }));

export const MatchScoreLevel: Record<string, { min: number; max: number; label: string; color: string; type: string }> = {
  HIGH: { min: 80, max: 100, label: '高度匹配', color: '#67c23a', type: 'success' },
  MEDIUM: { min: 60, max: 79, label: '中度匹配', color: '#409eff', type: 'primary' },
  LOW: { min: 40, max: 59, label: '基本匹配', color: '#e6a23c', type: 'warning' },
  NONE: { min: 0, max: 39, label: '不太匹配', color: '#f56c6c', type: 'danger' },
};

export function getMatchScoreLevel(score: number | undefined): { label: string; color: string; type: string } {
  if (score === undefined || score === null) return { label: '未评分', color: '#909399', type: 'info' };
  for (const level of Object.values(MatchScoreLevel)) {
    if (score >= level.min && score <= level.max) {
      return { label: level.label, color: level.color, type: level.type };
    }
  }
  return { label: '未评分', color: '#909399', type: 'info' };
}

export const OPERATION_FREQUENCY_OPTIONS = [
  { label: '高频（100次以上）', value: 100 },
  { label: '中频（50次以上）', value: 50 },
  { label: '低频（10次以上）', value: 10 },
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

export const MATCH_LEVEL_OPTIONS = Object.entries(MatchLevelLabel).map(([value, label]) => ({ label, value }));

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

export const RESUME_TAG_OPTIONS = Object.entries(ResumeTagLabel).map(([value, label]) => ({ label, value }));

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

export const MATCH_SCORE_THRESHOLDS = {
  HIGH: 80,
  MEDIUM: 60,
  LOW: 40,
  NONE: 0,
};

export const MUTEX_SCREEN_CONDITIONS: string[][] = [
  ['isFreshGraduate', 'minExperience'],
  ['isFreshGraduate', 'experienceRange'],
];

export const SCREEN_CONDITION_FIELDS = [
  { key: 'education', label: '学历', type: 'select' },
  { key: 'minEducation', label: '最低学历', type: 'select' },
  { key: 'minExperience', label: '最小工作经验(年)', type: 'number' },
  { key: 'maxExperience', label: '最大工作经验(年)', type: 'number' },
  { key: 'minSalary', label: '最低薪资(K)', type: 'number' },
  { key: 'maxSalary', label: '最高薪资(K)', type: 'number' },
  { key: 'skillTags', label: '技能标签', type: 'tags' },
  { key: 'city', label: '工作地点', type: 'input' },
  { key: 'isFreshGraduate', label: '应届生', type: 'switch' },
  { key: 'matchLevel', label: '匹配等级', type: 'select' },
  { key: 'resumeTag', label: '简历标记', type: 'select' },
];

export const EDUCATION_OPTIONS = Object.entries(EducationLabel).map(([value, label]) => ({ label, value }));

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

export const InterviewSessionStatusType: Record<InterviewSessionStatus, string> = {
  [InterviewSessionStatus.PENDING_APPOINT]: 'info',
  [InterviewSessionStatus.APPOINTED]: 'primary',
  [InterviewSessionStatus.PENDING_INTERVIEW]: 'warning',
  [InterviewSessionStatus.COMPLETED]: 'success',
  [InterviewSessionStatus.CANCELLED]: 'danger',
};

export const INTERVIEW_SESSION_STATUS_OPTIONS = Object.entries(InterviewSessionStatusLabel).map(
  ([value, label]) => ({ label, value })
);

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

export const CANCEL_REASON_OPTIONS = Object.entries(InterviewCancelReasonTypeLabel).map(
  ([value, label]) => ({ label, value })
);

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

export const BATCH_SORT_OPTIONS = Object.entries(InterviewBatchSortTypeLabel).map(
  ([value, label]) => ({ label, value })
);

export const INTERVIEW_ERROR_CODE_MAP: Record<string, string> = {
  MISSING_FIELDS: '缺少必填字段',
  INVALID_TIME_RANGE: '时间范围无效',
  PAST_TIME: '面试时间已过期',
  RESUME_NOT_FOUND: '简历不存在',
  RESUME_STATUS_INVALID: '简历状态不允许预约',
  JOB_NOT_FOUND: '岗位不存在',
  JOB_STATUS_INVALID: '岗位状态不允许预约',
  DUPLICATE_APPOINTMENT: '候选人已在该岗位预约',
  INTERVIEWER_TIME_CONFLICT: '面试官时间冲突',
  ALLOCATION_VALIDATION_ERROR: '调配校验不通过',
  CROSS_DOMAIN_CONFIRM_REQUIRED: '跨领域调配需二次确认',
  NO_PERMISSION: '无权限调配该人员',
  STATUS_BLOCKED: '面试官状态不允许调配',
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

export const INTERVIEWER_STATUS_OPTIONS = Object.entries(InterviewerStatusLabel).map(
  ([value, label]) => ({ label, value })
);

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

export const INTERVIEWER_DOMAIN_OPTIONS = Object.entries(InterviewerDomainLabel).map(
  ([value, label]) => ({ label, value })
);

export const JOB_CATEGORY_DOMAIN_MAP: Record<string, InterviewerDomain> = {
  tech: InterviewerDomain.TECH,
  product: InterviewerDomain.PRODUCT,
  design: InterviewerDomain.DESIGN,
  hr: InterviewerDomain.HR,
  finance: InterviewerDomain.FINANCE,
  operations: InterviewerDomain.OPERATIONS,
  marketing: InterviewerDomain.MARKETING,
  admin: InterviewerDomain.ADMIN,
  sales: InterviewerDomain.MARKETING,
  other: InterviewerDomain.OTHER,
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

export const WARNING_STATUS_OPTIONS = Object.entries(WarningStatusLabel).map(
  ([value, label]) => ({ label, value })
);

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

export const WARNING_LEVEL_OPTIONS = Object.entries(WarningLevelLabel).map(
  ([value, label]) => ({ label, value })
);

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

export const OVERDUE_REASON_TYPE_OPTIONS = Object.entries(OverdueReasonTypeLabel).map(
  ([value, label]) => ({ label, value })
);

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
  PASSED = 'passed',
  FAILED = 'failed',
}

export const ProbationStatusLabel: Record<ProbationStatus, string> = {
  [ProbationStatus.IN_PROBATION]: '试用中',
  [ProbationStatus.EXPIRING_SOON]: '即将到期',
  [ProbationStatus.PASSED]: '已转正',
  [ProbationStatus.FAILED]: '未通过',
};

export const ProbationStatusType: Record<ProbationStatus, string> = {
  [ProbationStatus.IN_PROBATION]: 'primary',
  [ProbationStatus.EXPIRING_SOON]: 'warning',
  [ProbationStatus.PASSED]: 'success',
  [ProbationStatus.FAILED]: 'danger',
};

export const PROBATION_STATUS_OPTIONS = Object.entries(ProbationStatusLabel).map(
  ([value, label]) => ({ label, value })
);

export enum ProbationOperationAction {
  CREATE = 'create',
  UPDATE_DURATION = 'update_duration',
  SET_ASSESSMENTS = 'set_assessments',
  START_REVIEW = 'start_review',
  PASS = 'pass',
  FAIL = 'fail',
  EXTEND = 'extend',
  ARCHIVE = 'archive',
  BATCH_SET_ASSESSMENTS = 'batch_set_assessments',
  BATCH_UPDATE_STATUS = 'batch_update_status',
  SYNC_STATUS = 'sync_status',
}

export const ProbationOperationActionLabel: Record<ProbationOperationAction, string> = {
  [ProbationOperationAction.CREATE]: '创建试用期记录',
  [ProbationOperationAction.UPDATE_DURATION]: '调整试用期时长',
  [ProbationOperationAction.SET_ASSESSMENTS]: '设置考核指标',
  [ProbationOperationAction.START_REVIEW]: '发起转正考核',
  [ProbationOperationAction.PASS]: '通过转正',
  [ProbationOperationAction.FAIL]: '未通过转正',
  [ProbationOperationAction.EXTEND]: '延长试用期',
  [ProbationOperationAction.ARCHIVE]: '归档',
  [ProbationOperationAction.BATCH_SET_ASSESSMENTS]: '批量设置考核指标',
  [ProbationOperationAction.BATCH_UPDATE_STATUS]: '批量更新状态',
  [ProbationOperationAction.SYNC_STATUS]: '同步试用期状态',
};

export const PROBATION_DURATION_BY_CATEGORY: Record<string, number> = {
  tech: 3,
  product: 3,
  design: 2,
  operations: 2,
  marketing: 2,
  hr: 2,
  finance: 3,
  admin: 1,
  sales: 3,
  other: 2,
};

export const PROBATION_ADJUST_MIN = 1;
export const PROBATION_ADJUST_MAX = 6;
export const PROBATION_WARNING_DAYS = 7;

export const PROBATION_LOCKED_STATUSES: ProbationStatus[] = [
  ProbationStatus.PASSED,
  ProbationStatus.FAILED,
];

export interface AssessmentIndicator {
  indicatorName: string;
  indicatorWeight: number;
  indicatorDesc: string;
  targetValue: string;
}

export const DEFAULT_ASSESSMENT_INDICATORS: AssessmentIndicator[] = [
  {
    indicatorName: '工作态度',
    indicatorWeight: 15,
    indicatorDesc: '出勤情况、工作积极性、责任心、主动性等',
    targetValue: '遵守考勤制度，积极主动完成工作',
  },
  {
    indicatorName: '任务完成',
    indicatorWeight: 25,
    indicatorDesc: '工作任务完成的质量、效率、及时性',
    targetValue: '按时按质完成分配的各项工作任务',
  },
  {
    indicatorName: '团队协作',
    indicatorWeight: 15,
    indicatorDesc: '与团队成员沟通配合、分享协作情况',
    targetValue: '良好沟通，积极配合团队工作',
  },
  {
    indicatorName: '学习能力',
    indicatorWeight: 20,
    indicatorDesc: '对新业务、新技能的学习掌握速度',
    targetValue: '快速熟悉业务，掌握岗位所需技能',
  },
  {
    indicatorName: '专业技能',
    indicatorWeight: 25,
    indicatorDesc: '岗位专业知识、技能的掌握和运用能力',
    targetValue: '具备岗位要求的专业技能水平',
  },
];

export interface AssessmentOption {
  score: number;
  label: string;
  description: string;
}

export const PROBATION_ASSESSMENT_OPTIONS: AssessmentOption[] = [
  { score: 1, label: '很差', description: '完全不符合岗位要求，存在严重问题' },
  { score: 2, label: '较差', description: '未达到岗位基本要求，需要较大改进' },
  { score: 3, label: '一般', description: '基本符合岗位要求，有提升空间' },
  { score: 4, label: '良好', description: '较好地满足岗位要求，表现良好' },
  { score: 5, label: '优秀', description: '远超岗位要求，表现突出优秀' },
];

export const PROBATION_ASSESSMENT_PASS_SCORE = 3.0;
export const PROBATION_ASSESSMENT_EXCELLENT_SCORE = 4.5;

export const REMARK_MAX_LENGTH = 50;

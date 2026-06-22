import Company from './company.model';
import Job from './job.model';
import JobOperationLog from './job-operation-log.model';
import Resume from './resume.model';
import ResumeParseLog from './resume-parse-log.model';
import ResumeScreenLog from './resume-screen-log.model';
import ScreenTemplate from './screen-template.model';
import Interview from './interview.model';
import InterviewOperationLog from './interview-operation-log.model';
import InterviewCancelRecord from './interview-cancel-record.model';
import InterviewMessage from './interview-message.model';
import InterviewerAllocationLog from './interviewer-allocation-log.model';
import InterviewWarningLog from './interview-warning-log.model';
import Onboard from './onboard.model';
import OnboardOperationLog from './onboard-operation-log.model';
import OnboardLedger from './onboard-ledger.model';
import User from './user.model';
import Qualification from './qualification.model';
import QualificationAuditLog from './qualification-audit-log.model';
import CompanyChangeLog from './company-change-log.model';
import RecruitmentConfig from './recruitment-config.model';
import RecruitmentConfigLog from './recruitment-config-log.model';
import MessageTemplate from './message-template.model';
import MessageTemplateLog from './message-template-log.model';
import MessageDelivery from './message-delivery.model';
import MessageDeliveryLog from './message-delivery-log.model';
import MessagePermission from './message-permission.model';
import MessagePermissionLog from './message-permission-log.model';
import PermissionLog from './permission-log.model';
import LoginLog from './login-log.model';
import Probation from './probation.model';
import ProbationOperationLog from './probation-operation-log.model';
import ProbationAssessmentIndicator from './probation-assessment-indicator.model';
import Regularization from './regularization.model';
import RegularizationApprovalNodeRecord from './regularization-approval-node.model';
import RegularizationOperationLog from './regularization-operation-log.model';

Company.hasMany(Job, { foreignKey: 'companyId', as: 'jobs' });
Job.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(User, { foreignKey: 'companyId', as: 'users' });
User.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasMany(CompanyChangeLog, { foreignKey: 'companyId', as: 'changeLogs' });
CompanyChangeLog.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

Company.hasOne(RecruitmentConfig, { foreignKey: 'companyId', as: 'recruitmentConfig' });
RecruitmentConfig.belongsTo(Company, { foreignKey: 'companyId', as: 'company' });

RecruitmentConfig.hasMany(RecruitmentConfigLog, { foreignKey: 'configId', as: 'configLogs' });
RecruitmentConfigLog.belongsTo(RecruitmentConfig, { foreignKey: 'configId', as: 'config' });

MessageTemplate.hasMany(MessageTemplateLog, { foreignKey: 'templateId', as: 'templateLogs' });
MessageTemplateLog.belongsTo(MessageTemplate, { foreignKey: 'templateId', as: 'template' });

MessageDelivery.hasMany(MessageDeliveryLog, { foreignKey: 'messageId', as: 'deliveryLogs' });
MessageDeliveryLog.belongsTo(MessageDelivery, { foreignKey: 'messageId', as: 'message' });

MessagePermission.hasMany(MessagePermissionLog, { foreignKey: 'permissionId', as: 'permissionLogs' });
MessagePermissionLog.belongsTo(MessagePermission, { foreignKey: 'permissionId', as: 'permission' });

User.hasMany(PermissionLog, { foreignKey: 'userId', as: 'permissionLogs' });
PermissionLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(LoginLog, { foreignKey: 'userId', as: 'loginLogs' });
LoginLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Job.hasMany(Resume, { foreignKey: 'jobId', as: 'resumes' });
Resume.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

Resume.hasMany(Interview, { foreignKey: 'resumeId', as: 'interviews' });
Interview.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });
Interview.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
Interview.belongsTo(User, { foreignKey: 'interviewerId', as: 'interviewerUser' });

Interview.hasMany(InterviewOperationLog, { foreignKey: 'interviewId', as: 'operationLogs' });
InterviewOperationLog.belongsTo(Interview, { foreignKey: 'interviewId', as: 'interview' });

Interview.hasOne(InterviewCancelRecord, { foreignKey: 'interviewId', as: 'cancelRecord' });
InterviewCancelRecord.belongsTo(Interview, { foreignKey: 'interviewId', as: 'interview' });

Interview.hasMany(InterviewMessage, { foreignKey: 'interviewId', as: 'messages' });
InterviewMessage.belongsTo(Interview, { foreignKey: 'interviewId', as: 'interview' });

Interview.hasMany(InterviewerAllocationLog, { foreignKey: 'interviewId', as: 'allocationLogs' });
InterviewerAllocationLog.belongsTo(Interview, { foreignKey: 'interviewId', as: 'interview' });
InterviewerAllocationLog.belongsTo(User, { foreignKey: 'interviewerId', as: 'interviewer' });
InterviewerAllocationLog.belongsTo(User, { foreignKey: 'previousInterviewerId', as: 'previousInterviewer' });
InterviewerAllocationLog.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });

Interview.hasMany(InterviewWarningLog, { foreignKey: 'interviewId', as: 'warningLogs' });
InterviewWarningLog.belongsTo(Interview, { foreignKey: 'interviewId', as: 'interview' });
InterviewWarningLog.belongsTo(User, { foreignKey: 'handlerId', as: 'handler' });
InterviewWarningLog.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });

Resume.hasOne(Onboard, { foreignKey: 'resumeId', as: 'onboard' });
Onboard.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });
Onboard.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
Onboard.belongsTo(Interview, { foreignKey: 'interviewId', as: 'interview' });
Onboard.hasMany(OnboardOperationLog, { foreignKey: 'onboardId', as: 'operationLogs' });
OnboardOperationLog.belongsTo(Onboard, { foreignKey: 'onboardId', as: 'onboard' });
OnboardOperationLog.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });
Onboard.hasOne(OnboardLedger, { foreignKey: 'onboardId', as: 'ledger' });
OnboardLedger.belongsTo(Onboard, { foreignKey: 'onboardId', as: 'onboard' });
OnboardLedger.belongsTo(User, { foreignKey: 'generatedBy', as: 'generator' });
Onboard.belongsTo(User, { foreignKey: 'hrOperatorId', as: 'hrOperator' });
Onboard.belongsTo(User, { foreignKey: 'auditUserId', as: 'auditUser' });

Onboard.hasOne(Probation, { foreignKey: 'onboardId', as: 'probation' });
Probation.belongsTo(Onboard, { foreignKey: 'onboardId', as: 'onboard' });
Probation.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });
Probation.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
Probation.hasMany(ProbationOperationLog, { foreignKey: 'probationId', as: 'operationLogs' });
ProbationOperationLog.belongsTo(Probation, { foreignKey: 'probationId', as: 'probation' });
ProbationOperationLog.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });
Probation.hasMany(ProbationAssessmentIndicator, { foreignKey: 'probationId', as: 'assessmentIndicators' });
ProbationAssessmentIndicator.belongsTo(Probation, { foreignKey: 'probationId', as: 'probation' });

Probation.hasOne(Regularization, { foreignKey: 'probationId', as: 'regularization' });
Regularization.belongsTo(Probation, { foreignKey: 'probationId', as: 'probation' });
Regularization.belongsTo(Onboard, { foreignKey: 'onboardId', as: 'onboard' });
Regularization.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });
Regularization.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });
Regularization.belongsTo(OnboardLedger, { foreignKey: 'onboardId', targetKey: 'onboardId', as: 'ledger' });
Regularization.hasMany(RegularizationApprovalNodeRecord, { foreignKey: 'regularizationId', as: 'approvalNodes' });
RegularizationApprovalNodeRecord.belongsTo(Regularization, { foreignKey: 'regularizationId', as: 'regularization' });
RegularizationApprovalNodeRecord.belongsTo(User, { foreignKey: 'approverId', as: 'approverUser' });
Regularization.hasMany(RegularizationOperationLog, { foreignKey: 'regularizationId', as: 'operationLogs' });
RegularizationOperationLog.belongsTo(Regularization, { foreignKey: 'regularizationId', as: 'regularization' });
RegularizationOperationLog.belongsTo(User, { foreignKey: 'operatorId', as: 'operator' });
Regularization.belongsTo(User, { foreignKey: 'hrOperatorId', as: 'hrOperator' });

Qualification.hasMany(QualificationAuditLog, { foreignKey: 'qualificationId', as: 'auditLogs' });
QualificationAuditLog.belongsTo(Qualification, { foreignKey: 'qualificationId', as: 'qualification' });

Job.hasMany(JobOperationLog, { foreignKey: 'jobId', as: 'operationLogs' });
JobOperationLog.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

Resume.hasMany(ResumeParseLog, { foreignKey: 'resumeId', as: 'parseLogs' });
ResumeParseLog.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });

Resume.hasMany(ResumeScreenLog, { foreignKey: 'resumeId', as: 'screenLogs' });
ResumeScreenLog.belongsTo(Resume, { foreignKey: 'resumeId', as: 'resume' });

Job.hasMany(ResumeScreenLog, { foreignKey: 'jobId', as: 'screenLogs' });
ResumeScreenLog.belongsTo(Job, { foreignKey: 'jobId', as: 'job' });

export {
  Company, Job, JobOperationLog,
  Resume, ResumeParseLog, ResumeScreenLog, ScreenTemplate,
  Interview, InterviewOperationLog, InterviewCancelRecord, InterviewMessage, InterviewerAllocationLog, InterviewWarningLog,
  Onboard, OnboardOperationLog, OnboardLedger,
  User, Qualification, QualificationAuditLog,
  CompanyChangeLog, RecruitmentConfig, RecruitmentConfigLog,
  MessageTemplate, MessageTemplateLog,
  MessageDelivery, MessageDeliveryLog,
  MessagePermission, MessagePermissionLog,
  PermissionLog, LoginLog,
  Probation, ProbationOperationLog, ProbationAssessmentIndicator,
  Regularization, RegularizationApprovalNodeRecord, RegularizationOperationLog
};
